"""
Entropy Routes — Placeholder for Phase 2.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/entropy", tags=["Entropy"])


@router.get("/current")
def get_current_entropy():
    """Placeholder — returns static entropy for Phase 0."""
    return {
        "score": 73,
        "status": "High Volatility",
        "reason": "Competitor price cut + renewal risk + market messaging shift.",
        "components": {
            "pricing_shock": 100,
            "news_spike": 50,
            "sentiment_shift": 40,
            "sales_risk": 85,
            "product_velocity": 30,
            "source_reliability": 90,
        },
    }


@router.get("/history")
def get_entropy_history():
    """Placeholder — returns mock history for Phase 0."""
    return [
        {"timestamp": "2026-06-13T00:00:00", "score": 34, "status": "Stable"},
        {"timestamp": "2026-06-13T02:17:00", "score": 73, "status": "High Volatility"},
    ]
