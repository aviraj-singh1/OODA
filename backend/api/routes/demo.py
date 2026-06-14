"""
Demo Routes — Seed data, trigger demo scenarios, and run full demo flow.
Phase 7: Added one-click full demo flow endpoint.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database.seed_demo import seed_demo_data
from backend.database import crud
from backend.api.schemas import APIMessageResponse, SeedResponse
from backend.agents.agent_runner import run_all_agents
from backend.intelligence.entropy_calculator import calculate_entropy
from backend.debate.debate_engine import DebateEngine
from backend.counter_strike.package_builder import PackageBuilder

router = APIRouter(prefix="/api/demo", tags=["Demo"])

# Pre-instantiate engines
_debate_engine = DebateEngine()
_package_builder = PackageBuilder()


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


@router.post("/run-full-flow")
def run_full_demo_flow(db: Session = Depends(get_db)):
    """
    One-click full OODA demo flow.

    Steps:
    1. Seed demo data if needed
    2. Trigger RivalFlow price drop
    3. Calculate/update entropy
    4. Run agents on the price drop signal
    5. Run debate
    6. Build Counter-Strike package
    7. Return complete summary

    Does NOT auto-deploy. Deployment should be clicked manually.
    """
    try:
        # ── Step 1: Seed demo data if no competitors exist ───────────
        competitors = crud.get_competitors(db)
        if not competitors:
            seed_demo_data()

        # ── Step 2: Trigger price drop ───────────────────────────────
        competitor = crud.get_competitor(db, "comp_001")
        if not competitor:
            raise HTTPException(
                status_code=500,
                detail="Failed to seed demo data — comp_001 not found.",
            )

        price_signal = crud.create_signal(
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
        signal_id = price_signal.id

        # ── Step 3: Calculate entropy ────────────────────────────────
        entropy_result = calculate_entropy(db)
        entropy_score = entropy_result.score

        # ── Step 4: Run agents ───────────────────────────────────────
        signal_dict = {
            "id": price_signal.id,
            "competitor_id": price_signal.competitor_id,
            "source": price_signal.source,
            "signal_type": price_signal.signal_type,
            "summary": price_signal.summary,
            "raw_content": price_signal.raw_content,
            "old_value": price_signal.old_value,
            "new_value": price_signal.new_value,
            "percentage_change": price_signal.percentage_change,
            "severity": price_signal.severity,
            "timestamp": price_signal.timestamp,
        }

        agent_verdicts = run_all_agents(signal_dict, entropy_score)

        # Save verdicts
        for v in agent_verdicts:
            generated_by = v.pop("_generated_by", "demo_fallback")
            evidence_data = {
                "points": v["evidence"],
                "generated_by": generated_by,
            }
            crud.create_verdict(
                db=db,
                id=crud._generate_id("vrd"),
                signal_id=signal_id,
                agent_name=v["agent_name"],
                agent_codename=v["agent_codename"],
                verdict=v["verdict"],
                confidence=v["confidence"],
                reasoning=v["reasoning"],
                evidence_json=json.dumps(evidence_data),
                recommended_action=v["recommended_action"],
                urgency=v["urgency"],
                reputation_weight=v["reputation_weight"],
            )

        crud.mark_signal_processed(db, signal_id)

        # Collect verdicts for response
        verdict_summaries = []
        for v in agent_verdicts:
            verdict_summaries.append({
                "agent_name": v["agent_name"],
                "verdict": v["verdict"],
                "confidence": v["confidence"],
                "urgency": v.get("urgency", "MEDIUM"),
            })

        # ── Step 5: Run debate ───────────────────────────────────────
        debate_result = _debate_engine.run_debate(signal_id, db, force=True)
        debate_id = debate_result.get("debate", {}).get("id", "")

        # ── Step 6: Build Counter-Strike package ─────────────────────
        package_result = _package_builder.build(signal_id, db, force=True)
        package_id = ""
        if isinstance(package_result, dict):
            package_id = package_result.get("id", package_result.get("package", {}).get("id", ""))
        else:
            package_id = getattr(package_result, "id", "")

        return {
            "message": "Full OODA demo flow prepared.",
            "signal_id": signal_id,
            "entropy_score": round(entropy_score, 1),
            "agent_verdicts": verdict_summaries,
            "debate_id": debate_id,
            "counter_strike_package_id": package_id,
            "next_step": "Open Counter-Strike page and deploy simulation.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Full demo flow error: {str(e)}",
        )
