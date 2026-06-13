"""
Signal Routes — Fetch and create competitive signals.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import SignalOut, SignalCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/signals", tags=["Signals"])


@router.get("", response_model=list[SignalOut])
def list_signals(limit: int = 50, db: Session = Depends(get_db)):
    """Get all signals, newest first."""
    signals = crud.get_signals(db, limit=limit)
    result = []
    for s in signals:
        out = SignalOut.model_validate(s)
        if s.competitor:
            out.competitor_name = s.competitor.name
        result.append(out)
    return result


@router.get("/{signal_id}", response_model=SignalOut)
def get_signal(signal_id: str, db: Session = Depends(get_db)):
    """Get a single signal by ID."""
    signal = crud.get_signal(db, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    out = SignalOut.model_validate(signal)
    if signal.competitor:
        out.competitor_name = signal.competitor.name
    return out


@router.post("", response_model=SignalOut)
def create_signal(payload: SignalCreate, db: Session = Depends(get_db)):
    """Create a new signal manually."""
    signal = crud.create_signal(
        db,
        id=f"sig_{uuid.uuid4().hex[:8]}",
        competitor_id=payload.competitor_id,
        source=payload.source,
        signal_type=payload.signal_type,
        summary=payload.summary,
        raw_content=payload.raw_content,
        old_value=payload.old_value,
        new_value=payload.new_value,
        percentage_change=payload.percentage_change,
        severity=payload.severity,
        timestamp=datetime.now().isoformat(),
        processed=0,
    )
    out = SignalOut.model_validate(signal)
    if signal.competitor:
        out.competitor_name = signal.competitor.name
    return out
