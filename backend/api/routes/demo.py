"""
Demo Routes — Seed data and trigger demo scenarios.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database.seed_demo import seed_demo_data
from backend.database import crud
from backend.api.schemas import APIMessageResponse, SeedResponse

router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.post("/seed", response_model=SeedResponse)
def seed_data():
    """
    Wipe and re-seed the database with the RivalFlow demo scenario.
    Safe to call multiple times — clears existing data first.
    """
    result = seed_demo_data()
    return SeedResponse(
        status="success",
        message="Demo data seeded successfully.",
        competitors_seeded=result["competitors"],
        signals_seeded=result["signals"],
        reputations_seeded=result["reputations"],
    )


@router.post("/trigger-price-drop", response_model=APIMessageResponse)
def trigger_price_drop(db: Session = Depends(get_db)):
    """
    Simulate a real-time price drop signal from RivalFlow.
    Requires seed data to exist (comp_001 must be in DB).
    """
    competitor = crud.get_competitor(db, "comp_001")
    if not competitor:
        raise HTTPException(
            status_code=400,
            detail="Demo data not seeded. Call POST /api/demo/seed first.",
        )

    signal = crud.create_signal(
        db,
        id=crud._generate_id("sig"),
        competitor_id="comp_001",
        source="web_watcher",
        signal_type="price_change",
        summary="LIVE: RivalFlow just dropped pricing from ₹999/month to ₹749/month — 25% price cut detected.",
        raw_content=(
            "Pricing page change detected. "
            "Old: ₹999/month → New: ₹749/month. "
            "New messaging: 'Most affordable marketing automation for growing teams'."
        ),
        old_value="₹999/month",
        new_value="₹749/month",
        percentage_change=-25.0,
        severity="HIGH",
    )

    return APIMessageResponse(
        status="success",
        message=f"Price drop signal created: {signal.id}",
    )
