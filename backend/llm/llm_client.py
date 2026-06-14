"""
OODA LLM Client — Phase 7
Unified LLM interface with fallback chain:
  1. Ollama (local open-source model)
  2. OpenRouter (cloud fallback)
  3. Deterministic demo response (guaranteed fallback)

Never crashes. Always returns valid JSON.
"""

import json
import re
import logging
from typing import Optional

import httpx

from backend.config import settings

logger = logging.getLogger("ooda.llm")


class LLMClient:
    """
    Unified LLM client supporting Ollama, OpenRouter, and deterministic fallback.

    Usage::

        client = LLMClient()
        result = client.generate_json(
            system_prompt="You are a marketing analyst...",
            user_prompt="Analyze this signal...",
            fallback={"verdict": "NEUTRAL", "confidence": 0.5, ...},
        )
        # result["_generated_by"] tells you which provider responded
    """

    def __init__(self):
        self._http = httpx.Client(timeout=10.0)

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback: dict,
    ) -> dict:
        """
        Generate a JSON response from the best available LLM provider.

        Parameters
        ----------
        system_prompt : str
            System-level instructions for the model.
        user_prompt : str
            User-level prompt with signal data.
        fallback : dict
            Deterministic fallback returned if all providers fail.

        Returns
        -------
        dict
            Parsed JSON response with ``_generated_by`` key added.
        """
        # Append JSON-only instruction
        json_instruction = (
            "\n\nIMPORTANT: Respond with valid JSON only. "
            "No markdown, no code fences, no explanation. Just the JSON object."
        )
        full_system = system_prompt + json_instruction

        # Priority 1: Ollama (local)
        if settings.DATA_MODE != "demo":
            result = self._try_ollama(full_system, user_prompt)
            if result is not None:
                result["_generated_by"] = "ollama"
                logger.info("LLM response from: Ollama (%s)", settings.OLLAMA_MODEL)
                return result

        # Priority 2: OpenRouter (cloud)
        if settings.DATA_MODE != "demo":
            api_key = settings.OPENROUTER_API_KEY or settings.LLM_API_KEY
            if api_key:
                result = self._try_openrouter(full_system, user_prompt, api_key)
                if result is not None:
                    result["_generated_by"] = "openrouter"
                    logger.info("LLM response from: OpenRouter (%s)", settings.OPENROUTER_MODEL)
                    return result

        # Priority 3: Deterministic fallback
        logger.info("LLM response from: Demo Fallback (no LLM available)")
        fallback_copy = dict(fallback)
        fallback_copy["_generated_by"] = "demo_fallback"
        return fallback_copy

    # ── Provider implementations ──────────────────────────────────────────

    def _try_ollama(self, system_prompt: str, user_prompt: str) -> Optional[dict]:
        """Try Ollama local model. Returns parsed dict or None on failure."""
        try:
            url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
            payload = {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "format": "json",
            }
            response = self._http.post(url, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            return self._parse_json(content)
        except httpx.ConnectError:
            logger.warning("Ollama unavailable at %s — skipping", settings.OLLAMA_BASE_URL)
            return None
        except httpx.TimeoutException:
            logger.warning("Ollama request timed out — skipping")
            return None
        except Exception as e:
            logger.warning("Ollama error: %s — skipping", str(e))
            return None

    def _try_openrouter(
        self, system_prompt: str, user_prompt: str, api_key: str
    ) -> Optional[dict]:
        """Try OpenRouter cloud model. Returns parsed dict or None on failure."""
        try:
            url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions"
            model = settings.OPENROUTER_MODEL or settings.LLM_MODEL
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 1024,
            }
            response = self._http.post(url, json=payload, headers=headers, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return self._parse_json(content)
        except httpx.TimeoutException:
            logger.warning("OpenRouter request timed out — skipping")
            return None
        except Exception as e:
            logger.warning("OpenRouter error: %s — skipping", str(e))
            return None

    # ── JSON parsing with repair ──────────────────────────────────────────

    def _parse_json(self, text: str) -> Optional[dict]:
        """
        Parse JSON from LLM response text.
        Attempts repair if initial parse fails (strips markdown fences, etc.).
        """
        if not text or not text.strip():
            return None

        # Attempt 1: Direct parse
        try:
            result = json.loads(text.strip())
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

        # Attempt 2: Strip markdown code fences
        cleaned = re.sub(r"```(?:json)?\s*", "", text)
        cleaned = cleaned.strip().rstrip("`")
        try:
            result = json.loads(cleaned)
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

        # Attempt 3: Find JSON object in text
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                result = json.loads(match.group())
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                pass

        logger.warning("Failed to parse valid JSON from LLM response")
        return None


# ── Module-level singleton ────────────────────────────────────────────────────

_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get or create the singleton LLMClient instance."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
