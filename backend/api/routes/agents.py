"""
Agent Routes — Placeholder for Phase 3.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import AgentVerdictResponse, AgentReputationResponse

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.post("/run/{signal_id}")
def run_agents(signal_id: str):
    """Placeholder — will run all agents against a signal in Phase 3."""
    return {"status": "pending", "message": "Agent system not yet implemented. Coming in Phase 3."}


@router.get("/verdicts/{signal_id}", response_model=list[AgentVerdictResponse])
def get_verdicts(signal_id: str, db: Session = Depends(get_db)):
    """Get all agent verdicts for a signal."""
    return crud.get_verdicts_by_signal(db, signal_id)


@router.get("/reputation", response_model=list[AgentReputationResponse])
def get_reputations(db: Session = Depends(get_db)):
    """Get reputation scores for all agents."""
    return crud.get_reputations(db)
