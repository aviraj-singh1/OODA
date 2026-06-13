"""
Debate Routes — Placeholder for Phase 4.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import DebateOut

router = APIRouter(prefix="/api/debate", tags=["Debate"])


@router.post("/run/{signal_id}")
def run_debate(signal_id: str):
    """Placeholder — will run full debate in Phase 4."""
    return {"status": "pending", "message": "Debate engine not yet implemented. Coming in Phase 4."}


@router.get("/latest", response_model=DebateOut)
def get_latest_debate(db: Session = Depends(get_db)):
    """Get the most recent debate."""
    debate = crud.get_latest_debate(db)
    if not debate:
        raise HTTPException(status_code=404, detail="No debates found")
    return debate


@router.get("/{debate_id}", response_model=DebateOut)
def get_debate(debate_id: str, db: Session = Depends(get_db)):
    """Get a specific debate by ID."""
    debate = crud.get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate
