"""
OODA SerpAPI Fetcher — Phase 7
Fetches Google search result signals for competitor name and category.

If SERPAPI_KEY is missing, returns empty list.
Never crashes.
"""

import logging
from typing import Optional

import httpx

from backend.config import settings
from backend.ingestion.signal_normalizer import normalize_signal

logger = logging.getLogger("ooda.ingestion.serp")

SERPAPI_BASE = "https://serpapi.com/search.json"


class SerpFetcher:
    """Fetch Google search signals from SerpAPI."""

    def __init__(self):
        self._http = httpx.Client(timeout=10.0)

    def fetch(
        self,
        competitor_name: str,
        competitor_id: Optional[str] = None,
        query: Optional[str] = None,
        max_results: int = 5,
    ) -> tuple[list[dict], list[str]]:
        """
        Fetch Google search results for a competitor.

        Returns
        -------
        tuple[list[dict], list[str]]
            (list of normalized signal dicts, list of warnings)
        """
        warnings = []

        if not settings.SERPAPI_KEY:
            warnings.append("SERPAPI_KEY missing, skipped serpapi")
            logger.warning("SERPAPI_KEY missing — skipping SerpAPI fetch")
            return [], warnings

        try:
            search_query = query or f"{competitor_name} pricing news update"

            params = {
                "q": search_query,
                "api_key": settings.SERPAPI_KEY,
                "num": max_results,
                "engine": "google",
            }

            response = self._http.get(SERPAPI_BASE, params=params)
            response.raise_for_status()
            data = response.json()

            organic = data.get("organic_results", [])
            if not organic:
                logger.info("SerpAPI: No results for '%s'", search_query)
                return [], warnings

            signals = []
            for result in organic[:max_results]:
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                url = result.get("link", "")
                position = result.get("position", 0)

                if not title:
                    continue

                # Classify signal type based on content
                signal_type = self._classify_result(title, snippet)

                sig = normalize_signal(
                    source="serpapi",
                    signal_type=signal_type,
                    competitor_id=competitor_id,
                    competitor_name=competitor_name,
                    summary=f"Search signal for {competitor_name}: {title[:200]}",
                    raw_content=snippet[:500] if snippet else "",
                    severity="LOW",
                    metadata={
                        "title": title[:300],
                        "url": url,
                        "snippet": snippet[:300],
                        "position": position,
                    },
                )
                signals.append(sig)

            logger.info("SerpAPI: Found %d results for '%s'", len(signals), competitor_name)
            return signals, warnings

        except httpx.TimeoutException:
            warnings.append("SerpAPI request timed out")
            logger.warning("SerpAPI request timed out for '%s'", competitor_name)
            return [], warnings
        except Exception as e:
            warnings.append(f"SerpAPI error: {str(e)[:100]}")
            logger.warning("SerpAPI error: %s", str(e))
            return [], warnings

    @staticmethod
    def _classify_result(title: str, snippet: str) -> str:
        """Classify search result into signal type based on content."""
        text = f"{title} {snippet}".lower()

        pricing_keywords = {"pricing", "price", "cost", "plan", "discount", "offer"}
        news_keywords = {"launch", "announce", "release", "update", "new feature"}
        seo_keywords = {"review", "comparison", "vs", "alternative", "competitor"}

        if any(kw in text for kw in pricing_keywords):
            return "messaging_change"
        if any(kw in text for kw in news_keywords):
            return "news_mention"
        if any(kw in text for kw in seo_keywords):
            return "seo_signal"

        return "news_mention"
