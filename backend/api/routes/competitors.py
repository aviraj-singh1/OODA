"""
Competitor Routes — Fetch competitor data.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import CompetitorOut

router = APIRouter(prefix="/api/competitors", tags=["Competitors"])


@router.get("", response_model=list[CompetitorOut])
def list_competitors(db: Session = Depends(get_db)):
    """Get all competitors."""
    return crud.get_competitors(db)


@router.get("/{competitor_id}", response_model=CompetitorOut)
def get_competitor(competitor_id: str, db: Session = Depends(get_db)):
    """Get a single competitor by ID."""
    comp = crud.get_competitor(db, competitor_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return comp
