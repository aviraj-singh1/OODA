"""
OODA Counter-Strike Package Builder — Phase 5
Orchestrates generation of all counter-strike assets and saves
the complete package to the database.

Assets generated:
    1. Retention email
    2. Sales battlecard
    3. Social response
    4. Internal team alert
    5. Competitor comparison report
"""

from __future__ import annotations

import json
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import crud
from backend.debate.debate_engine import DebateEngine
from backend.intelligence.entropy_calculator import calculate_entropy
from backend.counter_strike.email_generator import generate_retention_email
from backend.counter_strike.battlecard_generator import generate_battlecard
from backend.counter_strike.social_generator import generate_social_response
from backend.counter_strike.export_generator import (
    generate_internal_alert,
    generate_comparison_report,
)


class PackageBuilder:
    """
    Builds a complete Counter-Strike package from a signal.

    Usage::

        builder = PackageBuilder()
        result = builder.build(signal_id, db)
    """

    def __init__(self):
        self._debate_engine = DebateEngine()

    def build(
        self,
        signal_id: str,
        db: Session,
        force: bool = False,
    ) -> dict:
        """
        Build a complete Counter-Strike package for a signal.

        Pipeline:
            1. Ensure debate exists (runs debate if needed)
            2. Generate all 5 assets
            3. Save package to database
            4. Return complete package dict

        Parameters
        ----------
        signal_id : str     Target signal ID.
        db : Session        Active database session.
        force : bool        If True, regenerate even if package exists.

        Returns
        -------
        dict  Complete package with all assets and metadata.

        Raises
        ------
        ValueError  If signal_id does not exist.
        """
        # ── 1. Validate signal ────────────────────────────────────────
        signal_row = crud.get_signal(db, signal_id)
        if not signal_row:
            raise ValueError(f"Signal '{signal_id}' not found")

        # ── 2. Check for existing package ─────────────────────────────
        existing = self._get_existing_package(db, signal_id)
        if existing and not force:
            return self._build_response_from_db(existing, signal_row, db)

        # ── 3. Ensure debate exists ───────────────────────────────────
        debate_result = self._ensure_debate(signal_id, db)
        debate_data = debate_result.get("debate", {})
        debate_id = debate_data.get("id")

        # ── 4. Build signal dict ──────────────────────────────────────
        competitor_name = (
            signal_row.competitor.name if signal_row.competitor else "Competitor"
        )

        signal_dict = {
            "id": signal_row.id,
            "competitor_id": signal_row.competitor_id,
            "source": signal_row.source,
            "signal_type": signal_row.signal_type,
            "summary": signal_row.summary,
            "raw_content": signal_row.raw_content,
            "old_value": signal_row.old_value,
            "new_value": signal_row.new_value,
            "percentage_change": signal_row.percentage_change,
            "severity": signal_row.severity,
            "timestamp": signal_row.timestamp,
        }

        debate_dict = {
            "final_verdict": debate_data.get("final_verdict", "NEUTRAL"),
            "final_confidence": debate_data.get("final_confidence", 0),
            "recommended_action": debate_data.get("recommended_action", ""),
            "market_entropy_score": debate_result.get("market_entropy_score", 0),
            "conflict_summary": debate_data.get("conflict_summary", ""),
        }

        # ── 5. Generate all assets ────────────────────────────────────
        retention_email = generate_retention_email(
            signal_dict, debate_dict, competitor_name
        )
        battlecard = generate_battlecard(
            signal_dict, debate_dict, competitor_name
        )
        social_response = generate_social_response(
            signal_dict, debate_dict, competitor_name
        )
        internal_alert = generate_internal_alert(
            signal_dict, debate_dict, competitor_name
        )
        comparison_report = generate_comparison_report(
            signal_dict, debate_dict, competitor_name
        )

        # ── 6. Save package to database ───────────────────────────────
        title = f"Counter-Strike: {competitor_name} {signal_row.signal_type.replace('_', ' ').title()}"

        package_row = crud.create_package(
            db=db,
            id=crud._generate_id("pkg"),
            signal_id=signal_id,
            debate_id=debate_id,
            title=title,
            retention_email_json=json.dumps(retention_email),
            battlecard_json=json.dumps(battlecard),
            social_response_json=json.dumps(social_response),
            internal_alert_json=json.dumps(internal_alert),
            pdf_url=None,  # PDF generation is Phase 6+
        )

        # ── 7. Build response ─────────────────────────────────────────
        return {
            "package": {
                "id": package_row.id,
                "signal_id": signal_id,
                "debate_id": debate_id,
                "title": title,
                "status": package_row.status,
                "deployed": package_row.deployed,
                "created_at": package_row.created_at,
            },
            "signal": {
                "id": signal_row.id,
                "competitor_name": competitor_name,
                "signal_type": signal_row.signal_type,
                "summary": signal_row.summary,
                "severity": signal_row.severity,
            },
            "debate_verdict": {
                "final_verdict": debate_dict["final_verdict"],
                "final_confidence": debate_dict["final_confidence"],
                "recommended_action": debate_dict["recommended_action"],
            },
            "assets": {
                "retention_email": retention_email,
                "battlecard": battlecard,
                "social_response": social_response,
                "internal_alert": internal_alert,
                "comparison_report": comparison_report,
            },
            "deploy_mode": "SIMULATED",
            "asset_count": 5,
        }

    # ── Helpers ───────────────────────────────────────────────────────────

    def _ensure_debate(self, signal_id: str, db: Session) -> dict:
        """Ensure a debate exists for this signal, running one if needed."""
        return self._debate_engine.run_debate(signal_id, db, force=False)

    def _get_existing_package(
        self, db: Session, signal_id: str
    ) -> Optional[object]:
        """Find an existing package for this signal."""
        from backend.database.models import CounterStrikePackage

        return (
            db.query(CounterStrikePackage)
            .filter(CounterStrikePackage.signal_id == signal_id)
            .order_by(CounterStrikePackage.created_at.desc())
            .first()
        )

    def _build_response_from_db(
        self, package, signal_row, db: Session
    ) -> dict:
        """Reconstruct full response from a saved package."""
        competitor_name = (
            signal_row.competitor.name if signal_row.competitor else "Competitor"
        )

        # Parse stored JSON assets
        def _safe_parse(json_str):
            if not json_str:
                return {}
            try:
                return json.loads(json_str)
            except (json.JSONDecodeError, TypeError):
                return {}

        # Get debate verdict
        debate_verdict = {"final_verdict": "NEUTRAL", "final_confidence": 0, "recommended_action": ""}
        if package.debate_id:
            debate = crud.get_debate(db, package.debate_id)
            if debate:
                debate_verdict = {
                    "final_verdict": debate.final_verdict or "NEUTRAL",
                    "final_confidence": debate.final_confidence or 0,
                    "recommended_action": debate.recommended_action or "",
                }

        return {
            "package": {
                "id": package.id,
                "signal_id": package.signal_id,
                "debate_id": package.debate_id,
                "title": package.title,
                "status": package.status,
                "deployed": package.deployed,
                "created_at": package.created_at,
            },
            "signal": {
                "id": signal_row.id,
                "competitor_name": competitor_name,
                "signal_type": signal_row.signal_type,
                "summary": signal_row.summary,
                "severity": signal_row.severity,
            },
            "debate_verdict": debate_verdict,
            "assets": {
                "retention_email": _safe_parse(package.retention_email_json),
                "battlecard": _safe_parse(package.battlecard_json),
                "social_response": _safe_parse(package.social_response_json),
                "internal_alert": _safe_parse(package.internal_alert_json),
                "comparison_report": {},  # Not stored in DB, regenerate if needed
            },
            "deploy_mode": "SIMULATED",
            "asset_count": 5,
        }
