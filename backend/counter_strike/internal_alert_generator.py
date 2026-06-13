"""
OODA Internal Alert Generator — Phase 5
Generates an internal team alert asset for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations


def generate_internal_alert(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate an internal team alert (Slack/Teams notification).

    Returns dict: channel, priority, title, message, action_items
    """
    signal_type = signal.get("signal_type", "")
    severity = signal.get("severity", "MEDIUM")
    summary = signal.get("summary", "Competitor activity detected")
    final_verdict = (debate.get("final_verdict") or "NEUTRAL").upper()

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change":
        return {
            "channel": "sales-team",
            "priority": "HIGH",
            "title": f"{competitor_name} price drop detected",
            "message": (
                f"{competitor_name} has reduced their pricing significantly. "
                f"{summary} Strategy AI assessed this as a {final_verdict} with high confidence. "
                f"Immediate action required for renewal accounts and active deals."
            ),
            "action_items": [
                "Review all active renewal conversations for pricing sensitivity",
                "Use the updated sales battlecard for objection handling",
                "Flag at-risk accounts in CRM for priority outreach",
                "Prepare talking points for inbound pricing questions",
                "Brief leadership on competitive response plan",
            ],
        }

    # ── Feature launch scenario ───────────────────────────────────────────
    if signal_type == "feature_launch":
        return {
            "channel": "product-team",
            "priority": "MEDIUM",
            "title": f"{competitor_name} feature launch detected",
            "message": (
                f"{summary} Evaluate feature overlap and update competitive "
                f"feature matrix. Prepare positioning response if prospects ask."
            ),
            "action_items": [
                "Evaluate feature overlap with our roadmap",
                "Update competitive feature comparison matrix",
                "Prepare FAQ for sales team on this feature",
            ],
        }

    # ── News mention scenario ─────────────────────────────────────────────
    if signal_type == "news_mention":
        return {
            "channel": "marketing-team",
            "priority": "MEDIUM",
            "title": f"{competitor_name} in the news",
            "message": (
                f"{summary} Monitor for market perception impact "
                f"and prepare counter-narrative if needed."
            ),
            "action_items": [
                "Monitor social media for sentiment shift",
                "Prepare counter-narrative positioning",
                "Brief sales team on potential prospect questions",
            ],
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "channel": "competitive-intel",
        "priority": severity,
        "title": f"{competitor_name} activity detected",
        "message": f"{summary} Strategy AI assessed this as {final_verdict}. Monitor for follow-up signals.",
        "action_items": [
            "Acknowledge and monitor for follow-up signals",
            "Review competitive landscape brief",
        ],
    }
