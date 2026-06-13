"""
OODA Database Models
SQLAlchemy ORM models for all core tables.
"""

from sqlalchemy import (
    Column, String, Text, Float, Integer, ForeignKey, create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from backend.config import settings

Base = declarative_base()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


# ── Models ────────────────────────────────────────────────────────────────────


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    website_url = Column(String)
    pricing_url = Column(String)
    category = Column(String)
    created_at = Column(String)

    signals = relationship("Signal", back_populates="competitor")


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True)
    competitor_id = Column(String, ForeignKey("competitors.id"))
    source = Column(String, nullable=False)
    signal_type = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    raw_content = Column(Text)
    old_value = Column(String)
    new_value = Column(String)
    percentage_change = Column(Float)
    severity = Column(String)
    timestamp = Column(String)
    processed = Column(Integer, default=0)

    competitor = relationship("Competitor", back_populates="signals")
    verdicts = relationship("AgentVerdict", back_populates="signal")
    debates = relationship("Debate", back_populates="signal")
    packages = relationship("CounterStrikePackage", back_populates="signal")


class AgentVerdict(Base):
    __tablename__ = "agent_verdicts"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id"))
    agent_name = Column(String)
    verdict = Column(String)
    confidence = Column(Float)
    reasoning = Column(Text)
    evidence_json = Column(Text)
    recommended_action = Column(Text)
    urgency = Column(String)
    reputation_weight = Column(Float)
    created_at = Column(String)

    signal = relationship("Signal", back_populates="verdicts")


class Debate(Base):
    __tablename__ = "debates"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id"))
    final_verdict = Column(String)
    final_confidence = Column(Float)
    conflict_summary = Column(Text)
    strategic_reasoning = Column(Text)
    recommended_action = Column(Text)
    market_entropy_score = Column(Float)
    created_at = Column(String)

    signal = relationship("Signal", back_populates="debates")
    packages = relationship("CounterStrikePackage", back_populates="debate")


class CounterStrikePackage(Base):
    __tablename__ = "counter_strike_packages"

    id = Column(String, primary_key=True)
    signal_id = Column(String, ForeignKey("signals.id"))
    debate_id = Column(String, ForeignKey("debates.id"))
    title = Column(String)
    status = Column(String)
    retention_email_json = Column(Text)
    battlecard_json = Column(Text)
    social_response_json = Column(Text)
    internal_alert_json = Column(Text)
    pdf_url = Column(String)
    deployed = Column(Integer, default=0)
    created_at = Column(String)

    signal = relationship("Signal", back_populates="packages")
    debate = relationship("Debate", back_populates="packages")


class AgentReputation(Base):
    __tablename__ = "agent_reputation"

    agent_name = Column(String, primary_key=True)
    reputation_score = Column(Float, default=1.0)
    total_debates = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    updated_at = Column(String)
