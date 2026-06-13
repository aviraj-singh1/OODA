"""
OODA Product AI — Codename: Archaeologist
Evaluates signals through product strength, adoption, and differentiation lens.

Phase 3: Deterministic demo responses.
"""

from backend.agents.base_agent import BaseAgent


class ProductAgent(BaseAgent):
    """Product AI agent focused on product strength and competitive differentiation."""

    def __init__(self):
        super().__init__(
            name="Product AI",
            codename="Archaeologist",
            lens="product_strength",
        )

    def _analyze_demo(self, signal: dict, entropy_score: float) -> dict:
        """Return deterministic demo verdict based on signal type."""
        signal_type = signal.get("signal_type", "")
        pct = signal.get("percentage_change")

        # ── Price change scenario ─────────────────────────────────────
        if signal_type == "price_change" and pct is not None and pct <= -20:
            return self._build_verdict(
                verdict="OPPORTUNITY",
                confidence=0.64,
                reasoning=(
                    "A 25% price cut often signals weak product-market fit or declining "
                    "adoption. RivalFlow may be struggling to retain users on value alone, "
                    "resorting to price as a lever. This creates an opportunity to emphasize "
                    "our product depth and reliability."
                ),
                evidence=[
                    "Aggressive discounting typically indicates churn pressure",
                    "No new feature announcements accompany the price drop",
                    "Our product NPS and retention metrics remain strong",
                ],
                recommended_action=(
                    "Highlight product reliability, uptime guarantees, and premium "
                    "features in comparison content to exploit competitor weakness"
                ),
                urgency="MEDIUM",
                reputation_weight=0.97,
            )

        # ── Feature launch scenario ───────────────────────────────────
        if signal_type == "feature_launch":
            return self._build_verdict(
                verdict="NEUTRAL",
                confidence=0.55,
                reasoning=(
                    "Competitor feature launch is incremental. AI subject line generators "
                    "are commodity features available in most marketing tools."
                ),
                evidence=[
                    "Feature is not novel — similar tools widely available",
                    "Unlikely to shift adoption meaningfully",
                    "Our feature set already covers this use case",
                ],
                recommended_action="Add this feature to competitive tracking board; no immediate product action needed",
                urgency="LOW",
                reputation_weight=0.97,
            )

        # ── Default / other signals ───────────────────────────────────
        return self._build_verdict(
            verdict="NEUTRAL",
            confidence=0.50,
            reasoning="Signal has limited product implications at this time.",
            evidence=[
                "No direct product impact detected",
                "Feature parity maintained",
                "Product roadmap unaffected",
            ],
            recommended_action="Continue monitoring competitor product changes",
            urgency="LOW",
            reputation_weight=0.97,
        )
