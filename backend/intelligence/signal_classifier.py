"""
OODA Signal Classifier — Phase 2
Classifies incoming signals by type, severity, and impact area.
Provides utility functions used by the Entropy Calculator and Agent System.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


# ── Signal Type Taxonomy ──────────────────────────────────────────────────────

SIGNAL_TYPES = {
    "price_change":     {"category": "pricing",   "base_severity": "HIGH",   "impact_areas": ["sales", "marketing"]},
    "pricing_update":   {"category": "pricing",   "base_severity": "MEDIUM", "impact_areas": ["sales", "marketing"]},
    "news_mention":     {"category": "media",     "base_severity": "MEDIUM", "impact_areas": ["marketing"]},
    "press_release":    {"category": "media",     "base_severity": "MEDIUM", "impact_areas": ["marketing", "product"]},
    "media_coverage":   {"category": "media",     "base_severity": "LOW",    "impact_areas": ["marketing"]},
    "feature_launch":   {"category": "product",   "base_severity": "MEDIUM", "impact_areas": ["product", "marketing"]},
    "product_update":   {"category": "product",   "base_severity": "LOW",    "impact_areas": ["product"]},
    "changelog":        {"category": "product",   "base_severity": "LOW",    "impact_areas": ["product"]},
    "review_change":    {"category": "sentiment", "base_severity": "MEDIUM", "impact_areas": ["marketing", "sales"]},
    "sentiment_shift":  {"category": "sentiment", "base_severity": "MEDIUM", "impact_areas": ["marketing"]},
    "social_mention":   {"category": "sentiment", "base_severity": "LOW",    "impact_areas": ["marketing"]},
    "github_activity":  {"category": "product",   "base_severity": "LOW",    "impact_areas": ["product"]},
    "funding_round":    {"category": "business",  "base_severity": "HIGH",   "impact_areas": ["marketing", "sales", "product"]},
    "leadership_change":{"category": "business",  "base_severity": "MEDIUM", "impact_areas": ["marketing"]},
    "partnership":      {"category": "business",  "base_severity": "MEDIUM", "impact_areas": ["marketing", "sales"]},
    "website_change":   {"category": "marketing", "base_severity": "LOW",    "impact_areas": ["marketing"]},
}


@dataclass
class SignalClassification:
    """Result of classifying a signal."""
    signal_type: str
    category: str
    severity: str
    impact_areas: list[str]
    is_pricing_related: bool
    is_product_related: bool
    is_sentiment_related: bool
    percentage_change: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "signal_type": self.signal_type,
            "category": self.category,
            "severity": self.severity,
            "impact_areas": self.impact_areas,
            "is_pricing_related": self.is_pricing_related,
            "is_product_related": self.is_product_related,
            "is_sentiment_related": self.is_sentiment_related,
            "percentage_change": self.percentage_change,
        }


def classify_signal(
    signal_type: str,
    severity: Optional[str] = None,
    percentage_change: Optional[float] = None,
) -> SignalClassification:
    """
    Classify a signal based on its type and optional metadata.

    If severity is not provided, uses the base severity from the taxonomy.
    If percentage_change is provided and large (>=20%), auto-escalate severity to HIGH.
    """
    type_info = SIGNAL_TYPES.get(signal_type, {
        "category": "unknown",
        "base_severity": "MEDIUM",
        "impact_areas": [],
    })

    final_severity = severity or type_info["base_severity"]

    # Auto-escalate for large percentage changes
    if percentage_change is not None and abs(percentage_change) >= 20:
        final_severity = "HIGH"
    elif percentage_change is not None and abs(percentage_change) >= 10:
        if final_severity == "LOW":
            final_severity = "MEDIUM"

    category = type_info["category"]

    return SignalClassification(
        signal_type=signal_type,
        category=category,
        severity=final_severity,
        impact_areas=type_info["impact_areas"],
        is_pricing_related=category == "pricing",
        is_product_related=category == "product",
        is_sentiment_related=category == "sentiment",
        percentage_change=percentage_change,
    )


def get_severity_weight(severity: str) -> float:
    """
    Return a numeric weight for signal severity.
    Used by the entropy calculator for weighting.
    """
    return {"HIGH": 3.0, "MEDIUM": 2.0, "LOW": 1.0}.get(severity, 1.0)


def get_signal_categories() -> list[str]:
    """Return all valid signal categories."""
    return list(set(info["category"] for info in SIGNAL_TYPES.values()))


def get_signal_types_for_category(category: str) -> list[str]:
    """Return all signal types belonging to a category."""
    return [
        stype for stype, info in SIGNAL_TYPES.items()
        if info["category"] == category
    ]
