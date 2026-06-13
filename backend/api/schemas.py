"""
OODA Pydantic Schemas
Request and response models for all API endpoints.
"""

from pydantic import BaseModel
from typing import Optional


# ── Competitor ────────────────────────────────────────────────────────────────

class CompetitorOut(BaseModel):
    id: str
    name: str
    website_url: Optional[str] = None
    pricing_url: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Signal ────────────────────────────────────────────────────────────────────

class SignalOut(BaseModel):
    id: str
    competitor_id: Optional[str] = None
    source: str
    signal_type: str
    summary: str
    raw_content: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    percentage_change: Optional[float] = None
    severity: Optional[str] = None
    timestamp: Optional[str] = None
    processed: int = 0
    competitor_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SignalCreate(BaseModel):
    competitor_id: str
    source: str
    signal_type: str
    summary: str
    raw_content: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    percentage_change: Optional[float] = None
    severity: str = "MEDIUM"


# ── Agent Verdict ─────────────────────────────────────────────────────────────

class AgentVerdictOut(BaseModel):
    id: str
    signal_id: Optional[str] = None
    agent_name: Optional[str] = None
    verdict: Optional[str] = None
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    evidence_json: Optional[str] = None
    recommended_action: Optional[str] = None
    urgency: Optional[str] = None
    reputation_weight: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Debate ────────────────────────────────────────────────────────────────────

class DebateOut(BaseModel):
    id: str
    signal_id: Optional[str] = None
    final_verdict: Optional[str] = None
    final_confidence: Optional[float] = None
    conflict_summary: Optional[str] = None
    strategic_reasoning: Optional[str] = None
    recommended_action: Optional[str] = None
    market_entropy_score: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Counter-Strike Package ───────────────────────────────────────────────────

class CounterStrikePackageOut(BaseModel):
    id: str
    signal_id: Optional[str] = None
    debate_id: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    retention_email_json: Optional[str] = None
    battlecard_json: Optional[str] = None
    social_response_json: Optional[str] = None
    internal_alert_json: Optional[str] = None
    pdf_url: Optional[str] = None
    deployed: int = 0
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Agent Reputation ──────────────────────────────────────────────────────────

class AgentReputationOut(BaseModel):
    agent_name: str
    reputation_score: float = 1.0
    total_debates: int = 0
    correct_predictions: int = 0
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Entropy ───────────────────────────────────────────────────────────────────

class EntropyScoreOut(BaseModel):
    score: float
    status: str
    reason: str
    components: dict


# ── Generic ───────────────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    status: str
    message: str
    data: Optional[dict] = None
