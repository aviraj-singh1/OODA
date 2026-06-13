"""
OODA Sales Battlecard Generator — Phase 5
Generates a battlecard asset for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations


def generate_sales_battlecard(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a sales battlecard for the sales team.

    Returns dict: title, situation, primary_objection, recommended_response,
                  talking_points, do_not_say, battle_position
    """
    signal_type = signal.get("signal_type", "")
    pct_change = signal.get("percentage_change")
    old_value = signal.get("old_value", "")
    new_value = signal.get("new_value", "")

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change" and pct_change is not None:
        abs_pct = abs(pct_change)
        return {
            "title": f"{competitor_name} Price Drop Battlecard",
            "situation": f"{competitor_name} reduced pricing from {old_value or 'previous price'} to {new_value or 'new lower price'} — a {abs_pct:.0f}% price cut aimed at capturing price-sensitive customers.",
            "primary_objection": f"{competitor_name} is cheaper now.",
            "recommended_response": (
                f"Their discount reduces the price, but our platform reduces "
                f"operational risk. When you factor in our uptime guarantee, "
                f"dedicated support, and the integrations your team relies on daily, "
                f"the total value far exceeds the {abs_pct:.0f}% difference."
            ),
            "talking_points": [
                "Compare total value and ROI, not monthly sticker price",
                "Highlight our 99.9% uptime vs their 3 recent outages",
                "Emphasize dedicated support — they use ticket-only model",
                "Show 3x more integrations that save engineering hours",
                "Reference customer case studies with measurable ROI",
                "Offer annual lock-in pricing where needed (manager approval required)",
            ],
            "do_not_say": [
                "Do not attack the competitor directly or by name in writing",
                "Do not promise price matching without VP approval",
                "Do not disparage their product quality without evidence",
                "Do not share our internal pricing strategy",
            ],
            "battle_position": "Compete on value, reliability, and business outcome instead of matching price immediately.",
        }

    # ── Feature launch scenario ───────────────────────────────────────────
    if signal_type == "feature_launch":
        feature_name = signal.get("new_value", "new feature")
        return {
            "title": f"{competitor_name} Feature Launch Battlecard",
            "situation": f"{competitor_name} just launched {feature_name}. Expect prospects to ask about feature parity.",
            "primary_objection": f"{competitor_name} just launched {feature_name}. Do you have that?",
            "recommended_response": (
                f"Great question. We've had a similar capability for over 6 months "
                f"— and ours is more deeply integrated with your existing workflow. "
                f"The real question is: does it solve your actual problem?"
            ),
            "talking_points": [
                f"Acknowledge their feature launch — don't dismiss it",
                "Pivot to our broader platform advantage and ecosystem",
                "Emphasize integration depth over isolated feature count",
                "Ask about their specific workflow needs",
            ],
            "do_not_say": [
                "Do not claim our feature is identical if it isn't",
                "Do not dismiss their launch as irrelevant",
            ],
            "battle_position": "Compete on platform depth and integration, not isolated feature comparison.",
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "title": f"{competitor_name} Competitive Battlecard",
        "situation": f"New competitive activity detected from {competitor_name}. Sales team should be prepared.",
        "primary_objection": f"Why should I choose you over {competitor_name}?",
        "recommended_response": (
            f"We focus on delivering measurable results. Our customers see "
            f"4.2x ROI on average, backed by dedicated support and enterprise-grade reliability."
        ),
        "talking_points": [
            "Lead with customer success stories and case studies",
            "Highlight support quality and response times",
            "Show integration ecosystem breadth",
        ],
        "do_not_say": [
            "Do not make unverified claims about competitors",
        ],
        "battle_position": "Compete on proven results and customer outcomes.",
    }
