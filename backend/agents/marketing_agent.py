"""
OODA Marketing AI — Codename: Watcher
Evaluates signals through a marketing positioning and buyer perception lens.

Phase 3: Deterministic demo responses.
"""

from backend.agents.base_agent import BaseAgent


class MarketingAgent(BaseAgent):
    """Marketing AI agent focused on positioning, messaging, and perception risk."""

    def __init__(self):
        super().__init__(
            name="Marketing AI",
            codename="Watcher",
            lens="marketing_positioning",
        )

    def _analyze_demo(self, signal: dict, entropy_score: float) -> dict:
        """Return deterministic demo verdict based on signal type."""
        signal_type = signal.get("signal_type", "")
        pct = signal.get("percentage_change")

        # ── Price change scenario ─────────────────────────────────────
        if signal_type == "price_change" and pct is not None and pct <= -20:
            return self._build_verdict(
                verdict="THREAT",
                confidence=0.82,
                reasoning=(
                    "RivalFlow's 25% price cut directly undermines our value positioning. "
                    "Prospects comparing plans will now see a ₹250/month gap, making our "
                    "pricing harder to justify without clear feature differentiation messaging."
                ),
                evidence=[
                    "Competitor now positioned as 'most affordable' in the segment",
                    "Price-sensitive SMB buyers may switch during renewal windows",
                    "Our current messaging does not address affordability objections",
                ],
                recommended_action=(
                    "Launch value-focused retention messaging emphasizing ROI, "
                    "reliability, and features not available at the competitor's price point"
                ),
                urgency="HIGH",
                reputation_weight=1.03,
            )

        # ── News mention scenario ─────────────────────────────────────
        if signal_type == "news_mention":
            return self._build_verdict(
                verdict="THREAT",
                confidence=0.68,
                reasoning=(
                    "Press coverage of the price cut amplifies its market impact. "
                    "The narrative frames RivalFlow as aggressive and customer-friendly."
                ),
                evidence=[
                    "TechCrunch coverage increases visibility 10x",
                    "Competitor narrative controls market perception",
                    "Our brand is absent from the conversation",
                ],
                recommended_action="Prepare a counter-narrative press release highlighting product superiority",
                urgency="MEDIUM",
                reputation_weight=1.03,
            )

        # ── Default / other signals ───────────────────────────────────
        return self._build_verdict(
            verdict="NEUTRAL",
            confidence=0.50,
            reasoning="Signal does not directly impact marketing positioning at this time.",
            evidence=[
                "No pricing change detected",
                "Current messaging remains competitive",
                "Buyer perception stable",
            ],
            recommended_action="Monitor for follow-up signals before taking action",
            urgency="LOW",
            reputation_weight=1.03,
        )
