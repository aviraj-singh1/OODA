"""
OODA Retention Email Generator — Phase 5
Generates a retention email asset for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations
import json


def generate_retention_email(
    signal: dict,
    debate: dict,
    competitor_name: str = "the competitor",
) -> dict:
    """
    Generate a retention email targeting at-risk customers.

    Returns a dict matching the PRD §16 format:
        subject, body, tone, target_segment
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
            "subject": "Why teams choose value over temporary discounts",
            "body": (
                f"Hi {{{{customer_name}}}},\n\n"
                f"We know there's noise in the market right now — some competitors "
                f"are cutting prices by as much as {abs_pct:.0f}%. We get it. "
                f"Lower prices catch your eye.\n\n"
                f"But here's what a lower price doesn't give you:\n\n"
                f"• **Dedicated support** — You talk to real people, not a ticket queue\n"
                f"• **99.9% uptime** — While others had 3 outages last quarter\n"
                f"• **Advanced analytics** — Full-funnel insights, not basic dashboards\n"
                f"• **3x more integrations** — Connect your entire stack\n\n"
                f"Our customers generate an average of 4.2x ROI within the first year. "
                f"That's not a discount — that's real value.\n\n"
                f"We'd love to show you the numbers. Hit reply and we'll set up a "
                f"quick value review with your account team.\n\n"
                f"Best,\n"
                f"The Team"
            ),
            "tone": "calm, confident, non-aggressive",
            "target_segment": "renewal_customers",
            "cta": "Schedule a value review",
        }

    # ── News / feature scenario ───────────────────────────────────────────
    if signal_type in ("news_mention", "feature_launch"):
        return {
            "subject": "Your competitive advantage just got stronger",
            "body": (
                f"Hi {{{{customer_name}}}},\n\n"
                f"You may have seen some recent news about {competitor_name}. "
                f"We want you to know — our roadmap is focused on what matters "
                f"most to your team.\n\n"
                f"Here's what's coming this quarter:\n\n"
                f"• Advanced AI-powered automation workflows\n"
                f"• Enhanced reporting and custom dashboards\n"
                f"• Deeper CRM integrations\n"
                f"• Priority support for all plans\n\n"
                f"Your success is our priority, and we're doubling down on the "
                f"features that help you grow faster.\n\n"
                f"Best,\n"
                f"The Team"
            ),
            "tone": "proactive, forward-looking",
            "target_segment": "all_active_customers",
            "cta": "See our roadmap",
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "subject": "A quick update from our team",
        "body": (
            f"Hi {{{{customer_name}}}},\n\n"
            f"We're always watching the competitive landscape to make sure "
            f"you have the best tools for your team.\n\n"
            f"If you have any questions about how we compare or want to "
            f"explore new features, our team is here to help.\n\n"
            f"Best,\n"
            f"The Team"
        ),
        "tone": "neutral, supportive",
        "target_segment": "renewal_customers",
        "cta": "Talk to your account manager",
    }
