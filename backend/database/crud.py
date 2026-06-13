"""
OODA CRUD Operations
Database access functions for all models.
"""

from sqlalchemy.orm import Session
from typing import Optional
from backend.database.models import (
    Competitor, Signal, AgentVerdict, Debate,
    CounterStrikePackage, AgentReputation
)


# ── Competitors ───────────────────────────────────────────────────────────────

def get_competitors(db: Session) -> list[Competitor]:
    return db.query(Competitor).all()


def get_competitor(db: Session, competitor_id: str) -> Optional[Competitor]:
    return db.query(Competitor).filter(Competitor.id == competitor_id).first()


def create_competitor(db: Session, **kwargs) -> Competitor:
    competitor = Competitor(**kwargs)
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    return competitor


# ── Signals ───────────────────────────────────────────────────────────────────

def get_signals(db: Session, limit: int = 50) -> list[Signal]:
    return db.query(Signal).order_by(Signal.timestamp.desc()).limit(limit).all()


def get_signal(db: Session, signal_id: str) -> Optional[Signal]:
    return db.query(Signal).filter(Signal.id == signal_id).first()


def create_signal(db: Session, **kwargs) -> Signal:
    signal = Signal(**kwargs)
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal


def get_signals_by_competitor(db: Session, competitor_id: str) -> list[Signal]:
    return (
        db.query(Signal)
        .filter(Signal.competitor_id == competitor_id)
        .order_by(Signal.timestamp.desc())
        .all()
    )


# ── Agent Verdicts ────────────────────────────────────────────────────────────

def get_verdicts_by_signal(db: Session, signal_id: str) -> list[AgentVerdict]:
    return (
        db.query(AgentVerdict)
        .filter(AgentVerdict.signal_id == signal_id)
        .all()
    )


def create_verdict(db: Session, **kwargs) -> AgentVerdict:
    verdict = AgentVerdict(**kwargs)
    db.add(verdict)
    db.commit()
    db.refresh(verdict)
    return verdict


# ── Debates ───────────────────────────────────────────────────────────────────

def get_debate(db: Session, debate_id: str) -> Optional[Debate]:
    return db.query(Debate).filter(Debate.id == debate_id).first()


def get_latest_debate(db: Session) -> Optional[Debate]:
    return db.query(Debate).order_by(Debate.created_at.desc()).first()


def get_debate_by_signal(db: Session, signal_id: str) -> Optional[Debate]:
    return (
        db.query(Debate)
        .filter(Debate.signal_id == signal_id)
        .order_by(Debate.created_at.desc())
        .first()
    )


def create_debate(db: Session, **kwargs) -> Debate:
    debate = Debate(**kwargs)
    db.add(debate)
    db.commit()
    db.refresh(debate)
    return debate


# ── Counter-Strike Packages ──────────────────────────────────────────────────

def get_latest_package(db: Session) -> Optional[CounterStrikePackage]:
    return (
        db.query(CounterStrikePackage)
        .order_by(CounterStrikePackage.created_at.desc())
        .first()
    )


def get_package(db: Session, package_id: str) -> Optional[CounterStrikePackage]:
    return (
        db.query(CounterStrikePackage)
        .filter(CounterStrikePackage.id == package_id)
        .first()
    )


def create_package(db: Session, **kwargs) -> CounterStrikePackage:
    package = CounterStrikePackage(**kwargs)
    db.add(package)
    db.commit()
    db.refresh(package)
    return package


def deploy_package(db: Session, package_id: str) -> Optional[CounterStrikePackage]:
    package = get_package(db, package_id)
    if package:
        package.deployed = 1
        package.status = "DEPLOYED"
        db.commit()
        db.refresh(package)
    return package


# ── Agent Reputation ──────────────────────────────────────────────────────────

def get_reputations(db: Session) -> list[AgentReputation]:
    return db.query(AgentReputation).all()


def get_reputation(db: Session, agent_name: str) -> Optional[AgentReputation]:
    return (
        db.query(AgentReputation)
        .filter(AgentReputation.agent_name == agent_name)
        .first()
    )


def create_or_update_reputation(
    db: Session, agent_name: str, score: float = 1.0
) -> AgentReputation:
    rep = get_reputation(db, agent_name)
    if rep:
        rep.reputation_score = score
        db.commit()
        db.refresh(rep)
        return rep
    rep = AgentReputation(agent_name=agent_name, reputation_score=score)
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep


# ── Utility ───────────────────────────────────────────────────────────────────

def clear_all_data(db: Session):
    """Wipe all rows — used before re-seeding demo data."""
    db.query(CounterStrikePackage).delete()
    db.query(Debate).delete()
    db.query(AgentVerdict).delete()
    db.query(Signal).delete()
    db.query(Competitor).delete()
    db.query(AgentReputation).delete()
    db.commit()
