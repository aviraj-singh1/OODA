"""
OODA Agent Runner
Orchestrates running all active agents against a given signal.

Phase 3: Runs Marketing AI, Product AI, and Sales AI.
Strategy AI is excluded — it will be activated in Phase 4.
"""

from backend.agents.marketing_agent import MarketingAgent
from backend.agents.product_agent import ProductAgent
from backend.agents.sales_agent import SalesAgent


# Pre-instantiate agents (stateless — safe to reuse)
_AGENTS = [
    MarketingAgent(),
    ProductAgent(),
    SalesAgent(),
]


def run_all_agents(signal: dict, entropy_score: float = 0.0) -> list[dict]:
    """
    Run all active agents against a signal and return their verdicts.

    Parameters
    ----------
    signal : dict
        Signal data dict (must include signal_type, percentage_change, etc.)
    entropy_score : float
        Current Market Entropy Score.

    Returns
    -------
    list[dict]
        List of verdict dicts, one per agent.
    """
    verdicts = []
    for agent in _AGENTS:
        verdict = agent.analyze(signal, entropy_score)
        verdicts.append(verdict)
    return verdicts
