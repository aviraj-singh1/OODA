"""
OODA Base Agent
Reusable base class for all AI agents in the OODA system.

Phase 3: Deterministic demo responses — no LLM dependency.
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseAgent(ABC):
    """
    Abstract base for every OODA agent.

    Subclasses must implement ``_analyze_demo`` to return deterministic
    verdict dicts for the demo scenario.  In a future phase a
    ``_analyze_llm`` hook can be added for real LLM-backed analysis.
    """

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
            evidence, recommended_action, urgency, reputation_weight
        """
        return self._analyze_demo(signal, entropy_score)

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
        }
