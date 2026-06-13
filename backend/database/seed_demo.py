"""
OODA Seed Demo Data
Pre-built demo scenario: RivalFlow drops pricing from ₹999 to ₹749.
"""

from datetime import datetime
from backend.database.models import SessionLocal
from backend.database import crud


DEMO_COMPETITOR = {
    "id": "comp_001",
    "name": "RivalFlow",
    "website_url": "https://rivalflow.io",
    "pricing_url": "https://rivalflow.io/pricing",
    "category": "Marketing Automation",
    "created_at": datetime.now().isoformat(),
}

DEMO_SIGNALS = [
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
        "timestamp": "2026-06-13T02:17:00+05:30",
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
        "timestamp": "2026-06-13T06:45:00+05:30",
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
        "timestamp": "2026-06-12T18:30:00+05:30",
        "processed": 0,
    },
]

DEMO_REPUTATIONS = [
    {"agent_name": "Marketing AI", "reputation_score": 1.03, "total_debates": 12, "correct_predictions": 10},
    {"agent_name": "Product AI", "reputation_score": 0.97, "total_debates": 12, "correct_predictions": 9},
    {"agent_name": "Sales AI", "reputation_score": 1.08, "total_debates": 12, "correct_predictions": 11},
    {"agent_name": "Strategy AI", "reputation_score": 1.05, "total_debates": 12, "correct_predictions": 11},
]


def seed_demo_data():
    """Insert demo competitor, signals, and agent reputations. Clears existing data first."""
    db = SessionLocal()
    try:
        # Clear existing data
        crud.clear_all_data(db)

        # Seed competitor
        crud.create_competitor(db, **DEMO_COMPETITOR)

        # Seed signals
        for sig in DEMO_SIGNALS:
            crud.create_signal(db, **sig)

        # Seed reputations
        for rep in DEMO_REPUTATIONS:
            crud.create_or_update_reputation(
                db,
                agent_name=rep["agent_name"],
                score=rep["reputation_score"],
            )
            # Update additional fields
            db_rep = crud.get_reputation(db, rep["agent_name"])
            if db_rep:
                db_rep.total_debates = rep["total_debates"]
                db_rep.correct_predictions = rep["correct_predictions"]
                db_rep.updated_at = datetime.now().isoformat()
                db.commit()

        return {
            "status": "success",
            "competitors": 1,
            "signals": len(DEMO_SIGNALS),
            "reputations": len(DEMO_REPUTATIONS),
        }
    finally:
        db.close()
