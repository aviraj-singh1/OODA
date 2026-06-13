"""
OODA CRUD Operations
All database access functions. Route files must not contain DB logic directly.

Phase 1: Added missing functions, type-safe signatures, proper upsert, and clean docstrings.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.database.models import (
    Competitor, Signal, AgentVerdict, Debate,
    CounterStrikePackage, AgentReputation,
)


import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_id(prefix: str = "obj") -> str:
    """Generate a short prefixed unique ID, e.g. 'sig_3f7a2b1c'."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"



# ── Competitors ───────────────────────────────────────────────────────────────

def get_competitors(db: Session) -> list[Competitor]:
    """Return all tracked competitors."""
    return db.query(Competitor).order_by(Competitor.name).all()


def get_competitor(db: Session, competitor_id: str) -> Optional[Competitor]:
    """Return a single competitor by ID, or None."""
    return db.query(Competitor).filter(Competitor.id == competitor_id).first()


def create_competitor(
    db: Session,
    id: str,
    name: str,
    website_url: Optional[str] = None,
    pricing_url: Optional[str] = None,
    category: Optional[str] = None,
    created_at: Optional[str] = None,
) -> Competitor:
    """Insert a new competitor. Raises IntegrityError if ID already exists."""
    competitor = Competitor(
        id=id,
        name=name,
        website_url=website_url,
        pricing_url=pricing_url,
        category=category,
        created_at=created_at or _now(),
    )
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    return competitor


# ── Signals ───────────────────────────────────────────────────────────────────

