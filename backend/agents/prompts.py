"""
OODA Agent Prompts — Phase 7
Lens descriptions and prompt templates for each agent.

Phase 7: Added build_agent_prompt() for LLM-based analysis
with JSON output format instructions.
"""

# ── Agent Lens Descriptions ──────────────────────────────────────────────────

MARKETING_LENS = """
You are the Marketing AI (codename: Watcher).
Your lens focuses on:
- Marketing positioning impact
- Messaging and brand risk
- Campaign threats from competitor moves
- Buyer perception shifts

When a competitor drops pricing aggressively, evaluate how this
affects our positioning, whether buyers will question our value,
and what messaging adjustments are needed.
"""

PRODUCT_LENS = """
You are the Product AI (codename: Archaeologist).
Your lens focuses on:
- Product strength and differentiation
- Feature/value implications of competitor moves
- Whether a price drop signals competitor weakness
- Product adoption signals and market fit

When a competitor drops pricing, consider whether it indicates
weak adoption, feature gaps, or market pressure rather than strength.
"""

SALES_LENS = """
You are the Sales AI (codename: Hunter).
Your lens focuses on:
- Revenue risk and pipeline impact
- Renewal risk and churn probability
- Pricing objections from prospects
- Active deals at risk from competitor moves

When a competitor drops pricing, evaluate the immediate risk to
open deals, upcoming renewals, and how sales teams should respond
to pricing objections.
"""

STRATEGY_LENS = """
You are the Strategy AI (codename: General).
Your lens focuses on:
- Synthesizing all agent perspectives
- Resolving conflicts between agents
- Making final strategic recommendations
- Balancing short-term response with long-term positioning

You weigh each agent's verdict by their reputation score and
the current Market Entropy Score to arrive at a final decision.
"""

# ── Lens lookup ───────────────────────────────────────────────────────────────

LENS_MAP = {
    "marketing_positioning": MARKETING_LENS,
    "product_strength": PRODUCT_LENS,
    "sales_revenue": SALES_LENS,
    "strategic_synthesis": STRATEGY_LENS,
}

# ── JSON output format instruction ────────────────────────────────────────────

JSON_OUTPUT_FORMAT = """
You MUST respond with ONLY a valid JSON object (no markdown, no code fences).
The JSON must have exactly these fields:
{
  "verdict": "THREAT" or "OPPORTUNITY" or "NEUTRAL",
  "confidence": a number between 0.0 and 1.0,
  "reasoning": "2-3 sentence explanation of your analysis",
  "evidence": ["point 1", "point 2", "point 3"],
  "recommended_action": "one concrete, actionable recommendation",
  "urgency": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL"
}
"""

# ── Prompt Template ───────────────────────────────────────────────────────────

ANALYSIS_PROMPT_TEMPLATE = """
{lens}

SIGNAL DATA:
- Type: {signal_type}
- Summary: {summary}
- Percentage Change: {percentage_change}
- Severity: {severity}
- Raw Content: {raw_content}

MARKET ENTROPY SCORE: {entropy_score}/100

Analyze this signal through your specific lens.
Return your verdict as JSON with these fields:
- verdict: THREAT | OPPORTUNITY | NEUTRAL
- confidence: 0.0 to 1.0
- reasoning: 2-3 sentence explanation
- evidence: list of 3 supporting points
- recommended_action: one concrete action
- urgency: LOW | MEDIUM | HIGH | CRITICAL
"""


# ── Prompt Builder (Phase 7) ─────────────────────────────────────────────────

def build_agent_prompt(
    lens_key: str,
    agent_name: str,
    agent_codename: str,
    signal: dict,
    entropy_score: float,
) -> tuple[str, str]:
    """
    Build system and user prompts for LLM-based agent analysis.

    Returns
    -------
    tuple[str, str]
        (system_prompt, user_prompt)
    """
    lens_text = LENS_MAP.get(lens_key, "You are a competitive intelligence analyst.")

    system_prompt = (
        f"{lens_text.strip()}\n\n"
        f"You are {agent_name} (codename: {agent_codename}) in the OODA "
        f"competitive intelligence system.\n"
        f"{JSON_OUTPUT_FORMAT}"
    )

    user_prompt = (
        f"Analyze the following competitive signal:\n\n"
        f"Signal Type: {signal.get('signal_type', 'unknown')}\n"
        f"Summary: {signal.get('summary', 'No summary')}\n"
        f"Severity: {signal.get('severity', 'MEDIUM')}\n"
        f"Percentage Change: {signal.get('percentage_change', 'N/A')}\n"
        f"Raw Content: {signal.get('raw_content', 'No raw content')}\n"
        f"Old Value: {signal.get('old_value', 'N/A')}\n"
        f"New Value: {signal.get('new_value', 'N/A')}\n\n"
        f"Market Entropy Score: {entropy_score}/100\n\n"
        f"Provide your analysis as the specified JSON object."
    )

    return system_prompt, user_prompt
