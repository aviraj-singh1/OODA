"""
OODA Live Ingestion Service — Phase 7
Orchestrates all fetchers and creates signals from real API sources.

Supports three modes:
- demo: skip all fetchers, return empty
- live: run all fetchers, fail if nothing works
- hybrid: run all fetchers, fallback to demo data gracefully
"""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import crud
from backend.ingestion.news_fetcher import NewsFetcher
from backend.ingestion.serp_fetcher import SerpFetcher
from backend.ingestion.github_fetcher import GitHubFetcher
from backend.ingestion.web_watcher import WebWatcher
from backend.ingestion.signal_normalizer import deduplicate_signals

logger = logging.getLogger("ooda.ingestion")


def run_live_ingestion(db: Session) -> dict:
    """
    Run live ingestion across all configured sources.

    1. Get competitors from DB
    2. For each competitor: run all relevant fetchers
    3. Normalize, deduplicate, and save new signals
    4. Return summary

    Returns
    -------
    dict
        Summary with mode, signals_created, sources_checked, etc.
    """
    mode = settings.DATA_MODE
    warnings = []
    all_signals = []
    sources_checked = []
    created_signals = []

    # In pure demo mode, skip all live fetching
    if mode == "demo":
        return {
            "mode": mode,
            "signals_created": 0,
            "sources_checked": [],
            "fallback_used": True,
            "warnings": ["DATA_MODE is 'demo' — live ingestion skipped"],
            "created_signals": [],
        }

    # Initialize fetchers
    news_fetcher = NewsFetcher()
    serp_fetcher = SerpFetcher()
    github_fetcher = GitHubFetcher()
    web_watcher = WebWatcher()

    # Get all competitors
    competitors = crud.get_competitors(db)

    if not competitors:
        warnings.append("No competitors in database — seed data first")
        return {
            "mode": mode,
            "signals_created": 0,
            "sources_checked": [],
            "fallback_used": True,
            "warnings": warnings,
            "created_signals": [],
        }

    for comp in competitors:
        comp_name = comp.name
        comp_id = comp.id
        category = comp.category or ""

        # ── NewsAPI ─────────────────────────────────────────────
        sigs, warns = news_fetcher.fetch(
            competitor_name=comp_name,
            competitor_id=comp_id,
            category=category,
        )
        all_signals.extend(sigs)
        warnings.extend(warns)
        if "newsapi" not in sources_checked:
            sources_checked.append("newsapi")

        # ── SerpAPI ─────────────────────────────────────────────
        sigs, warns = serp_fetcher.fetch(
            competitor_name=comp_name,
            competitor_id=comp_id,
        )
        all_signals.extend(sigs)
        warnings.extend(warns)
        if "serpapi" not in sources_checked:
            sources_checked.append("serpapi")

        # ── GitHub (if repo URL available) ──────────────────────
        github_repo = _extract_github_repo(comp)
        if github_repo:
            sigs, warns = github_fetcher.fetch(
                repo=github_repo,
                competitor_name=comp_name,
                competitor_id=comp_id,
            )
            all_signals.extend(sigs)
            warnings.extend(warns)
            if "github" not in sources_checked:
                sources_checked.append("github")

        # ── Web Watcher (if pricing URL configured) ─────────────
        if comp.pricing_url:
            # Get last known price from latest signal
            last_price = _get_last_known_price(db, comp_id)
            sigs, warns = web_watcher.fetch(
                pricing_url=comp.pricing_url,
                competitor_name=comp_name,
                competitor_id=comp_id,
                last_known_price=last_price,
            )
            all_signals.extend(sigs)
            warnings.extend(warns)
            if "web_watcher" not in sources_checked:
                sources_checked.append("web_watcher")

    # ── Deduplicate ──────────────────────────────────────────────
    existing_summaries = _get_existing_summaries(db)
    unique_signals = deduplicate_signals(all_signals, existing_summaries)

    # ── Save to database ─────────────────────────────────────────
    for sig_data in unique_signals:
        try:
            signal = crud.create_signal(
                db=db,
                id=crud._generate_id("sig"),
                competitor_id=sig_data.get("competitor_id"),
                source=sig_data["source"],
                signal_type=sig_data["signal_type"],
                summary=sig_data["summary"],
                raw_content=sig_data.get("raw_content", ""),
                old_value=sig_data.get("old_value"),
                new_value=sig_data.get("new_value"),
                percentage_change=sig_data.get("percentage_change"),
                severity=sig_data.get("severity", "MEDIUM"),
            )
            created_signals.append({
                "id": signal.id,
                "source": signal.source,
                "signal_type": signal.signal_type,
                "summary": signal.summary,
                "severity": signal.severity,
            })
        except Exception as e:
            logger.warning("Failed to save signal: %s", str(e))
            warnings.append(f"Failed to save signal: {str(e)[:100]}")

    fallback_used = len(created_signals) == 0 and mode == "hybrid"

    logger.info(
        "Live ingestion complete: %d signals created from %s",
        len(created_signals),
        sources_checked,
    )

    return {
        "mode": mode,
        "signals_created": len(created_signals),
        "sources_checked": sources_checked,
        "fallback_used": fallback_used,
        "warnings": warnings,
        "created_signals": created_signals,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _extract_github_repo(competitor) -> Optional[str]:
    """Extract GitHub repo from competitor's website URL if it's a GitHub URL."""
    url = competitor.website_url or ""
    if "github.com" in url.lower():
        return url
    return None


def _get_last_known_price(db: Session, competitor_id: str) -> Optional[str]:
    """Get the last known price from the most recent price_change signal."""
    signals = crud.get_signals_by_competitor(db, competitor_id)
    for sig in signals:
        if sig.signal_type in ("price_change", "pricing_update") and sig.new_value:
            return sig.new_value
    return None


def _get_existing_summaries(db: Session) -> set[str]:
    """Get set of source:summary keys for deduplication."""
    signals = crud.get_signals(db, limit=200)
    return {f"{s.source}:{s.summary[:100]}" for s in signals}
