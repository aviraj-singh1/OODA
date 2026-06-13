"""
OODA Debate Engine — Phase 4
Orchestrates the full debate flow:
1. Fetch/run agent verdicts
2. Calculate weighted score
3. Detect conflict
4. Resolve strategy via Strategy AI
5. Save debate to database
6. Return complete debate result

No LLM dependency — deterministic demo.
"""

from __future__ import annotations
import json
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import crud
from backend.agents.agent_runner import run_all_agents
from backend.intelligence.entropy_calculator import calculate_entropy
from backend.debate.strategy_resolver import resolve_strategy


class DebateEngine:
    """
    Orchestrates agent debate and Strategy AI resolution.

    Usage::

        engine = DebateEngine()
        result = engine.run_debate(signal_id, db)
    """

    def run_debate(
        self,
        signal_id: str,
        db: Session,
        force: bool = False,
    ) -> dict:
        """
        Run the full debate pipeline for a signal.

        Parameters
        ----------
        signal_id : str       Target signal ID.
        db : Session          Active database session.
        force : bool          If True, delete existing debate and regenerate.

        Returns
        -------
        dict  Complete debate result with signal, verdicts, and strategy.

        Raises
        ------
        ValueError  If signal_id does not exist.
        """
        # ── 1. Fetch signal ──────────────────────────────────────────
        signal = crud.get_signal(db, signal_id)
        if not signal:
            raise ValueError(f"Signal '{signal_id}' not found")

        # ── 2. Check for existing debate ─────────────────────────────
        existing_debate = crud.get_debate_by_signal(db, signal_id)
        if existing_debate and not force:
            return self._build_response_from_db(signal, existing_debate, db)

        # If force, delete existing debate(s)
        if existing_debate and force:
            self._delete_debates_for_signal(db, signal_id)

        # ── 3. Fetch or run agent verdicts ───────────────────────────
        verdict_rows = crud.get_verdicts_by_signal(db, signal_id)
        if not verdict_rows:
            # Run agents automatically
            verdict_rows = self._run_agents(signal, db)

        verdict_dicts = self._rows_to_dicts(verdict_rows)

        # ── 4. Get entropy score ─────────────────────────────────────
        try:
            entropy_result = calculate_entropy(db)
            entropy_score = entropy_result.score
        except Exception:
            entropy_score = 0.0

        # ── 5. Build signal dict ─────────────────────────────────────
        signal_dict = {
            "id": signal.id,
            "competitor_id": signal.competitor_id,
            "source": signal.source,
            "signal_type": signal.signal_type,
            "summary": signal.summary,
            "raw_content": signal.raw_content,
            "old_value": signal.old_value,
            "new_value": signal.new_value,
            "percentage_change": signal.percentage_change,
            "severity": signal.severity,
            "timestamp": signal.timestamp,
        }

        # ── 6. Run Strategy AI resolution ────────────────────────────
        strategy = resolve_strategy(signal_dict, verdict_dicts, entropy_score)

        # ── 7. Save debate to database ───────────────────────────────
        debate_row = crud.create_debate(
            db=db,
            id=crud._generate_id("dbt"),
            signal_id=signal_id,
            final_verdict=strategy["final_verdict"],
            final_confidence=strategy["final_confidence"],
            conflict_summary=strategy["conflict_summary"],
            strategic_reasoning=strategy["strategic_reasoning"],
            recommended_action=strategy["recommended_action"],
            market_entropy_score=strategy["market_entropy_score"],
        )

        # ── 8. Build response ────────────────────────────────────────
        competitor_name = signal.competitor.name if signal.competitor else None

        return {
            "signal": {
                "id": signal.id,
                "competitor_name": competitor_name,
                "signal_type": signal.signal_type,
                "summary": signal.summary,
                "severity": signal.severity,
            },
            "market_entropy_score": strategy["market_entropy_score"],
            "agent_verdicts": [
                {
                    "agent_name": v.get("agent_name"),
                    "agent_codename": v.get("agent_codename"),
                    "verdict": v.get("verdict"),
                    "confidence": v.get("confidence"),
                    "urgency": v.get("urgency"),
                    "reasoning": v.get("reasoning"),
                    "evidence_json": v.get("evidence_json"),
                    "recommended_action": v.get("recommended_action"),
                    "reputation_weight": v.get("reputation_weight"),
                }
                for v in verdict_dicts
            ],
            "debate": {
                "id": debate_row.id,
                "conflict_detected": strategy["conflict_detected"],
                "weighted_score": strategy["weighted_score"],
                "final_verdict": strategy["final_verdict"],
                "final_confidence": strategy["final_confidence"],
                "urgency": strategy["urgency"],
                "threat_level": strategy["threat_level"],
                "conflict_summary": strategy["conflict_summary"],
                "strategic_reasoning": strategy["strategic_reasoning"],
                "recommended_action": strategy["recommended_action"],
                "next_best_actions": strategy["next_best_actions"],
            },
        }

    # ── Helpers ───────────────────────────────────────────────────────────

    def _run_agents(self, signal, db: Session) -> list:
        """Run all agents and save their verdicts. Returns saved DB rows."""
        try:
            entropy_result = calculate_entropy(db)
            entropy_score = entropy_result.score
        except Exception:
            entropy_score = 0.0

        signal_dict = {
            "id": signal.id,
            "competitor_id": signal.competitor_id,
            "source": signal.source,
            "signal_type": signal.signal_type,
            "summary": signal.summary,
            "raw_content": signal.raw_content,
            "old_value": signal.old_value,
            "new_value": signal.new_value,
            "percentage_change": signal.percentage_change,
            "severity": signal.severity,
            "timestamp": signal.timestamp,
        }

        agent_verdicts = run_all_agents(signal_dict, entropy_score)

        saved = []
        for v in agent_verdicts:
            db_verdict = crud.create_verdict(
                db=db,
                id=crud._generate_id("vrd"),
                signal_id=signal.id,
                agent_name=v["agent_name"],
                agent_codename=v["agent_codename"],
                verdict=v["verdict"],
                confidence=v["confidence"],
                reasoning=v["reasoning"],
                evidence_json=json.dumps(v["evidence"]),
                recommended_action=v["recommended_action"],
                urgency=v["urgency"],
                reputation_weight=v["reputation_weight"],
            )
            saved.append(db_verdict)

        crud.mark_signal_processed(db, signal.id)
        return saved

    def _rows_to_dicts(self, rows) -> list[dict]:
        """Convert DB AgentVerdict rows to plain dicts for the resolver."""
        result = []
        for r in rows:
            result.append({
                "agent_name": r.agent_name,
                "agent_codename": r.agent_codename,
                "verdict": r.verdict,
                "confidence": r.confidence,
                "reasoning": r.reasoning,
                "evidence_json": r.evidence_json,
                "recommended_action": r.recommended_action,
                "urgency": r.urgency,
                "reputation_weight": r.reputation_weight,
            })
        return result

    def _delete_debates_for_signal(self, db: Session, signal_id: str) -> None:
        """Delete all debates for a signal (for force re-run)."""
        from backend.database.models import Debate
        db.query(Debate).filter(Debate.signal_id == signal_id).delete()
        db.commit()

    def _build_response_from_db(self, signal, debate, db: Session) -> dict:
        """Reconstruct the full response from an existing saved debate."""
        verdict_rows = crud.get_verdicts_by_signal(db, signal.id)
        verdict_dicts = self._rows_to_dicts(verdict_rows)

        competitor_name = signal.competitor.name if signal.competitor else None

        # Recalculate strategy fields from stored data + verdicts
        from backend.debate.strategy_resolver import (
            calculate_weighted_score, detect_conflict,
            determine_threat_level, determine_urgency,
        )

        weighted_score = calculate_weighted_score(verdict_dicts)
        conflict = detect_conflict(verdict_dicts)
        threat_level = determine_threat_level(
            debate.final_verdict or "NEUTRAL",
            debate.final_confidence or 0.0,
            debate.market_entropy_score or 0.0,
        )
        urgency = determine_urgency(threat_level)

        # Reconstruct next_best_actions from signal type
        signal_type = signal.signal_type or ""
        if signal_type == "price_change" and debate.final_verdict == "THREAT":
            next_best_actions = [
                "Send retention email to renewal accounts",
                "Arm sales team with pricing objection handling",
                "Publish value-over-price positioning post",
            ]
        else:
            next_best_actions = [
                "Track competitor follow-up moves",
                "Prepare contingency response",
                "Brief leadership on competitive landscape",
            ]

        return {
            "signal": {
                "id": signal.id,
                "competitor_name": competitor_name,
                "signal_type": signal.signal_type,
                "summary": signal.summary,
                "severity": signal.severity,
            },
            "market_entropy_score": debate.market_entropy_score or 0.0,
            "agent_verdicts": [
                {
                    "agent_name": v.get("agent_name"),
                    "agent_codename": v.get("agent_codename"),
                    "verdict": v.get("verdict"),
                    "confidence": v.get("confidence"),
                    "urgency": v.get("urgency"),
                    "reasoning": v.get("reasoning"),
                    "evidence_json": v.get("evidence_json"),
                    "recommended_action": v.get("recommended_action"),
                    "reputation_weight": v.get("reputation_weight"),
                }
                for v in verdict_dicts
            ],
            "debate": {
                "id": debate.id,
                "conflict_detected": conflict,
                "weighted_score": weighted_score,
                "final_verdict": debate.final_verdict,
                "final_confidence": debate.final_confidence,
                "urgency": urgency,
                "threat_level": threat_level,
                "conflict_summary": debate.conflict_summary,
                "strategic_reasoning": debate.strategic_reasoning,
                "recommended_action": debate.recommended_action,
                "next_best_actions": next_best_actions,
            },
        }
