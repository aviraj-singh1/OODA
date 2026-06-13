"""
Entropy Routes — Phase 2: Real entropy calculation from signal data.
Provides current score, component breakdown, and history timeline.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.intelligence.entropy_calculator import calculate_entropy

router = APIRouter(prefix="/api/entropy", tags=["Entropy"])


@router.get("/current")
def get_current_entropy(
    window_hours: int = Query(default=24, ge=1, le=168, description="Look-back window in hours"),
    db: Session = Depends(get_db),
):
    """
    Calculate the current Market Entropy Score from recent signals.

    Uses the weighted formula:
        0.35×PricingShock + 0.20×NewsSpike + 0.15×SentimentShift
      + 0.15×SalesRisk + 0.10×ProductVelocity + 0.05×SourceReliability

    Returns score (0-100), status, reason, component breakdown, signal count, and window.
    """
    result = calculate_entropy(db, window_hours=window_hours)
    return result.to_dict()


@router.get("/components")
def get_entropy_components(
    window_hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    """
    Return the 6 entropy components as a structured list for chart rendering.
    Each component includes name, score, weight, and weighted contribution.
    """
    result = calculate_entropy(db, window_hours=window_hours)
    components = result.components

    weights = {
        "pricing_shock": 0.35,
        "news_spike": 0.20,
        "sentiment_shift": 0.15,
        "sales_risk": 0.15,
        "product_velocity": 0.10,
        "source_reliability": 0.05,
    }

    labels = {
        "pricing_shock": "Pricing Shock",
        "news_spike": "News Spike",
        "sentiment_shift": "Sentiment Shift",
        "sales_risk": "Sales Risk",
        "product_velocity": "Product Velocity",
        "source_reliability": "Source Reliability",
    }

    component_dict = components.to_dict()
    breakdown = []
    for key, weight in weights.items():
        raw_score = component_dict[key]
        breakdown.append({
            "key": key,
            "label": labels[key],
            "score": raw_score,
            "weight": weight,
            "weighted": round(raw_score * weight, 1),
        })

    return {
        "total_score": round(result.score, 1),
        "status": result.status,
        "signal_count": result.signal_count,
        "components": breakdown,
    }


@router.get("/history")
def get_entropy_history(db: Session = Depends(get_db)):
    """
    Return entropy snapshots over time.
    In Phase 2, we compute current + simulated baseline for the demo timeline.
    Timestamps are relative to the current time for demo portability.
    """
    # Current entropy
    current = calculate_entropy(db)
    now = datetime.now(timezone.utc)

    # Build a mini history: baseline before signals + current
    # Timestamps are relative to 'now' so the demo works on any date
    history = [
        {
            "timestamp": (now - timedelta(hours=18)).isoformat(),
            "score": 12,
            "status": "Stable",
            "reason": "Market quiet. No competitor activity.",
        },
        {
            "timestamp": (now - timedelta(hours=12)).isoformat(),
            "score": 24,
            "status": "Stable",
            "reason": "Minor feature launch detected.",
        },
        {
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "score": 18,
            "status": "Stable",
            "reason": "No significant competitor activity.",
        },
        {
            "timestamp": (now - timedelta(hours=2)).isoformat(),
            "score": round(current.score, 1),
            "status": current.status,
            "reason": current.reason,
        },
        {
            "timestamp": now.isoformat(),
            "score": round(min(current.score + 5, 100), 1),
            "status": current.status,
            "reason": "News coverage amplifying pricing signal.",
        },
    ]

    return history

