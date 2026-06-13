"""
OODA Strategy Resolver — Phase 4
Deterministic logic that Strategy AI (General) uses to produce
the final strategic verdict from weighted agent scores and conflict data.

No LLM dependency — demo-reliable.
"""

from __future__ import annotations

# ── Verdict value mapping ────────────────────────────────────────────────────

VERDICT_MAP = {
    "THREAT": 1,
    "NEUTRAL": 0,
    "OPPORTUNITY": -1,
}


def _map_verdict(verdict: str) -> int:
    """Map a verdict string to its numeric value. Unknown → 0 (NEUTRAL)."""
    return VERDICT_MAP.get((verdict or "").upper(), 0)


# ── Weighted score ───────────────────────────────────────────────────────────

def calculate_weighted_score(verdicts: list[dict]) -> float:
    """
    Calculate the reputation-weighted final score.

    Formula:
        agent_score = confidence × reputation_weight
        final = Σ(agent_score × verdict_value) / Σ(agent_score)

    Returns a float in [-1, +1]. Positive = THREAT bias.
    """
    numerator = 0.0
    denominator = 0.0

    for v in verdicts:
        confidence = v.get("confidence") or 0.0
        rep_weight = v.get("reputation_weight") or 1.0
        verdict_val = _map_verdict(v.get("verdict", "NEUTRAL"))

        agent_score = confidence * rep_weight
        numerator += agent_score * verdict_val
        denominator += agent_score

    if denominator == 0:
        return 0.0

    return round(numerator / denominator, 4)


def interpret_score(score: float) -> str:
    """Convert weighted score to a final verdict string."""
    if score > 0.35:
        return "THREAT"
    elif score < -0.35:
        return "OPPORTUNITY"
    else:
        return "NEUTRAL"


# ── Conflict detection ───────────────────────────────────────────────────────

def detect_conflict(verdicts: list[dict]) -> bool:
    """
    A debate is conflicted if:
    - At least one agent says THREAT with confidence > 0.75
    AND
    - At least one agent says OPPORTUNITY with confidence > 0.60
    """
    has_high_threat = False
    has_opportunity = False

    for v in verdicts:
        verdict = (v.get("verdict") or "").upper()
        confidence = v.get("confidence") or 0.0

        if verdict == "THREAT" and confidence > 0.75:
            has_high_threat = True
        if verdict == "OPPORTUNITY" and confidence > 0.60:
            has_opportunity = True

    return has_high_threat and has_opportunity


# ── Threat level ─────────────────────────────────────────────────────────────

def determine_threat_level(
    final_verdict: str,
    final_confidence: float,
    entropy_score: float,
) -> str:
    """Determine threat level from verdict + confidence + entropy."""
    if final_verdict != "THREAT":
        if final_verdict == "OPPORTUNITY":
            return "LOW"
        return "MEDIUM"

    # THREAT verdict — scale by confidence and entropy
    if final_confidence >= 0.85 and entropy_score >= 65:
        return "HIGH"
    elif final_confidence >= 0.70:
        return "HIGH"
    elif final_confidence >= 0.50:
        return "MEDIUM"
    else:
        return "LOW"


def determine_urgency(threat_level: str) -> str:
    """Map threat level to urgency."""
    return {
        "CRITICAL": "CRITICAL",
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "LOW",
    }.get(threat_level, "MEDIUM")


# ── Strategy resolution ─────────────────────────────────────────────────────

