"""
OODA Sales AI — Codename: Hunter
Evaluates signals through revenue risk, churn, and pipeline impact lens.

Phase 3: Deterministic demo responses.
"""

from backend.agents.base_agent import BaseAgent


class SalesAgent(BaseAgent):
    """Sales AI agent focused on revenue, renewal risk, and deal pipeline."""

    def __init__(self):
        super().__init__(
            name="Sales AI",
            codename="Hunter",
            lens="sales_revenue",
        )

    def _analyze_demo(self, signal: dict, entropy_score: float) -> dict:
        """Return deterministic demo verdict based on signal type."""
        signal_type = signal.get("signal_type", "")
        pct = signal.get("percentage_change")

        # ── Price change scenario ─────────────────────────────────────
        if signal_type == "price_change" and pct is not None and pct <= -20:
            return self._build_verdict(
                verdict="THREAT",
                confidence=0.91,
                reasoning=(
                    "Immediate revenue risk. 23 active deals in pipeline will face "
                    "pricing objections within 48 hours. Renewal cohort Q3 (₹18L ARR) "
                    "is directly exposed — prospects will demand price matching or discounts."
                ),
                evidence=[
                    "23 active deals will face 'why not RivalFlow at ₹749?' objections",
                    "Q3 renewal cohort of ₹18L ARR at risk of churn or renegotiation",
                    "Sales team currently lacks updated battlecard for pricing defense",
                ],
                recommended_action=(
                    "Update sales battlecard immediately with value-vs-price comparison "
                    "and arm reps with ROI calculator for pricing objection handling"
                ),
                urgency="HIGH",
                reputation_weight=1.08,
            )

        # ── News mention scenario ─────────────────────────────────────
        if signal_type == "news_mention":
            return self._build_verdict(
                verdict="THREAT",
                confidence=0.74,
                reasoning=(
                    "Press coverage will reach prospect inboxes. Expect inbound "
                    "pricing questions from deals in negotiation stage."
                ),
                evidence=[
                    "Prospects actively monitor competitor press",
                    "3 deals in final negotiation may cite this article",
                    "No proactive communication sent to pipeline yet",
                ],
                recommended_action="Send proactive 'why we're worth it' email to all deals in Stage 3+",
                urgency="MEDIUM",
                reputation_weight=1.08,
            )

        # ── Default / other signals ───────────────────────────────────
        return self._build_verdict(
            verdict="NEUTRAL",
            confidence=0.45,
            reasoning="Signal has minimal immediate impact on active sales pipeline.",
            evidence=[
                "No pricing change detected",
                "Pipeline deals not directly affected",
                "Current win rate stable",
            ],
            recommended_action="No immediate sales action required; continue standard follow-ups",
            urgency="LOW",
            reputation_weight=1.08,
        )
