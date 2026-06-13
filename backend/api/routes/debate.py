"""
Debate Routes — Phase 4: Full debate engine endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import DebateResponse
from backend.debate.debate_engine import DebateEngine

router = APIRouter(prefix="/api/debate", tags=["Debate"])

# Pre-instantiate engine (stateless)
_engine = DebateEngine()


@router.post("/run/{signal_id}")
def run_debate(
    signal_id: str,
    force: bool = Query(default=False, description="Force re-run even if debate exists"),
    db: Session = Depends(get_db),
):
    """
    Run the full debate pipeline for a signal.

    1. Fetches/runs agent verdicts if missing
    2. Calculates weighted score & conflict detection
    3. Strategy AI produces final verdict
    4. Saves debate to database
    5. Returns complete debate result

    Use ?force=true to regenerate an existing debate.
    """
    try:
        result = _engine.run_debate(signal_id, db, force=force)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate engine error: {str(e)}")


@router.get("/latest", response_model=DebateResponse)
def get_latest_debate(db: Session = Depends(get_db)):
    """Get the most recent debate."""
    debate = crud.get_latest_debate(db)
    if not debate:
        raise HTTPException(status_code=404, detail="No debates found")
    return debate


@router.get("/by-signal/{signal_id}")
def get_debate_by_signal(signal_id: str, db: Session = Depends(get_db)):
    """
    Get the full debate result for a specific signal.
    Returns the same format as POST /run/{signal_id}.
    """
    signal = crud.get_signal(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal '{signal_id}' not found")

    debate = crud.get_debate_by_signal(db, signal_id)
    if not debate:
        raise HTTPException(
            status_code=404,
            detail=f"No debate found for signal '{signal_id}'. Run debate first.",
        )

    # Reconstruct full response from stored debate
    try:
        result = _engine._build_response_from_db(signal, debate, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading debate: {str(e)}")


@router.get("/{debate_id}", response_model=DebateResponse)
def get_debate(debate_id: str, db: Session = Depends(get_db)):
    """Get a specific debate by ID."""
    debate = crud.get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate
