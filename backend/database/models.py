"""
OODA Database Models
SQLAlchemy ORM models for all core tables.

Phase 1: Strengthened field nullability, defaults, and server_defaults.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Integer, ForeignKey, create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from backend.config import settings

Base = declarative_base()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,  # Set SQL_ECHO=true in .env to enable SQL logging (echo=True crashes on Unicode)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _now_iso() -> str:
    """Return current UTC time as ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def get_db():
    """Dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables (no-op if already exist)."""
    Base.metadata.create_all(bind=engine)


# ── Models ────────────────────────────────────────────────────────────────────


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    website_url = Column(String, nullable=True)
    pricing_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(String, nullable=False, default=_now_iso)

    signals = relationship(
        "Signal",
        back_populates="competitor",
        cascade="all, delete-orphan",
    )


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True)
    competitor_id = Column(String, ForeignKey("competitors.id", ondelete="SET NULL"), nullable=True)
    source = Column(String, nullable=False)
    signal_type = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    raw_content = Column(Text, nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    percentage_change = Column(Float, nullable=True)
    severity = Column(String, nullable=False, default="MEDIUM")
    timestamp = Column(String, nullable=False, default=_now_iso)
    processed = Column(Integer, nullable=False, default=0)

    competitor = relationship("Competitor", back_populates="signals")
    verdicts = relationship(
        "AgentVerdict",
        back_populates="signal",
        cascade="all, delete-orphan",
    )
    debates = relationship(
        "Debate",
        back_populates="signal",
        cascade="all, delete-orphan",
    )
    packages = relationship(
        "CounterStrikePackage",
        back_populates="signal",
        cascade="all, delete-orphan",
    )


class AgentVerdict(Base):
    __tablename__ = "agent_verdicts"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String, nullable=False)
    verdict = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    urgency = Column(String, nullable=True)
    reputation_weight = Column(Float, nullable=True, default=1.0)
    created_at = Column(String, nullable=False, default=_now_iso)

    signal = relationship("Signal", back_populates="verdicts")


class Debate(Base):
    __tablename__ = "debates"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id", ondelete="CASCADE"), nullable=False)
    final_verdict = Column(String, nullable=True)
    final_confidence = Column(Float, nullable=True)
    conflict_summary = Column(Text, nullable=True)
    strategic_reasoning = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    market_entropy_score = Column(Float, nullable=True)
    created_at = Column(String, nullable=False, default=_now_iso)

    signal = relationship("Signal", back_populates="debates")
    packages = relationship(
        "CounterStrikePackage",
        back_populates="debate",
        cascade="all, delete-orphan",
    )


class CounterStrikePackage(Base):
    __tablename__ = "counter_strike_packages"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id", ondelete="CASCADE"), nullable=False)
    debate_id = Column(String, ForeignKey("debates.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=True)
    status = Column(String, nullable=False, default="PENDING")
    retention_email_json = Column(Text, nullable=True)
    battlecard_json = Column(Text, nullable=True)
    social_response_json = Column(Text, nullable=True)
    internal_alert_json = Column(Text, nullable=True)
    pdf_url = Column(String, nullable=True)
    deployed = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False, default=_now_iso)

    signal = relationship("Signal", back_populates="packages")
    debate = relationship("Debate", back_populates="packages")


class AgentReputation(Base):
    __tablename__ = "agent_reputation"

    agent_name = Column(String, primary_key=True)
    reputation_score = Column(Float, nullable=False, default=1.0)
    total_debates = Column(Integer, nullable=False, default=0)
    correct_predictions = Column(Integer, nullable=False, default=0)
    updated_at = Column(String, nullable=False, default=_now_iso)
