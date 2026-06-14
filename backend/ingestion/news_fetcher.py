"""
OODA NewsAPI Fetcher — Phase 7
Fetches competitor/category news from NewsAPI.

If NEWS_API_KEY is missing, returns empty list with a warning.
Never crashes.
"""

import logging
from typing import Optional

import httpx

from backend.config import settings
from backend.ingestion.signal_normalizer import normalize_signal

logger = logging.getLogger("ooda.ingestion.news")

NEWSAPI_BASE = "https://newsapi.org/v2/everything"


class NewsFetcher:
    """Fetch competitor news from NewsAPI."""

    def __init__(self):
        self._http = httpx.Client(timeout=10.0)

    def fetch(
        self,
        competitor_name: str,
        competitor_id: Optional[str] = None,
        category: Optional[str] = None,
        max_results: int = 5,
    ) -> tuple[list[dict], list[str]]:
        """
        Fetch news articles for a competitor.

        Returns
        -------
        tuple[list[dict], list[str]]
            (list of normalized signal dicts, list of warnings)
        """
        warnings = []

        if not settings.NEWS_API_KEY:
            warnings.append("NEWS_API_KEY missing, skipped newsapi")
            logger.warning("NEWS_API_KEY missing — skipping NewsAPI fetch")
            return [], warnings

        try:
            query = competitor_name
            if category:
                query = f"{competitor_name} {category}"

            params = {
                "q": query,
                "apiKey": settings.NEWS_API_KEY,
                "pageSize": max_results,
                "sortBy": "publishedAt",
                "language": "en",
            }

            response = self._http.get(NEWSAPI_BASE, params=params)
            response.raise_for_status()
            data = response.json()

            articles = data.get("articles", [])
            if not articles:
                logger.info("NewsAPI: No articles found for '%s'", query)
                return [], warnings

            signals = []
            for article in articles[:max_results]:
                title = article.get("title", "")
                description = article.get("description", "")
                url = article.get("url", "")
                published = article.get("publishedAt", "")
                source_name = article.get("source", {}).get("name", "")

                if not title or title == "[Removed]":
                    continue

                sig = normalize_signal(
                    source="newsapi",
                    signal_type="news_mention",
                    competitor_id=competitor_id,
                    competitor_name=competitor_name,
                    summary=f"{competitor_name} mentioned in news: {title[:200]}",
                    raw_content=description[:500] if description else "",
                    severity="MEDIUM",
                    metadata={
                        "title": title[:300],
                        "url": url,
                        "published_at": published,
                        "source_name": source_name,
                    },
                )
                signals.append(sig)

            logger.info("NewsAPI: Found %d articles for '%s'", len(signals), competitor_name)
            return signals, warnings

        except httpx.TimeoutException:
            warnings.append("NewsAPI request timed out")
            logger.warning("NewsAPI request timed out for '%s'", competitor_name)
            return [], warnings
        except Exception as e:
            warnings.append(f"NewsAPI error: {str(e)[:100]}")
            logger.warning("NewsAPI error: %s", str(e))
            return [], warnings
