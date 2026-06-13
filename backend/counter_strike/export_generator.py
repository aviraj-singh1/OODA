"""
OODA Competitor Comparison Report Generator — Phase 5
Generates a structured comparison report for the Counter-Strike package.
Deterministic demo output — no LLM dependency.

Note: OfficeKit is NOT a code-level exporter. This module generates
the structured data. OfficeKit is used for phone-laptop workflow.
"""

from __future__ import annotations


def generate_comparison_report(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a competitor comparison one-pager report.

    Returns dict: title, summary, sections (list of heading/content)
    """
    signal_type = signal.get("signal_type", "")
    old_value = signal.get("old_value", "")
    new_value = signal.get("new_value", "")
    pct_change = signal.get("percentage_change")
    final_verdict = (debate.get("final_verdict") or "NEUTRAL").upper()
    confidence = debate.get("final_confidence", 0)
    entropy = debate.get("market_entropy_score", 0)

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change" and pct_change is not None:
        abs_pct = abs(pct_change)
        confidence_pct = round((confidence or 0) * 100)

        return {
            "title": f"{competitor_name} Competitive Response Report",
            "summary": (
                f"{competitor_name} reduced pricing by {abs_pct:.0f}%, from {old_value} to {new_value}. "
                f"Strategy AI assessed this as {final_verdict} with {confidence_pct}% confidence. "
                f"Market Entropy Score is {entropy:.0f}. Immediate retention and sales enablement actions recommended."
            ),
            "sections": [
                {
                    "heading": "What changed",
                    "content": (
                        f"{competitor_name} dropped their Pro Plan pricing from {old_value} to {new_value}, "
                        f"representing a {abs_pct:.0f}% reduction. The pricing page now emphasizes "
                        f"'Most affordable marketing automation for growing teams.' This signals a "
                        f"deliberate push to capture price-sensitive SMB customers in our core segment."
                    ),
                },
                {
                    "heading": "Why it matters",
                    "content": (
                        f"This price cut creates three immediate risks: (1) Prospects comparing plans "
                        f"will see a significant price gap, making our pricing harder to justify without "
                        f"clear differentiation. (2) Renewal accounts may leverage this for discounts. "
                        f"(3) Market narrative shifts to position {competitor_name} as the value option. "
                        f"The Market Entropy Score of {entropy:.0f} indicates elevated competitive volatility."
                    ),
                },
                {
                    "heading": "Our competitive advantages",
                    "content": (
                        f"We maintain clear advantages in: 99.9% uptime SLA (vs no published SLA), "
                        f"dedicated account management (vs ticket-only support), 50+ native integrations "
                        f"(vs ~18), full-funnel analytics (vs basic dashboards), and SOC 2 Type II "
                        f"certification (vs Type I). Customers report 4.2x average ROI."
                    ),
                },
                {
                    "heading": "Recommended response",
                    "content": (
                        f"1. Launch value-focused retention campaign for renewal accounts. "
                        f"2. Update sales battlecard with pricing objection responses. "
                        f"3. Arm customer success team with comparison talking points. "
                        f"4. Publish value-over-price positioning content. "
                        f"5. Do NOT match pricing reactively — compete on value and outcomes."
                    ),
                },
                {
                    "heading": "Risk assessment",
                    "content": (
                        f"Threat Level: {final_verdict} | Confidence: {confidence_pct}% | "
                        f"Entropy: {entropy:.0f}/100. The price cut may indicate competitive pressure "
                        f"on {competitor_name}'s side, but the immediate risk to our pipeline is real. "
                        f"Focus on protecting existing revenue before pursuing offensive plays."
                    ),
                },
            ],
        }

    # ── Feature launch scenario ───────────────────────────────────────────
    if signal_type == "feature_launch":
        feature_name = signal.get("new_value", "a new feature")
        return {
            "title": f"{competitor_name} Feature Analysis Report",
            "summary": (
                f"{competitor_name} launched {feature_name}. Strategy AI assessed this as "
                f"{final_verdict}. Product team should evaluate overlap with our roadmap."
            ),
            "sections": [
                {
                    "heading": "What changed",
                    "content": f"{competitor_name} launched {feature_name}, positioned as included in all plans.",
                },
                {
                    "heading": "Why it matters",
                    "content": (
                        f"Prospects may ask about feature parity. Our platform already covers "
                        f"similar functionality with deeper integration into existing workflows."
                    ),
                },
                {
                    "heading": "Recommended response",
                    "content": (
                        f"Position our broader platform advantage. Do not engage in "
                        f"feature-by-feature comparison. Focus on ecosystem and workflow value."
                    ),
                },
            ],
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "title": f"{competitor_name} Competitive Intelligence Report",
        "summary": (
            f"New competitive activity detected from {competitor_name}. "
            f"Strategy AI assessed this as {final_verdict}. Monitor and prepare."
        ),
        "sections": [
            {
                "heading": "What changed",
                "content": signal.get("summary", f"Activity detected from {competitor_name}."),
            },
            {
                "heading": "Why it matters",
                "content": f"This signal may impact our market position. Current entropy score: {entropy:.0f}.",
            },
            {
                "heading": "Recommended response",
                "content": "Monitor for follow-up signals. Prepare contingency response plan.",
            },
        ],
    }
