"""
OODA Base Agent — Phase 7
Reusable base class for all AI agents in the OODA system.

Phase 7: LLM-first analysis with deterministic demo fallback.
Agents try LLM (Ollama/OpenRouter) first, fall back to _analyze_demo.
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional

from backend.llm.llm_client import get_llm_client
from backend.agents.prompts import build_agent_prompt

logger = logging.getLogger("ooda.agents")


class BaseAgent(ABC):
    """
    Abstract base for every OODA agent.

    Phase 7 flow:
    1. Try LLM-based analysis via generate_json
    2. Validate response has required keys
    3. On failure, fall back to deterministic _analyze_demo

    Subclasses must implement ``_analyze_demo`` for guaranteed demo output.
    """

    # Required keys in agent output
    _REQUIRED_KEYS = {
        "verdict", "confidence", "reasoning", "evidence",
        "recommended_action", "urgency",
    }

    def __init__(self, name: str, codename: str, lens: str):
        self.name = name
        self.codename = codename
        self.lens = lens

    # ── Public API ────────────────────────────────────────────────────────

    def analyze(
        self,
        signal: dict,
        entropy_score: float = 0.0,
    ) -> dict:
        """
        Analyze a competitive signal and return a structured verdict.

        Tries LLM first, falls back to deterministic demo response.

        Parameters
        ----------
        signal : dict
            Signal data including signal_type, percentage_change, summary, etc.
        entropy_score : float
            Current Market Entropy Score (0–100).

        Returns
        -------
        dict  with keys:
            agent_name, agent_codename, verdict, confidence, reasoning,
            evidence, recommended_action, urgency, reputation_weight,
            _generated_by
        """
        # Build deterministic fallback first (always available)
        demo_result = self._analyze_demo(signal, entropy_score)

        # Try LLM-based analysis
        llm_result = self._try_llm_analysis(signal, entropy_score, demo_result)
        if llm_result is not None:
            return llm_result

        # Fallback to deterministic demo
        demo_result["_generated_by"] = "demo_fallback"
        return demo_result

    # ── LLM analysis ─────────────────────────────────────────────────────

    def _try_llm_analysis(
        self,
        signal: dict,
        entropy_score: float,
        fallback: dict,
    ) -> Optional[dict]:
        """Attempt LLM-based analysis. Returns verdict dict or None."""
        try:
            client = get_llm_client()
            system_prompt, user_prompt = build_agent_prompt(
                self.lens, self.name, self.codename, signal, entropy_score
            )

            result = client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                fallback=fallback,
            )

            generated_by = result.pop("_generated_by", "demo_fallback")

            # If it came from fallback, let the caller handle it
            if generated_by == "demo_fallback":
                return None

            # Validate required keys
            if not self._REQUIRED_KEYS.issubset(result.keys()):
                missing = self._REQUIRED_KEYS - result.keys()
                logger.warning(
                    "%s: LLM response missing keys %s — using fallback",
                    self.name, missing,
                )
                return None

            # Normalize and build verdict
            return self._build_verdict(
                verdict=self._normalize_verdict(result.get("verdict", "NEUTRAL")),
                confidence=self._clamp(float(result.get("confidence", 0.5)), 0.0, 1.0),
                reasoning=str(result.get("reasoning", ""))[:500],
                evidence=self._normalize_evidence(result.get("evidence", [])),
                recommended_action=str(result.get("recommended_action", ""))[:300],
                urgency=self._normalize_urgency(result.get("urgency", "MEDIUM")),
                reputation_weight=fallback.get("reputation_weight", 1.0),
                generated_by=generated_by,
            )

        except Exception as e:
            logger.warning("%s: LLM analysis failed (%s) — using fallback", self.name, e)
            return None

    # ── Template for subclasses ───────────────────────────────────────────

    @abstractmethod
    def _analyze_demo(self, signal: dict, entropy_score: float) -> dict:
        """Return a deterministic demo verdict dict."""
        ...

    # ── Helpers ───────────────────────────────────────────────────────────

    def _build_verdict(
        self,
        verdict: str,
        confidence: float,
        reasoning: str,
        evidence: list[str],
        recommended_action: str,
        urgency: str,
        reputation_weight: float = 1.0,
        generated_by: str = "demo_fallback",
    ) -> dict:
        """Construct the canonical verdict envelope."""
        return {
            "agent_name": self.name,
            "agent_codename": self.codename,
            "verdict": verdict,
            "confidence": round(confidence, 2),
            "reasoning": reasoning,
            "evidence": evidence,
            "recommended_action": recommended_action,
            "urgency": urgency,
            "reputation_weight": round(reputation_weight, 2),
            "_generated_by": generated_by,
        }

    @staticmethod
    def _normalize_verdict(v: str) -> str:
        v = str(v).upper().strip()
        if v in ("THREAT", "OPPORTUNITY", "NEUTRAL"):
            return v
        return "NEUTRAL"

    @staticmethod
    def _normalize_urgency(u: str) -> str:
        u = str(u).upper().strip()
        if u in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
            return u
        return "MEDIUM"

    @staticmethod
    def _normalize_evidence(evidence) -> list[str]:
        if isinstance(evidence, list):
            return [str(e)[:200] for e in evidence[:5]]
        return [str(evidence)[:200]]

    @staticmethod
    def _clamp(val: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, val))
