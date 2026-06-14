"""
Ingestion Routes — Phase 7: Live API ingestion endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.config import settings
from backend.ingestion.live_ingestion_service import run_live_ingestion

router = APIRouter(prefix="/api/ingestion", tags=["Ingestion"])


@router.post("/live/run")
def trigger_live_ingestion(db: Session = Depends(get_db)):
    """
    Manually trigger live ingestion from all configured sources.

    Runs all fetchers (NewsAPI, SerpAPI, GitHub, Web Watcher),
    normalizes results, deduplicates, and saves new signals.
    """
    result = run_live_ingestion(db)
    return result


@router.get("/status")
def get_ingestion_status():
    """
    Return the configuration status of all data sources.
    Does NOT expose actual API key values — only shows configured/missing.
    """
    # Check Ollama availability (quick ping)
    ollama_configured = bool(settings.OLLAMA_BASE_URL and settings.OLLAMA_MODEL)

    return {
        "data_mode": settings.DATA_MODE,
        "ollama_configured": ollama_configured,
        "ollama_model": settings.OLLAMA_MODEL if ollama_configured else None,
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY or settings.LLM_API_KEY),
        "newsapi_configured": bool(settings.NEWS_API_KEY),
        "serpapi_configured": bool(settings.SERPAPI_KEY),
        "github_configured": bool(settings.GITHUB_TOKEN),
        "web_watcher_available": True,  # Always available (just needs competitor URLs)
    }