def get_signals(db: Session, limit: int = 50) -> list[Signal]:
    """Return signals ordered by timestamp descending."""
    return (
        db.query(Signal)
        .order_by(Signal.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_signal(db: Session, signal_id: str) -> Optional[Signal]:
    """Return a single signal by ID, or None."""
    return db.query(Signal).filter(Signal.id == signal_id).first()


def get_latest_signal(db: Session) -> Optional[Signal]:
    """Return the most recently created signal."""
    return (
        db.query(Signal)
        .order_by(Signal.timestamp.desc())
        .first()
    )


def get_signals_by_competitor(db: Session, competitor_id: str) -> list[Signal]:
    """Return all signals for a specific competitor."""
    return (
        db.query(Signal)
        .filter(Signal.competitor_id == competitor_id)
        .order_by(Signal.timestamp.desc())
        .all()
    )


def create_signal(
    db: Session,
    id: str,
    source: str,
    signal_type: str,
    summary: str,
    competitor_id: Optional[str] = None,
    raw_content: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    percentage_change: Optional[float] = None,
    severity: str = "MEDIUM",
    timestamp: Optional[str] = None,
    processed: int = 0,
) -> Signal:
    """Insert a new signal."""
    signal = Signal(
        id=id,
        competitor_id=competitor_id,
        source=source,
        signal_type=signal_type,
        summary=summary,
        raw_content=raw_content,
        old_value=old_value,
        new_value=new_value,
        percentage_change=percentage_change,
        severity=severity,
        timestamp=timestamp or _now(),
        processed=processed,
    )
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal


def mark_signal_processed(db: Session, signal_id: str) -> Optional[Signal]:
    """Mark a signal as processed (processed=1). Returns updated signal or None."""
    signal = get_signal(db, signal_id)
    if signal:
        signal.processed = 1
        db.commit()
        db.refresh(signal)
    return signal


# ── Agent Verdicts ────────────────────────────────────────────────────────────

def get_verdicts_by_signal(db: Session, signal_id: str) -> list[AgentVerdict]:
    """Return all agent verdicts for a given signal."""
    return (
        db.query(AgentVerdict)
        .filter(AgentVerdict.signal_id == signal_id)
        .all()
    )


def delete_verdicts_by_signal(db: Session, signal_id: str) -> int:
    """Delete all agent verdicts for a given signal. Returns count deleted."""
    count = (
        db.query(AgentVerdict)
        .filter(AgentVerdict.signal_id == signal_id)
        .delete()
    )
    db.commit()
    return count


def create_verdict(
    db: Session,
    id: str,
    signal_id: str,
    agent_name: str,
    agent_codename: Optional[str] = None,
    verdict: Optional[str] = None,
    confidence: Optional[float] = None,
    reasoning: Optional[str] = None,
    evidence_json: Optional[str] = None,
    recommended_action: Optional[str] = None,
    urgency: Optional[str] = None,
    reputation_weight: float = 1.0,
) -> AgentVerdict:
    """Insert a new agent verdict."""
    obj = AgentVerdict(
        id=id,
        signal_id=signal_id,
        agent_name=agent_name,
        agent_codename=agent_codename,
        verdict=verdict,
        confidence=confidence,
        reasoning=reasoning,
        evidence_json=evidence_json,
        recommended_action=recommended_action,
        urgency=urgency,
        reputation_weight=reputation_weight,
        created_at=_now(),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ── Debates ───────────────────────────────────────────────────────────────────

def get_debate(db: Session, debate_id: str) -> Optional[Debate]:
    """Return a debate by ID."""
    return db.query(Debate).filter(Debate.id == debate_id).first()


def get_latest_debate(db: Session) -> Optional[Debate]:
    """Return the most recent debate."""
    return db.query(Debate).order_by(Debate.created_at.desc()).first()


def get_debate_by_signal(db: Session, signal_id: str) -> Optional[Debate]:
    """Return the latest debate associated with a signal."""
    return (
        db.query(Debate)
        .filter(Debate.signal_id == signal_id)
        .order_by(Debate.created_at.desc())
        .first()
    )


def create_debate(
    db: Session,
    id: str,
    signal_id: str,
    final_verdict: Optional[str] = None,
    final_confidence: Optional[float] = None,
    conflict_summary: Optional[str] = None,
    strategic_reasoning: Optional[str] = None,
    recommended_action: Optional[str] = None,
    market_entropy_score: Optional[float] = None,
) -> Debate:
    """Insert a new debate record."""
    obj = Debate(
        id=id,
        signal_id=signal_id,
        final_verdict=final_verdict,
        final_confidence=final_confidence,
        conflict_summary=conflict_summary,
        strategic_reasoning=strategic_reasoning,
        recommended_action=recommended_action,
        market_entropy_score=market_entropy_score,
        created_at=_now(),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ── Counter-Strike Packages ──────────────────────────────────────────────────

def get_latest_package(db: Session) -> Optional[CounterStrikePackage]:
    """Return the most recently created counter-strike package."""
    return (
        db.query(CounterStrikePackage)
        .order_by(CounterStrikePackage.created_at.desc())
        .first()
    )


def get_package(db: Session, package_id: str) -> Optional[CounterStrikePackage]:
    """Return a counter-strike package by ID."""
    return (
        db.query(CounterStrikePackage)
        .filter(CounterStrikePackage.id == package_id)
        .first()
    )


def create_package(
    db: Session,
    id: str,
    signal_id: str,
    debate_id: Optional[str] = None,
    title: Optional[str] = None,
    retention_email_json: Optional[str] = None,
    battlecard_json: Optional[str] = None,
    social_response_json: Optional[str] = None,
    internal_alert_json: Optional[str] = None,
    pdf_url: Optional[str] = None,
) -> CounterStrikePackage:
    """Insert a new counter-strike package with status=PENDING."""
    obj = CounterStrikePackage(
        id=id,
        signal_id=signal_id,
        debate_id=debate_id,
        title=title,
        status="PENDING",
        retention_email_json=retention_email_json,
        battlecard_json=battlecard_json,
        social_response_json=social_response_json,
        internal_alert_json=internal_alert_json,
        pdf_url=pdf_url,
        deployed=0,
        created_at=_now(),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def deploy_package(db: Session, package_id: str) -> Optional[CounterStrikePackage]:
    """Mark a package as deployed. Returns updated package or None if not found."""
    package = get_package(db, package_id)
    if package:
        package.deployed = 1
        package.status = "DEPLOYED"
        db.commit()
        db.refresh(package)
    return package


# ── Agent Reputation ──────────────────────────────────────────────────────────

def get_reputations(db: Session) -> list[AgentReputation]:
    """Return reputation records for all agents."""
    return db.query(AgentReputation).order_by(AgentReputation.agent_name).all()


def get_reputation(db: Session, agent_name: str) -> Optional[AgentReputation]:
    """Return reputation for a specific agent by name."""
    return (
        db.query(AgentReputation)
        .filter(AgentReputation.agent_name == agent_name)
        .first()
    )


def upsert_agent_reputation(
    db: Session,
    agent_name: str,
    reputation_score: float = 1.0,
    total_debates: int = 0,
    correct_predictions: int = 0,
) -> AgentReputation:
    """
    Insert or update an agent reputation record.
    Updates all fields if record already exists.
    """
    rep = get_reputation(db, agent_name)
    now = _now()
    if rep:
        rep.reputation_score = reputation_score
        rep.total_debates = total_debates
        rep.correct_predictions = correct_predictions
        rep.updated_at = now
    else:
        rep = AgentReputation(
            agent_name=agent_name,
            reputation_score=reputation_score,
            total_debates=total_debates,
            correct_predictions=correct_predictions,
            updated_at=now,
        )
        db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep


# ── Utility ───────────────────────────────────────────────────────────────────

def clear_all_data(db: Session) -> None:
    """
    Wipe all rows from every table in dependency order.
    Used exclusively by the demo seed endpoint.
    """
    db.query(CounterStrikePackage).delete()
    db.query(Debate).delete()
    db.query(AgentVerdict).delete()
    db.query(Signal).delete()
    db.query(Competitor).delete()
    db.query(AgentReputation).delete()
    db.commit()