def resolve_strategy(
    signal: dict,
    verdicts: list[dict],
    entropy_score: float,
) -> dict:
    """
    Run the full Strategy AI resolution pipeline and return the
    final verdict dict matching the StrategyAI output format.

    Parameters
    ----------
    signal : dict       Signal data (signal_type, summary, etc.)
    verdicts : list      Agent verdict dicts from Marketing/Product/Sales
    entropy_score : float  Current Market Entropy Score 0-100

    Returns
    -------
    dict with all Strategy AI output fields
    """
    weighted_score = calculate_weighted_score(verdicts)
    final_verdict = interpret_score(weighted_score)
    conflict = detect_conflict(verdicts)

    # Calculate final confidence as avg of agent confidences weighted by rep
    total_weight = 0.0
    conf_sum = 0.0
    for v in verdicts:
        w = v.get("reputation_weight") or 1.0
        c = v.get("confidence") or 0.0
        conf_sum += c * w
        total_weight += w
    final_confidence = round(conf_sum / total_weight, 2) if total_weight > 0 else 0.0

    # Boost confidence if entropy is high and majority agree on threat
    # Entropy amplifies conviction — high market chaos + agent consensus = stronger signal
    if entropy_score >= 60 and final_verdict == "THREAT":
        final_confidence = min(round(final_confidence + 0.08, 2), 0.99)

    threat_level = determine_threat_level(final_verdict, final_confidence, entropy_score)
    urgency = determine_urgency(threat_level)

    # Build conflict summary
    agent_positions = []
    for v in verdicts:
        name = v.get("agent_name", "Unknown")
        verd = v.get("verdict", "NEUTRAL")
        agent_positions.append(f"{name}: {verd}")

    if conflict:
        # Find the dissenting agent
        threat_agents = [v["agent_name"] for v in verdicts if v.get("verdict") == "THREAT"]
        opp_agents = [v["agent_name"] for v in verdicts if v.get("verdict") == "OPPORTUNITY"]
        neutral_agents = [v["agent_name"] for v in verdicts if v.get("verdict") == "NEUTRAL"]

        dissenting = opp_agents + neutral_agents
        majority = threat_agents

        if final_verdict == "OPPORTUNITY":
            majority, dissenting = opp_agents, threat_agents

        conflict_summary = (
            f"{' and '.join(dissenting)} see{'s' if len(dissenting) == 1 else ''} "
            f"possible competitor weakness, but {' and '.join(majority)} "
            f"agree{'s' if len(majority) == 1 else ''} there is immediate market threat."
        )
    else:
        if final_verdict == "THREAT":
            conflict_summary = "Agents largely agree this signal represents a competitive threat."
        elif final_verdict == "OPPORTUNITY":
            conflict_summary = "Agents see this as a potential opportunity to strengthen position."
        else:
            conflict_summary = "Agents are divided but no strong consensus on threat or opportunity."

    # Build strategic reasoning
    signal_type = signal.get("signal_type", "")
    if signal_type == "price_change" and final_verdict == "THREAT":
        strategic_reasoning = (
            "The price cut may be defensive, indicating competitor pressure, "
            "but the immediate risk to our business is customer comparison during "
            "renewals, pricing objections in active deals, and market perception shift. "
            "Prioritize retention and sales enablement over reactive price matching."
        )
        recommended_action = "Launch retention campaign and update sales battlecard."
        next_best_actions = [
            "Send retention email to renewal accounts",
            "Arm sales team with pricing objection handling",
            "Publish value-over-price positioning post",
        ]
    elif signal_type == "price_change" and final_verdict == "OPPORTUNITY":
        strategic_reasoning = (
            "The competitor's price cut signals market weakness. "
            "This is an opportunity to position our product as the premium choice."
        )
        recommended_action = "Emphasize product quality and value in marketing."
        next_best_actions = [
            "Create comparison content highlighting our advantages",
            "Run targeted ads to competitor's audience",
            "Strengthen product differentiation messaging",
        ]
    else:
        strategic_reasoning = (
            f"Signal analysis shows {'elevated' if final_verdict == 'THREAT' else 'moderate'} "
            f"competitive risk. Market entropy at {entropy_score:.0f} indicates "
            f"{'high' if entropy_score >= 60 else 'moderate'} market instability."
        )
        recommended_action = "Monitor situation and prepare response playbook."
        next_best_actions = [
            "Track competitor follow-up moves",
            "Prepare contingency response",
            "Brief leadership on competitive landscape",
        ]

    return {
        "agent_name": "Strategy AI",
        "agent_codename": "General",
        "final_verdict": final_verdict,
        "threat_level": threat_level,
        "final_confidence": final_confidence,
        "urgency": urgency,
        "market_entropy_score": round(entropy_score, 1),
        "conflict_detected": conflict,
        "conflict_summary": conflict_summary,
        "strategic_reasoning": strategic_reasoning,
        "recommended_action": recommended_action,
        "next_best_actions": next_best_actions,
        "weighted_score": round(weighted_score, 4),
        "agent_round": agent_positions,
    }
