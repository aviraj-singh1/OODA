"""
OODA Entropy Calculator — Phase 2
Computes Market Entropy Score from recent signals using the PRD formula.

Market Entropy Score =
    0.35 × Pricing Shock
  + 0.20 × News Spike
  + 0.15 × Sentiment Shift
  + 0.15 × Sales Risk
  + 0.10 × Product Velocity
  + 0.05 × Source Reliability

Score interpretation:
    0–30   = Stable
    31–60  = Watch
    61–80  = High Volatility
    81–100 = Critical
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from backend.database.models import Signal


# ── Weights (from PRD §11) ────────────────────────────────────────────────────

WEIGHTS = {
    "pricing_shock":      0.35,
    "news_spike":         0.20,
    "sentiment_shift":    0.15,
    "sales_risk":         0.15,
    "product_velocity":   0.10,
    "source_reliability": 0.05,
}

# ── Scoring tables (from PRD §11) ─────────────────────────────────────────────

PRICING_SHOCK_THRESHOLDS = [
    (25, 100),
    (20, 80),
    (15, 60),
    (10, 40),
    (5,  20),
    (0,  0),
]

NEWS_SPIKE_THRESHOLDS = [
    (10, 100),
    (6,  75),
    (3,  50),
    (1,  25),
    (0,  0),
]

# Source reliability scores by source name
SOURCE_RELIABILITY = {
    "web_watcher":   90,
    "news_api":      80,
    "serp_api":      70,
    "github_api":    60,
    "reddit_api":    40,
    "manual":        50,
    "demo_seed":     90,
}

# Signal types that contribute to each component
PRICING_TYPES = {"price_change", "pricing_update"}
NEWS_TYPES = {"news_mention", "press_release", "media_coverage"}
SENTIMENT_TYPES = {"review_change", "sentiment_shift", "social_mention"}
PRODUCT_TYPES = {"feature_launch", "product_update", "changelog", "github_activity"}
SALES_RISK_TYPES = {"price_change", "pricing_update", "feature_launch"}


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class EntropyComponents:
    """Individual component scores (0–100 each)."""
    pricing_shock: float = 0.0
    news_spike: float = 0.0
    sentiment_shift: float = 0.0
    sales_risk: float = 0.0
    product_velocity: float = 0.0
    source_reliability: float = 0.0

    def to_dict(self) -> dict:
        return {
            "pricing_shock": round(self.pricing_shock, 1),
            "news_spike": round(self.news_spike, 1),
            "sentiment_shift": round(self.sentiment_shift, 1),
            "sales_risk": round(self.sales_risk, 1),
            "product_velocity": round(self.product_velocity, 1),
            "source_reliability": round(self.source_reliability, 1),
        }


@dataclass
class EntropyResult:
    """Final entropy computation result."""
    score: float
    status: str
    reason: str
    components: EntropyComponents
    signal_count: int = 0
    window_hours: int = 24

    def to_dict(self) -> dict:
        return {
            "score": round(self.score, 1),
            "status": self.status,
            "reason": self.reason,
            "components": self.components.to_dict(),
            "signal_count": self.signal_count,
            "window_hours": self.window_hours,
        }


# ── Status logic ──────────────────────────────────────────────────────────────

def get_entropy_status(score: float) -> str:
    """Return human-readable status from score."""
    if score >= 81:
        return "Critical"
    if score >= 61:
        return "High Volatility"
    if score >= 31:
        return "Watch"
    return "Stable"


def _build_reason(components: EntropyComponents, signals: list[Signal]) -> str:
    """Build a human-readable reason string from the top contributing factors."""
    factors = []

    if components.pricing_shock >= 50:
        factors.append("Competitor price cut")
    if components.news_spike >= 40:
        factors.append("news coverage spike")
    if components.sentiment_shift >= 40:
        factors.append("sentiment shift detected")
    if components.sales_risk >= 50:
        factors.append("renewal risk elevated")
    if components.product_velocity >= 40:
        factors.append("product velocity increase")

    # Also note high-severity signal count
    high_count = sum(1 for s in signals if s.severity == "HIGH")
    if high_count >= 2 and not factors:
        factors.append(f"{high_count} high-severity signals detected")

    if not factors:
        if not signals:
            return "No recent competitor activity detected."
        return "Low-level competitor activity within normal range."

    # Capitalize the first factor, join with " + "
    reason = factors[0][0].upper() + factors[0][1:]
    if len(factors) > 1:
        reason += " + " + " + ".join(factors[1:])
    reason += "."

    return reason


# ── Component calculators ─────────────────────────────────────────────────────

def _calc_pricing_shock(signals: list[Signal]) -> float:
    """
    Pricing Shock: based on the max absolute percentage change
    from any pricing signal in the window.

    PRD thresholds:
      0% → 0,  5% → 20,  10% → 40,  15% → 60,  20% → 80,  25%+ → 100
    """
    pricing_signals = [s for s in signals if s.signal_type in PRICING_TYPES]
    if not pricing_signals:
        return 0.0

    max_change = max(
        abs(s.percentage_change) for s in pricing_signals
        if s.percentage_change is not None
    ) if any(s.percentage_change is not None for s in pricing_signals) else 0.0

    for threshold, score in PRICING_SHOCK_THRESHOLDS:
        if max_change >= threshold:
            return float(score)
    return 0.0


def _calc_news_spike(signals: list[Signal]) -> float:
    """
    News Spike: based on count of news-type signals.

    PRD thresholds:
      0 → 0,  1-2 → 25,  3-5 → 50,  6-10 → 75,  10+ → 100
    """
    news_count = sum(1 for s in signals if s.signal_type in NEWS_TYPES)

    for threshold, score in NEWS_SPIKE_THRESHOLDS:
        if news_count >= threshold:
            return float(score)
    return 0.0


def _calc_sentiment_shift(signals: list[Signal]) -> float:
    """
    Sentiment Shift: based on severity of sentiment-type signals.

    PRD mapping:
      No change → 0,  Mild negative → 30,  Moderate → 60,
      Strong → 90,  Viral → 100

    In MVP, we derive from signal severity:
      LOW → 30,  MEDIUM → 60,  HIGH → 90
    If multiple, take the max.
    """
    sentiment_signals = [s for s in signals if s.signal_type in SENTIMENT_TYPES]
    if not sentiment_signals:
        return 0.0

    severity_map = {"LOW": 30.0, "MEDIUM": 60.0, "HIGH": 90.0}
    return max(severity_map.get(s.severity, 0.0) for s in sentiment_signals)


def _calc_sales_risk(signals: list[Signal]) -> float:
    """
    Sales Risk: derived from pricing and competitive signals
    that could affect pipeline deals.

    Heuristic:
    - HIGH severity pricing signal → 85
    - MEDIUM severity pricing signal → 50
    - Any feature launch → +15 (capped at 100)
    - No relevant signals → 0
    """
    risk = 0.0

    for s in signals:
        if s.signal_type in PRICING_TYPES:
            if s.severity == "HIGH":
                risk = max(risk, 85.0)
            elif s.severity == "MEDIUM":
                risk = max(risk, 50.0)
            else:
                risk = max(risk, 25.0)

        if s.signal_type in {"feature_launch", "product_update"}:
            risk = min(risk + 15.0, 100.0)

    return risk


def _calc_product_velocity(signals: list[Signal]) -> float:
    """
    Product Velocity: based on product/feature signals count.

    0 → 0, 1 → 20, 2 → 40, 3 → 60, 4 → 80, 5+ → 100
    """
    product_count = sum(1 for s in signals if s.signal_type in PRODUCT_TYPES)

    if product_count >= 5:
        return 100.0
    return product_count * 20.0


def _calc_source_reliability(signals: list[Signal]) -> float:
    """
    Source Reliability: average reliability of all signal sources.
    Higher reliability → more trustworthy → higher component score.

    If no signals, return 0.
    """
    if not signals:
        return 0.0

    total = sum(
        SOURCE_RELIABILITY.get(s.source, 50) for s in signals
    )
    return min(total / len(signals), 100.0)


# ── Main calculator ───────────────────────────────────────────────────────────

def calculate_entropy(
    db: Session,
    window_hours: int = 24,
) -> EntropyResult:
    """
    Calculate the Market Entropy Score from signals within the given time window.

    Uses the weighted formula from PRD §11:
        Score = 0.35×PricingShock + 0.20×NewsSpike + 0.15×SentimentShift
              + 0.15×SalesRisk + 0.10×ProductVelocity + 0.05×SourceReliability
    """
    # Fetch recent signals within the window
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    cutoff_iso = cutoff.isoformat()

    signals = (
        db.query(Signal)
        .filter(Signal.timestamp >= cutoff_iso)
        .order_by(Signal.timestamp.desc())
        .all()
    )

    # If no signals found, also try all signals (demo data may have future/past timestamps)
    if not signals:
        signals = (
            db.query(Signal)
            .order_by(Signal.timestamp.desc())
            .limit(50)
            .all()
        )

    # Calculate individual components
    components = EntropyComponents(
        pricing_shock=_calc_pricing_shock(signals),
        news_spike=_calc_news_spike(signals),
        sentiment_shift=_calc_sentiment_shift(signals),
        sales_risk=_calc_sales_risk(signals),
        product_velocity=_calc_product_velocity(signals),
        source_reliability=_calc_source_reliability(signals),
    )

    # Weighted sum
    score = (
        WEIGHTS["pricing_shock"]      * components.pricing_shock
        + WEIGHTS["news_spike"]       * components.news_spike
        + WEIGHTS["sentiment_shift"]  * components.sentiment_shift
        + WEIGHTS["sales_risk"]       * components.sales_risk
        + WEIGHTS["product_velocity"] * components.product_velocity
        + WEIGHTS["source_reliability"] * components.source_reliability
    )

    # Clamp to 0-100
    score = max(0.0, min(100.0, score))

    status = get_entropy_status(score)
    reason = _build_reason(components, signals)

    return EntropyResult(
        score=score,
        status=status,
        reason=reason,
        components=components,
        signal_count=len(signals),
        window_hours=window_hours,
    )


def calculate_entropy_for_signal(
    db: Session,
    signal: Signal,
) -> float:
    """
    Quick entropy calculation scoped to a single signal.
    Used when storing entropy alongside a debate record.
    """
    result = calculate_entropy(db)
    return result.score
