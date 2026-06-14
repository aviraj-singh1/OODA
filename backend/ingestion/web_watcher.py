"""
OODA Web Watcher — Phase 7
Checks competitor pricing pages for price changes.

Fetches HTML, extracts price patterns, compares with stored data.
For demo reliability, the RivalFlow seeded price-drop trigger remains separate.
This is an additional live source, not a replacement.

Never crashes. Handles invalid URLs, timeouts, and blocked pages.
"""

import re
import logging
from typing import Optional

import httpx

from backend.ingestion.signal_normalizer import normalize_signal

logger = logging.getLogger("ooda.ingestion.web_watcher")


class WebWatcher:
    """Watch competitor pricing pages for changes."""

    # Common price patterns
    _PRICE_PATTERNS = [
        # ₹999, $99.99, €49, etc.
        re.compile(r"[₹$€£]\s*[\d,]+(?:\.\d{1,2})?"),
        # 999/month, 49/year, etc.
        re.compile(r"[\d,]+(?:\.\d{1,2})?\s*/\s*(?:month|mo|year|yr)", re.IGNORECASE),
        # $99 per month
        re.compile(r"[₹$€£]\s*[\d,]+(?:\.\d{1,2})?\s*per\s*(?:month|year)", re.IGNORECASE),
    ]

    def __init__(self):
        self._http = httpx.Client(
            timeout=5.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; OODA-Bot/1.0; +https://ooda.dev)"
            },
        )

    def fetch(
        self,
        pricing_url: Optional[str],
        competitor_name: str,
        competitor_id: Optional[str] = None,
        last_known_price: Optional[str] = None,
    ) -> tuple[list[dict], list[str]]:
        """
        Check a competitor's pricing URL for price information.

        Parameters
        ----------
        pricing_url : str or None
            URL to the competitor's pricing page.
        competitor_name : str
            Display name of the competitor.
        competitor_id : str or None
            Competitor DB ID.
        last_known_price : str or None
            Previously recorded price string for comparison.

        Returns
        -------
        tuple[list[dict], list[str]]
            (list of normalized signal dicts, list of warnings)
        """
        warnings = []

        if not pricing_url:
            return [], warnings

        # Basic URL validation
        if not pricing_url.startswith(("http://", "https://")):
            warnings.append(f"Invalid pricing URL: {pricing_url}")
            return [], warnings

        try:
            response = self._http.get(pricing_url)

            if response.status_code == 403:
                warnings.append(f"Access blocked for {pricing_url}")
                logger.warning("Web watcher: Access blocked for %s", pricing_url)
                return [], warnings

            if response.status_code == 404:
                warnings.append(f"Pricing page not found: {pricing_url}")
                return [], warnings

            response.raise_for_status()

            # Extract text content (strip HTML tags for simple extraction)
            text = self._strip_html(response.text)
            prices = self._extract_prices(text)

            if not prices:
                logger.info("Web watcher: No prices found at %s", pricing_url)
                return [], warnings

            signals = []

            # Create a pricing signal with found prices
            price_summary = ", ".join(prices[:5])

            # Check for changes if we have a last known price
            if last_known_price and prices:
                current_price = prices[0]
                if current_price != last_known_price:
                    sig = normalize_signal(
                        source="web_watcher",
                        signal_type="price_change",
                        competitor_id=competitor_id,
                        competitor_name=competitor_name,
                        summary=f"Price change detected on {competitor_name} pricing page: {last_known_price} → {current_price}",
                        raw_content=f"Prices found: {price_summary}",
                        severity="HIGH",
                        old_value=last_known_price,
                        new_value=current_price,
                        metadata={
                            "url": pricing_url,
                            "prices_found": prices[:5],
                        },
                    )
                    signals.append(sig)
            else:
                # Just report what we found
                sig = normalize_signal(
                    source="web_watcher",
                    signal_type="pricing_update",
                    competitor_id=competitor_id,
                    competitor_name=competitor_name,
                    summary=f"{competitor_name} pricing page scanned: {price_summary}",
                    raw_content=f"Prices found: {price_summary}",
                    severity="LOW",
                    metadata={
                        "url": pricing_url,
                        "prices_found": prices[:5],
                    },
                )
                signals.append(sig)

            logger.info("Web watcher: Found %d prices at %s", len(prices), pricing_url)
            return signals, warnings

        except httpx.TimeoutException:
            warnings.append(f"Web watcher timed out: {pricing_url}")
            logger.warning("Web watcher timed out for %s", pricing_url)
            return [], warnings
        except Exception as e:
            warnings.append(f"Web watcher error: {str(e)[:100]}")
            logger.warning("Web watcher error for %s: %s", pricing_url, str(e))
            return [], warnings

    def _extract_prices(self, text: str) -> list[str]:
        """Extract price-like strings from text."""
        prices = []
        for pattern in self._PRICE_PATTERNS:
            matches = pattern.findall(text)
            for match in matches:
                clean = match.strip()
                if clean and clean not in prices:
                    prices.append(clean)
        return prices[:10]  # Cap at 10

    @staticmethod
    def _strip_html(html: str) -> str:
        """Strip HTML tags and normalize whitespace."""
        text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()
