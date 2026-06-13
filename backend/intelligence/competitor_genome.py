"""
OODA Competitor Genome — Phase 2
Builds a competitive profile for each tracked competitor
from their accumulated signals.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from backend.database.models import Signal, Competitor
from backend.database import crud
from backend.intelligence.signal_classifier import classify_signal


@dataclass
class CompetitorGenome:
    """A structured competitive profile built from signal history."""
    competitor_id: str
    competitor_name: str
    category: Optional[str] = None
    website_url: Optional[str] = None

    # Counts by signal type
    total_signals: int = 0
    pricing_signals: int = 0
    product_signals: int = 0
    news_signals: int = 0
    sentiment_signals: int = 0

    # Derived insights
    threat_level: str = "LOW"          # LOW, MEDIUM, HIGH, CRITICAL
    activity_score: float = 0.0        # 0-100 how active they are
    latest_move: Optional[str] = None  # Summary of most recent signal
    latest_move_time: Optional[str] = None

    # Pricing intel
    current_price: Optional[str] = None
    last_price_change: Optional[float] = None  # percentage

    def to_dict(self) -> dict:
        return {
            "competitor_id": self.competitor_id,
            "competitor_name": self.competitor_name,
            "category": self.category,
            "website_url": self.website_url,
            "total_signals": self.total_signals,
            "pricing_signals": self.pricing_signals,
            "product_signals": self.product_signals,
            "news_signals": self.news_signals,
            "sentiment_signals": self.sentiment_signals,
            "threat_level": self.threat_level,
            "activity_score": round(self.activity_score, 1),
            "latest_move": self.latest_move,
            "latest_move_time": self.latest_move_time,
            "current_price": self.current_price,
            "last_price_change": self.last_price_change,
        }


def _calculate_threat_level(genome: CompetitorGenome) -> str:
    """Derive threat level from signal composition."""
    # HIGH severity pricing signals → CRITICAL
    if genome.pricing_signals >= 2:
        return "CRITICAL"
    if genome.pricing_signals >= 1 and genome.news_signals >= 1:
        return "HIGH"
    if genome.total_signals >= 5:
        return "HIGH"
    if genome.total_signals >= 3:
        return "MEDIUM"
    if genome.total_signals >= 1:
        return "LOW"
    return "DORMANT"


def _calculate_activity_score(total_signals: int) -> float:
    """Simple activity score based on signal count. 0-100."""
    # 0 signals → 0, 1 → 20, 3 → 50, 5 → 75, 10+ → 100
    if total_signals >= 10:
        return 100.0
    if total_signals >= 5:
        return 75.0
    if total_signals >= 3:
        return 50.0
    if total_signals >= 1:
        return 20.0
    return 0.0


def build_competitor_genome(
    db: Session,
    competitor_id: str,
) -> Optional[CompetitorGenome]:
    """
    Build a CompetitorGenome from all signals for a given competitor.
    Returns None if competitor not found.
    """
    competitor = crud.get_competitor(db, competitor_id)
    if not competitor:
        return None

    signals = crud.get_signals_by_competitor(db, competitor_id)

    genome = CompetitorGenome(
        competitor_id=competitor.id,
        competitor_name=competitor.name,
        category=competitor.category,
        website_url=competitor.website_url,
        total_signals=len(signals),
    )

    for sig in signals:
        classification = classify_signal(
            sig.signal_type,
            sig.severity,
            sig.percentage_change,
        )
        if classification.is_pricing_related:
            genome.pricing_signals += 1
        if classification.is_product_related:
            genome.product_signals += 1
        if classification.is_sentiment_related:
            genome.sentiment_signals += 1
        if classification.category == "media":
            genome.news_signals += 1

    # Latest move
    if signals:
        latest = signals[0]  # Already ordered by timestamp desc
        genome.latest_move = latest.summary
        genome.latest_move_time = latest.timestamp

        # Extract pricing info from pricing signals
        pricing = [s for s in signals if s.signal_type in {"price_change", "pricing_update"}]
        if pricing:
            genome.current_price = pricing[0].new_value
            genome.last_price_change = pricing[0].percentage_change

    genome.threat_level = _calculate_threat_level(genome)
    genome.activity_score = _calculate_activity_score(genome.total_signals)

    return genome


def build_all_genomes(db: Session) -> list[CompetitorGenome]:
    """Build genomes for all tracked competitors."""
    competitors = crud.get_competitors(db)
    genomes = []
    for comp in competitors:
        genome = build_competitor_genome(db, comp.id)
        if genome:
            genomes.append(genome)
    return genomes
