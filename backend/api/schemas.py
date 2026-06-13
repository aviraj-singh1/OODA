"""
OODA Pydantic Schemas
Request and response models for all API endpoints.

Phase 1: Added *Create schemas, renamed *Out → *Response for consistency,
added APIMessageResponse and SeedResponse.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Generic ───────────────────────────────────────────────────────────────────

class APIMessageResponse(BaseModel):
    """Standard envelope for simple success/failure messages."""
    status: str
    message: str


class SeedResponse(APIMessageResponse):
    """Response returned by POST /api/demo/seed."""
    competitors_seeded: int
    signals_seeded: int
    reputations_seeded: int


# ── Competitor ────────────────────────────────────────────────────────────────

class CompetitorCreate(BaseModel):
    name: str
    website_url: Optional[str] = None
    pricing_url: Optional[str] = None
    category: Optional[str] = None


class CompetitorResponse(BaseModel):
    id: str
    name: str
    website_url: Optional[str] = None
    pricing_url: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Signal ────────────────────────────────────────────────────────────────────

class SignalCreate(BaseModel):
    competitor_id: Optional[str] = None
    source: str
    signal_type: str
    summary: str
    raw_content: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    percentage_change: Optional[float] = None
    severity: str = Field(default="MEDIUM", pattern="^(HIGH|MEDIUM|LOW)$")


class SignalResponse(BaseModel):
    id: str
    competitor_id: Optional[str] = None
    competitor_name: Optional[str] = None   # populated by route layer
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

    model_config = {"from_attributes": True}


# ── Agent Verdict ─────────────────────────────────────────────────────────────

class AgentVerdictResponse(BaseModel):
    id: str
    signal_id: str
    agent_name: str
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

class DebateResponse(BaseModel):
    id: str
    signal_id: str
    final_verdict: Optional[str] = None
    final_confidence: Optional[float] = None
    conflict_summary: Optional[str] = None
    strategic_reasoning: Optional[str] = None
    recommended_action: Optional[str] = None
    market_entropy_score: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Counter-Strike Package ───────────────────────────────────────────────────

class CounterStrikePackageResponse(BaseModel):
    id: str
    signal_id: str
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

class AgentReputationResponse(BaseModel):
    agent_name: str
    reputation_score: float = 1.0
    total_debates: int = 0
    correct_predictions: int = 0
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Entropy ───────────────────────────────────────────────────────────────────

class EntropyScoreResponse(BaseModel):
    score: float
    status: str
    reason: str
    components: dict


# ── Legacy aliases (keep for any internal code still referencing *Out names) ──
# These will be removed in Phase 2 once all routes are updated.

CompetitorOut = CompetitorResponse
SignalOut = SignalResponse
AgentVerdictOut = AgentVerdictResponse
DebateOut = DebateResponse
CounterStrikePackageOut = CounterStrikePackageResponse
AgentReputationOut = AgentReputationResponse
StatusResponse = APIMessageResponse
EntropyScoreOut = EntropyScoreResponse
