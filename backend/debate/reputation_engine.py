"""
OODA Reputation Engine — Phase 4 placeholder
Tracks agent prediction accuracy over time.

Phase 4: Defines the interface. Actual reputation updates
will be implemented when outcome feedback is available.
"""

from sqlalchemy.orm import Session
from backend.database import crud


def get_agent_reputation(db: Session, agent_name: str) -> float:
    """
    Get the current reputation weight for an agent.
    Returns 1.0 if no reputation record exists.
    """
    rep = crud.get_reputation(db, agent_name)
    if rep:
        return rep.reputation_score
    return 1.0


def update_reputation_after_debate(
    db: Session,
    agent_name: str,
    was_correct: bool,
) -> None:
    """
    Update an agent's reputation based on debate outcome.

    Phase 4: Placeholder — actual scoring will be implemented
    when outcome verification is available.
    """
    rep = crud.get_reputation(db, agent_name)
    if not rep:
        return

    # Simple additive adjustment (placeholder)
    delta = 0.02 if was_correct else -0.01
    new_score = max(0.5, min(1.5, rep.reputation_score + delta))

    crud.upsert_agent_reputation(
        db=db,
        agent_name=agent_name,
        reputation_score=new_score,
        total_debates=rep.total_debates + 1,
        correct_predictions=rep.correct_predictions + (1 if was_correct else 0),
    )
