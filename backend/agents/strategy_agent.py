"""
OODA Strategy AI — Codename: General
Final decision-maker that synthesizes all agent verdicts.

Phase 4: Integrated with debate engine. Uses strategy_resolver
for deterministic verdict synthesis.
"""

from backend.agents.base_agent import BaseAgent
from backend.debate.strategy_resolver import resolve_strategy


class StrategyAgent(BaseAgent):
    """
    Strategy AI agent — the General.

    Receives all agent verdicts, weights them by reputation,
    factors in Market Entropy Score, detects conflicts, and
    produces a final strategic recommendation.
    """

    def __init__(self):
        super().__init__(
            name="Strategy AI",
            codename="General",
            lens="strategic_synthesis",
        )

    def _analyze_demo(self, signal: dict, entropy_score: float) -> dict:
        """
        Base agent interface — used when called standalone.
        In the debate flow, resolve() is used instead.
        """
        return self._build_verdict(
            verdict="PENDING",
            confidence=0.0,
            reasoning="Strategy AI requires agent verdicts to produce a final verdict. Use the debate engine.",
            evidence=[
                "Awaiting Marketing AI verdict",
                "Awaiting Product AI verdict",
                "Awaiting Sales AI verdict",
            ],
            recommended_action="Run debate engine to get Strategy AI final verdict",
            urgency="LOW",
            reputation_weight=1.05,
        )

    def resolve(
        self,
        signal: dict,
        verdicts: list[dict],
        entropy_score: float,
    ) -> dict:
        """
        Run the full strategy resolution with agent verdicts.

        This is the Phase 4 method — called by DebateEngine.

        Returns the complete Strategy AI output dict.
        """
        return resolve_strategy(signal, verdicts, entropy_score)
