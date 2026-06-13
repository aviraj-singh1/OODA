"""
OODA Sales Battlecard Generator — Phase 5
Generates a battlecard asset for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations


def generate_battlecard(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a sales battlecard for the sales team.

    Returns a dict matching the PRD §16 battlecard format:
        title, objection, response, talking_points, do_not_say
    """
    signal_type = signal.get("signal_type", "")
    pct_change = signal.get("percentage_change")
    old_value = signal.get("old_value", "")
    new_value = signal.get("new_value", "")
    final_verdict = (debate.get("final_verdict") or "").upper()

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change" and pct_change is not None:
        abs_pct = abs(pct_change)
        return {
            "title": f"{competitor_name} Price Drop Battlecard",
            "competitor": competitor_name,
            "their_price": new_value or "Unknown",
            "our_price": old_value or "Current pricing",
            "objection": f"{competitor_name} is now {abs_pct:.0f}% cheaper. Why should I pay more?",
            "response": (
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
                "Do not share our internal pricing strategy or upcoming changes",
            ],
            "key_differentiators": [
                {"feature": "Uptime SLA", "us": "99.9% guaranteed", "them": "No SLA published"},
                {"feature": "Support", "us": "Dedicated account manager", "them": "Ticket queue only"},
                {"feature": "Integrations", "us": "50+ native integrations", "them": "~18 integrations"},
                {"feature": "Analytics", "us": "Full-funnel attribution", "them": "Basic dashboards"},
                {"feature": "Security", "us": "SOC 2 Type II certified", "them": "SOC 2 Type I"},
            ],
            "urgency": "HIGH" if final_verdict == "THREAT" else "MEDIUM",
        }

    # ── Feature launch scenario ───────────────────────────────────────────
    if signal_type == "feature_launch":
        feature_name = signal.get("new_value", "new feature")
        return {
            "title": f"{competitor_name} Feature Launch Battlecard",
            "competitor": competitor_name,
            "objection": f"{competitor_name} just launched {feature_name}. Do you have that?",
            "response": (
                f"Great question. We've had a similar capability in our platform "
                f"for over 6 months — and ours is more deeply integrated. "
                f"The real question is: does it work with your existing workflow? "
                f"That's where we shine."
            ),
            "talking_points": [
                f"Acknowledge the feature — don't dismiss it",
                "Pivot to our broader platform advantage",
                "Emphasize integration depth over feature count",
                "Ask about their specific workflow needs",
            ],
            "do_not_say": [
                "Do not claim our feature is identical if it isn't",
                "Do not dismiss their launch as irrelevant",
            ],
            "urgency": "MEDIUM",
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "title": f"{competitor_name} Competitive Battlecard",
        "competitor": competitor_name,
        "objection": f"Why should I choose you over {competitor_name}?",
        "response": (
            f"We focus on delivering measurable results. Our customers see "
            f"4.2x ROI on average, and we back that with dedicated support "
            f"and enterprise-grade reliability."
        ),
        "talking_points": [
            "Lead with customer success stories",
            "Highlight support and reliability",
            "Show integration ecosystem",
        ],
        "do_not_say": [
            "Do not make unverified claims about competitors",
        ],
        "urgency": "LOW",
    }
