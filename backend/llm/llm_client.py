"""
OODA LLM Client — Phase 8
Unified LLM interface with provider-controlled fallback chain.

Provider priority is determined by LLM_PROVIDER setting:
  - "openrouter" → OpenRouter → demo fallback
  - "ollama"     → Ollama → demo fallback
  - "auto"       → OpenRouter (if key) → Ollama → demo fallback
  - DATA_MODE="demo" → skip LLM, use demo fallback directly

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

        # If demo mode, skip all LLM calls
        if settings.DATA_MODE == "demo":
            logger.info("DATA_MODE=demo — using deterministic fallback")
            fallback_copy = dict(fallback)
            fallback_copy["_generated_by"] = "demo_fallback"
            return fallback_copy

        provider = settings.LLM_PROVIDER

        # ── Provider: openrouter ──────────────────────────────────────────
        if provider == "openrouter":
            result = self._try_openrouter_safe(full_system, user_prompt)
            if result is not None:
                return result
            # OpenRouter failed → demo fallback (no Ollama attempt)
            logger.info("OpenRouter failed — using demo fallback")
            fallback_copy = dict(fallback)
            fallback_copy["_generated_by"] = "demo_fallback"
            return fallback_copy

        # ── Provider: ollama ──────────────────────────────────────────────
        if provider == "ollama":
            result = self._try_ollama_safe(full_system, user_prompt)
            if result is not None:
                return result
            # Ollama failed → demo fallback (no OpenRouter attempt)
            logger.info("Ollama failed — using demo fallback")
            fallback_copy = dict(fallback)
            fallback_copy["_generated_by"] = "demo_fallback"
            return fallback_copy

        # ── Provider: auto (default) ──────────────────────────────────────
        # Try OpenRouter first if key exists
        result = self._try_openrouter_safe(full_system, user_prompt)
        if result is not None:
            return result

        # Then try Ollama
        result = self._try_ollama_safe(full_system, user_prompt)
        if result is not None:
            return result

        # All failed → demo fallback
        logger.info("All LLM providers failed — using demo fallback")
        fallback_copy = dict(fallback)
        fallback_copy["_generated_by"] = "demo_fallback"
        return fallback_copy

    # ── Safe wrappers ─────────────────────────────────────────────────────

    def _try_openrouter_safe(
        self, system_prompt: str, user_prompt: str
    ) -> Optional[dict]:
        """Try OpenRouter, return tagged dict or None."""
        api_key = settings.OPENROUTER_API_KEY or settings.LLM_API_KEY
        if not api_key:
            logger.warning("OpenRouter API key not configured — skipping")
            return None

        result = self._try_openrouter(system_prompt, user_prompt, api_key)
        if result is not None:
            result["_generated_by"] = "openrouter"
            model = settings.OPENROUTER_MODEL or settings.LLM_MODEL
            logger.info("LLM response from: OpenRouter (%s)", model)
            return result
        return None

    def _try_ollama_safe(
        self, system_prompt: str, user_prompt: str
    ) -> Optional[dict]:
        """Try Ollama, return tagged dict or None."""
        result = self._try_ollama(system_prompt, user_prompt)
        if result is not None:
            result["_generated_by"] = "ollama"
            logger.info("LLM response from: Ollama (%s)", settings.OLLAMA_MODEL)
            return result
        return None

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

            logger.info("Using OpenRouter model: %s", model)

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.OPENROUTER_SITE_URL,
                "X-OpenRouter-Title": settings.OPENROUTER_APP_NAME,
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
            response = self._http.post(url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not content:
                logger.warning("OpenRouter returned empty content — skipping")
                return None

            result = self._parse_json(content)
            if result is None:
                logger.warning("Invalid JSON from OpenRouter — using demo fallback")
            return result

        except httpx.TimeoutException:
            logger.warning("OpenRouter request timed out — skipping")
            return None
        except httpx.HTTPStatusError as e:
            logger.warning(
                "OpenRouter HTTP error %s — skipping",
                e.response.status_code if e.response else "unknown",
            )
            return None
        except Exception as e:
            logger.warning("OpenRouter error: %s — skipping", str(e))
            return None

    # ── JSON parsing with repair ──────────────────────────────────────────

    def _parse_json(self, text: str) -> Optional[dict]:
        """
        Parse JSON from LLM response text.
        Attempts multi-stage repair if initial parse fails.
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

        # Attempt 3: Find first JSON object in text
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                result = json.loads(match.group())
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                pass

        # Attempt 4: Try finding the outermost balanced braces
        depth = 0
        start_idx = None
        for i, ch in enumerate(text):
            if ch == "{":
                if depth == 0:
                    start_idx = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start_idx is not None:
                    candidate = text[start_idx : i + 1]
                    try:
                        result = json.loads(candidate)
                        if isinstance(result, dict):
                            return result
                    except json.JSONDecodeError:
                        pass
                    break

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
