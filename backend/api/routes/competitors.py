"""
Competitor Routes — Fetch competitor data and genome profiles.
Phase 2: Added /genome endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import CompetitorResponse
from backend.intelligence.competitor_genome import build_competitor_genome, build_all_genomes

router = APIRouter(prefix="/api/competitors", tags=["Competitors"])


@router.get("", response_model=list[CompetitorResponse])
def list_competitors(db: Session = Depends(get_db)):
    """Get all competitors."""
    return crud.get_competitors(db)


@router.get("/genomes")
def list_competitor_genomes(db: Session = Depends(get_db)):
    """Get competitive genome profiles for all tracked competitors."""
    genomes = build_all_genomes(db)
    return [g.to_dict() for g in genomes]


@router.get("/{competitor_id}", response_model=CompetitorResponse)
def get_competitor(competitor_id: str, db: Session = Depends(get_db)):
    """Get a single competitor by ID."""
    comp = crud.get_competitor(db, competitor_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return comp


@router.get("/{competitor_id}/genome")
def get_competitor_genome(competitor_id: str, db: Session = Depends(get_db)):
    """Get the competitive genome profile for a specific competitor."""
    genome = build_competitor_genome(db, competitor_id)
    if not genome:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return genome.to_dict()
