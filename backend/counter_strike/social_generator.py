"""
OODA Social Response Generator — Phase 5
Generates social media response assets for the Counter-Strike package.
Deterministic demo output — no LLM dependency.
"""

from __future__ import annotations


def generate_social_response(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a social media response (tweet/LinkedIn/post) asset.

    Returns a dict with:
        platform, content, tone, hashtags, strategy_notes
    """
    signal_type = signal.get("signal_type", "")
    pct_change = signal.get("percentage_change")
    final_verdict = (debate.get("final_verdict") or "").upper()

    # ── Price change scenario ─────────────────────────────────────────────
    if signal_type == "price_change" and pct_change is not None:
        return {
            "posts": [
                {
                    "platform": "Twitter/X",
                    "content": (
                        "Great products don't compete on price — they compete on results.\n\n"
                        "That's why 500+ teams choose us for marketing automation "
                        "that actually drives ROI. 📈\n\n"
                        "See what real value looks like →"
                    ),
                    "tone": "confident, value-focused, non-aggressive",
                    "character_count": 195,
                },
                {
                    "platform": "LinkedIn",
                    "content": (
                        "There's a lot of noise in the marketing automation space right now.\n\n"
                        "Some are competing on price. We're competing on outcomes.\n\n"
                        "When your tool delivers 4.2x average ROI, the conversation "
                        "isn't about cost — it's about impact.\n\n"
                        "Here's what our customers say matters most:\n"
                        "✅ Reliable platform they can trust (99.9% uptime)\n"
                        "✅ Support that actually responds (dedicated team)\n"
                        "✅ Integrations that work (50+ and counting)\n\n"
                        "Price gets you in the door. Value keeps you growing. 🚀"
                    ),
                    "tone": "professional, thought-leadership",
                    "character_count": 485,
                },
            ],
            "hashtags": [
                "#MarketingAutomation",
                "#ROI",
                "#CustomerSuccess",
                "#ValueOverPrice",
            ],
            "strategy_notes": (
                "Do NOT mention the competitor by name. Frame as a general "
                "market observation. Emphasize value and results, not price. "
                "Schedule within 24 hours of competitor announcement."
            ),
            "publish_timing": "Within 24 hours of competitor price change",
        }

    # ── News mention / feature launch ─────────────────────────────────────
    if signal_type in ("news_mention", "feature_launch"):
        return {
            "posts": [
                {
                    "platform": "Twitter/X",
                    "content": (
                        "Innovation isn't about features — it's about solving real problems.\n\n"
                        "Our team shipped 12 major updates this quarter, "
                        "each driven by customer feedback.\n\n"
                        "What problem are you trying to solve? Let us know 👇"
                    ),
                    "tone": "engaging, customer-centric",
                    "character_count": 210,
                },
                {
                    "platform": "LinkedIn",
                    "content": (
                        "Excited about the pace of innovation in our space!\n\n"
                        "At [Our Company], we believe the best features come from "
                        "listening to customers, not from press releases.\n\n"
                        "Here's what we shipped this quarter based on YOUR feedback:\n"
                        "🔹 Advanced workflow automation\n"
                        "🔹 Custom reporting dashboards\n"
                        "🔹 Enhanced API and integrations\n\n"
                        "What should we build next? Drop your ideas below 👇"
                    ),
                    "tone": "collaborative, forward-looking",
                    "character_count": 420,
                },
            ],
            "hashtags": [
                "#ProductUpdate",
                "#CustomerDriven",
                "#Innovation",
            ],
            "strategy_notes": (
                "Position ourselves as customer-driven. Don't reference "
                "competitor's launch directly. Show momentum."
            ),
            "publish_timing": "Within 48 hours",
        }

    # ── Default ───────────────────────────────────────────────────────────
    return {
        "posts": [
            {
                "platform": "Twitter/X",
                "content": (
                    "Building the best marketing automation platform, one feature at a time.\n\n"
                    "Trusted by 500+ teams. What makes us different? "
                    "We actually listen. 🎯"
                ),
                "tone": "authentic, brief",
                "character_count": 155,
            },
        ],
        "hashtags": ["#MarketingAutomation", "#Growth"],
        "strategy_notes": "General brand positioning. No competitive urgency.",
        "publish_timing": "Next scheduled post slot",
    }
