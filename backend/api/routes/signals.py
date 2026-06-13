"""
Signal Routes — Fetch and create competitive signals.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import SignalResponse, SignalCreate

router = APIRouter(prefix="/api/signals", tags=["Signals"])


def _enrich(signal) -> SignalResponse:
    """Build a SignalResponse from an ORM Signal, injecting competitor_name."""
    out = SignalResponse.model_validate(signal)
    if signal.competitor:
        out.competitor_name = signal.competitor.name
    return out


@router.get("", response_model=list[SignalResponse])
def list_signals(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get all signals, newest first. Max 200."""
    signals = crud.get_signals(db, limit=limit)
    return [_enrich(s) for s in signals]


@router.get("/latest", response_model=SignalResponse)
def get_latest_signal(db: Session = Depends(get_db)):
    """Get the single most recent signal."""
    signal = crud.get_latest_signal(db)
    if not signal:
        raise HTTPException(status_code=404, detail="No signals found")
    return _enrich(signal)


@router.get("/{signal_id}", response_model=SignalResponse)
def get_signal(signal_id: str, db: Session = Depends(get_db)):
    """Get a single signal by ID."""
    signal = crud.get_signal(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return _enrich(signal)


@router.post("", response_model=SignalResponse, status_code=201)
def create_signal(payload: SignalCreate, db: Session = Depends(get_db)):
    """Create a new signal manually."""
    # Validate competitor exists if provided
    if payload.competitor_id:
        comp = crud.get_competitor(db, payload.competitor_id)
        if not comp:
            raise HTTPException(
                status_code=404,
                detail=f"Competitor '{payload.competitor_id}' not found",
            )

    signal = crud.create_signal(
        db,
        id=crud._generate_id("sig"),
        competitor_id=payload.competitor_id,
        source=payload.source,
        signal_type=payload.signal_type,
        summary=payload.summary,
        raw_content=payload.raw_content,
        old_value=payload.old_value,
        new_value=payload.new_value,
        percentage_change=payload.percentage_change,
        severity=payload.severity,
    )
    return _enrich(signal)


@router.patch("/{signal_id}/process", response_model=SignalResponse)
def mark_processed(signal_id: str, db: Session = Depends(get_db)):
    """Mark a signal as processed by the agent pipeline."""
    signal = crud.mark_signal_processed(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return _enrich(signal)
