"""
OODA Social Response Generator — Phase 5
Generates social media response asset for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations


def generate_social_response(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a social media response post.

    Returns dict: platform, post_type, draft, tone, hashtags
    """
    signal_type = signal.get("signal_type", "")
    pct_change = signal.get("percentage_change")

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change" and pct_change is not None:
        return {
            "platform": "LinkedIn/X",
            "post_type": "value-positioning",
            "draft": (
                "Great products don't compete on price — they compete on results.\n\n"
                "That's why 500+ teams choose us for marketing automation that "
                "actually drives ROI.\n\n"
                "When your tool delivers 4.2x average ROI, the conversation isn't "
                "about cost — it's about impact.\n\n"
                "Here's what our customers say matters most:\n"
                "  - Reliable platform they can trust (99.9% uptime)\n"
                "  - Support that actually responds (dedicated team)\n"
                "  - Integrations that work (50+ and counting)\n\n"
                "Price gets you in the door. Value keeps you growing."
            ),
            "tone": "confident, non-aggressive",
            "hashtags": ["#CustomerSuccess", "#SaaS", "#BusinessGrowth", "#ValueOverPrice"],
        }

    # ── News / feature scenario ───────────────────────────────────────────
    if signal_type in ("news_mention", "feature_launch"):
        return {
            "platform": "LinkedIn/X",
            "post_type": "thought-leadership",
            "draft": (
                "Innovation isn't about features — it's about solving real problems.\n\n"
                "Our team shipped 12 major updates this quarter, each driven by "
                "customer feedback.\n\n"
                "At our company, we believe the best features come from listening "
                "to customers, not from press releases.\n\n"
                "What problem are you trying to solve? Let us know."
            ),
            "tone": "engaging, customer-centric",
            "hashtags": ["#ProductUpdate", "#CustomerDriven", "#Innovation", "#SaaS"],
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "platform": "LinkedIn/X",
        "post_type": "brand-positioning",
        "draft": (
            "Building the best marketing automation platform, one feature at a time.\n\n"
            "Trusted by 500+ teams. What makes us different? We actually listen."
        ),
        "tone": "authentic, brief",
        "hashtags": ["#MarketingAutomation", "#Growth", "#SaaS"],
    }
