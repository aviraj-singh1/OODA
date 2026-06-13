"""
Demo Routes — Seed data and trigger demo scenarios.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database.seed_demo import seed_demo_data
from backend.database import crud
from backend.api.schemas import StatusResponse
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.post("/seed", response_model=StatusResponse)
def seed_data():
    """Wipe and re-seed the database with demo data."""
    result = seed_demo_data()
    return StatusResponse(
        status="success",
        message="Demo data seeded successfully.",
        data=result,
    )


@router.post("/trigger-price-drop", response_model=StatusResponse)
def trigger_price_drop(db: Session = Depends(get_db)):
    """
    Simulate a real-time price drop signal from RivalFlow.
    Creates a new signal as if just detected.
    """
    signal_id = f"sig_{uuid.uuid4().hex[:8]}"
    now = datetime.now().isoformat()

    crud.create_signal(
        db,
        id=signal_id,
        competitor_id="comp_001",
        source="web_watcher",
        signal_type="price_change",
        summary="LIVE: RivalFlow just dropped pricing from ₹999/month to ₹749/month — 25% price cut detected.",
        raw_content=f"Pricing page change detected at {now}. Old: ₹999/month → New: ₹749/month. New messaging: 'Most affordable marketing automation for growing teams'.",
        old_value="₹999/month",
        new_value="₹749/month",
        percentage_change=-25.0,
        severity="HIGH",
        timestamp=now,
        processed=0,
    )

    return StatusResponse(
        status="success",
        message=f"Price drop signal triggered: {signal_id}",
        data={"signal_id": signal_id, "timestamp": now},
    )
