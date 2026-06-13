"""
OODA Seed Demo Data
Pre-built demo scenario: RivalFlow drops pricing from ₹999 to ₹749.

Timestamps are relative to current time so all signals always fall
within the 24-hour entropy calculation window for consistent demos.
"""

from datetime import datetime, timezone, timedelta
from backend.database.models import SessionLocal
from backend.database import crud


def _relative_ts(hours_ago: float) -> str:
    """Return ISO timestamp for N hours ago (always within entropy window)."""
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()


DEMO_COMPETITOR = {
    "id": "comp_001",
    "name": "RivalFlow",
    "website_url": "https://rivalflow.io",
    "pricing_url": "https://rivalflow.io/pricing",
    "category": "Marketing Automation",
    "created_at": datetime.now(timezone.utc).isoformat(),
}

DEMO_REPUTATIONS = [
    {"agent_name": "Marketing AI", "reputation_score": 1.03, "total_debates": 12, "correct_predictions": 10},
    {"agent_name": "Product AI", "reputation_score": 0.97, "total_debates": 12, "correct_predictions": 9},
    {"agent_name": "Sales AI", "reputation_score": 1.08, "total_debates": 12, "correct_predictions": 11},
    {"agent_name": "Strategy AI", "reputation_score": 1.05, "total_debates": 12, "correct_predictions": 11},
]


def _build_demo_signals() -> list[dict]:
    """Build demo signals with timestamps relative to now."""
    return [
        {
            "id": "sig_001",
            "competitor_id": "comp_001",
            "source": "web_watcher",
            "signal_type": "price_change",
            "summary": "RivalFlow dropped pricing from ₹999/month to ₹749/month — a 25% price cut.",
            "raw_content": "Pricing page changed at 2:17 AM IST. Old price: ₹999/month (Pro Plan). New price: ₹749/month (Pro Plan). New copy emphasizes 'Most affordable marketing automation for growing teams'.",
            "old_value": "₹999/month",
            "new_value": "₹749/month",
            "percentage_change": -25.0,
            "severity": "HIGH",
            "timestamp": _relative_ts(2),  # 2 hours ago
            "processed": 0,
        },
        {
            "id": "sig_002",
            "competitor_id": "comp_001",
            "source": "news_api",
            "signal_type": "news_mention",
            "summary": "RivalFlow featured in TechCrunch: 'RivalFlow slashes prices to capture SMB market'.",
            "raw_content": "TechCrunch article published at 6:45 AM IST covering RivalFlow's aggressive pricing strategy aimed at capturing price-sensitive SMB customers.",
            "old_value": None,
            "new_value": None,
            "percentage_change": None,
            "severity": "MEDIUM",
            "timestamp": _relative_ts(6),  # 6 hours ago
            "processed": 0,
        },
        {
            "id": "sig_003",
            "competitor_id": "comp_001",
            "source": "web_watcher",
            "signal_type": "feature_launch",
            "summary": "RivalFlow launched AI-powered email subject line generator on their platform.",
            "raw_content": "Changelog updated: 'New feature — AI Subject Line Generator. Write high-converting email subjects in seconds.' Positioned as included in all plans.",
            "old_value": None,
            "new_value": "AI Subject Line Generator",
            "percentage_change": None,
            "severity": "LOW",
            "timestamp": _relative_ts(12),  # 12 hours ago
            "processed": 0,
        },
        {
            "id": "sig_004",
            "competitor_id": "comp_001",
            "source": "reddit_api",
            "signal_type": "social_mention",
            "summary": "Reddit thread comparing our pricing to RivalFlow's new ₹749/month plan gaining traction.",
            "raw_content": "r/SaaS thread: 'Just saw RivalFlow dropped to ₹749. Why am I still paying ₹999 for [our product]?' — 47 upvotes, 23 comments in 4 hours.",
            "old_value": None,
            "new_value": None,
            "percentage_change": None,
            "severity": "HIGH",
            "timestamp": _relative_ts(4),  # 4 hours ago
            "processed": 0,
        },
    ]



def seed_demo_data():
    """Insert demo competitor, signals, and agent reputations. Clears existing data first."""
    db = SessionLocal()
    try:
        # Clear existing data
        crud.clear_all_data(db)

        # Seed competitor
        crud.create_competitor(db, **DEMO_COMPETITOR)

        # Seed signals (timestamps are relative to now)
        demo_signals = _build_demo_signals()
        for sig in demo_signals:
            crud.create_signal(db, **sig)

        # Seed reputations in a single pass (no double round-trip)
        now = datetime.now(timezone.utc).isoformat()
        for rep in DEMO_REPUTATIONS:
            from backend.database.models import AgentReputation
            db_rep = AgentReputation(
                agent_name=rep["agent_name"],
                reputation_score=rep["reputation_score"],
                total_debates=rep["total_debates"],
                correct_predictions=rep["correct_predictions"],
                updated_at=now,
            )
            db.add(db_rep)
        db.commit()

        return {
            "status": "success",
            "competitors": 1,
            "signals": len(demo_signals),
            "reputations": len(DEMO_REPUTATIONS),
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

