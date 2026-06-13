"""
Agent Routes — Phase 3: Run agents, fetch verdicts, manage analysis.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import (
    AgentVerdictResponse,
    AgentReputationResponse,
    AgentRunResponse,
)
from backend.agents.agent_runner import run_all_agents
from backend.intelligence.entropy_calculator import calculate_entropy

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.post("/run/{signal_id}", response_model=AgentRunResponse)
def run_agents(
    signal_id: str,
    force: bool = Query(default=False, description="Force re-run even if verdicts exist"),
    db: Session = Depends(get_db),
):
    """
    Run all active agents (Marketing, Product, Sales) against a signal.

    - If verdicts already exist and force=false, returns existing verdicts.
    - If force=true, deletes old verdicts and regenerates.
    """
    # 1. Validate signal exists
    signal = crud.get_signal(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal '{signal_id}' not found")

    # 2. Check for existing verdicts
    existing = crud.get_verdicts_by_signal(db, signal_id)
    if existing and not force:
        return AgentRunResponse(
            status="existing",
            signal_id=signal_id,
            verdicts=[AgentVerdictResponse.model_validate(v) for v in existing],
            message=f"Returning {len(existing)} existing verdicts. Use ?force=true to regenerate.",
        )

    # 3. If force, delete old verdicts
    if existing and force:
        crud.delete_verdicts_by_signal(db, signal_id)

    # 4. Get current entropy score
    try:
        entropy_result = calculate_entropy(db)
        entropy_score = entropy_result.score
    except Exception:
        entropy_score = 0.0

    # 5. Build signal dict for agents
    signal_dict = {
        "id": signal.id,
        "competitor_id": signal.competitor_id,
        "source": signal.source,
        "signal_type": signal.signal_type,
        "summary": signal.summary,
        "raw_content": signal.raw_content,
        "old_value": signal.old_value,
        "new_value": signal.new_value,
        "percentage_change": signal.percentage_change,
        "severity": signal.severity,
        "timestamp": signal.timestamp,
    }

    # 6. Run all agents
    agent_verdicts = run_all_agents(signal_dict, entropy_score)

    # 7. Save verdicts to database
    saved = []
    for v in agent_verdicts:
        db_verdict = crud.create_verdict(
            db=db,
            id=crud._generate_id("vrd"),
            signal_id=signal_id,
            agent_name=v["agent_name"],
            agent_codename=v["agent_codename"],
            verdict=v["verdict"],
            confidence=v["confidence"],
            reasoning=v["reasoning"],
            evidence_json=json.dumps(v["evidence"]),
            recommended_action=v["recommended_action"],
            urgency=v["urgency"],
            reputation_weight=v["reputation_weight"],
        )
        saved.append(db_verdict)

    # 8. Mark signal as processed
    crud.mark_signal_processed(db, signal_id)

    return AgentRunResponse(
        status="success",
        signal_id=signal_id,
        verdicts=[AgentVerdictResponse.model_validate(v) for v in saved],
        message=f"Successfully ran {len(saved)} agents against signal '{signal_id}'.",
    )


@router.get("/verdicts/{signal_id}", response_model=list[AgentVerdictResponse])
def get_verdicts(signal_id: str, db: Session = Depends(get_db)):
    """Get all agent verdicts for a signal."""
    signal = crud.get_signal(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal '{signal_id}' not found")
    return crud.get_verdicts_by_signal(db, signal_id)


@router.get("/latest", response_model=list[AgentVerdictResponse])
def get_latest_verdicts(db: Session = Depends(get_db)):
    """
    Return agent verdicts for the newest signal that has verdicts.
    Walks signals newest-first until one with verdicts is found.
    """
    signals = crud.get_signals(db, limit=20)
    for sig in signals:
        verdicts = crud.get_verdicts_by_signal(db, sig.id)
        if verdicts:
            return verdicts

    # No verdicts found for any signal
    return []


@router.get("/reputation", response_model=list[AgentReputationResponse])
def get_reputations(db: Session = Depends(get_db)):
    """Get reputation scores for all agents."""
    return crud.get_reputations(db)
