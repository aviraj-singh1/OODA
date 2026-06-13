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
from backend.counter_strike.email_generator import generate_retention_email
from backend.counter_strike.battlecard_generator import generate_sales_battlecard
from backend.counter_strike.social_generator import generate_social_response
from backend.counter_strike.internal_alert_generator import generate_internal_alert
from backend.counter_strike.export_generator import generate_comparison_report


class PackageBuilder:
    """
    Builds a complete Counter-Strike package from a signal.

    Usage::

        builder = PackageBuilder()
        result = builder.build(signal_id, db)
    """

    def build(
        self,
        signal_id: str,
        db: Session,
        force: bool = False,
    ) -> dict:
        """
        Build a complete Counter-Strike package for a signal.

        Pipeline:
            1. Validate signal exists (404 if missing)
            2. Validate debate exists (400 if missing)
            3. Check for existing package (return if force=false)
            4. Generate all 5 assets
            5. Save package to database
            6. Return full package response

        Raises
        ------
        ValueError  If signal_id does not exist.
        RuntimeError  If no debate exists for the signal.
        """
        # ── 1. Validate signal ────────────────────────────────────────
        signal_row = crud.get_signal(db, signal_id)
        if not signal_row:
            raise ValueError(f"Signal '{signal_id}' not found")

        # ── 2. Validate debate exists ─────────────────────────────────
        debate_row = crud.get_debate_by_signal(db, signal_id)
        if not debate_row:
            raise RuntimeError(
                "Run debate before building Counter-Strike package."
            )

        # ── 3. Check for existing package ─────────────────────────────
        existing = crud.get_package_by_signal(db, signal_id)
        if existing and not force:
            return self._build_response_from_db(existing, signal_row, debate_row, db)

        # If force, delete existing packages for this signal
        if existing and force:
            self._delete_packages_for_signal(db, signal_id)

        # ── 4. Build dicts for generators ─────────────────────────────
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
            "final_verdict": debate_row.final_verdict or "NEUTRAL",
            "final_confidence": debate_row.final_confidence or 0,
            "recommended_action": debate_row.recommended_action or "",
            "market_entropy_score": debate_row.market_entropy_score or 0,
            "conflict_summary": debate_row.conflict_summary or "",
        }

        # ── 5. Generate all 5 assets ──────────────────────────────────
        retention_email = generate_retention_email(
            signal_dict, debate_dict, competitor_name
        )
        battlecard = generate_sales_battlecard(
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
            debate_id=debate_row.id,
            title=title,
            retention_email_json=json.dumps(retention_email),
            battlecard_json=json.dumps(battlecard),
            social_response_json=json.dumps(social_response),
            internal_alert_json=json.dumps(internal_alert),
            comparison_report_json=json.dumps(comparison_report),
            pdf_url=None,
        )

        # ── 7. Build response ─────────────────────────────────────────
        return self._make_response(
            package_row, signal_row, debate_row, competitor_name,
            retention_email, battlecard, social_response,
            internal_alert, comparison_report,
        )

    # ── Response builders ─────────────────────────────────────────────────

    def _make_response(
        self, pkg, signal_row, debate_row, competitor_name,
        retention_email, battlecard, social_response,
        internal_alert, comparison_report,
    ) -> dict:
        """Build the full API response dict."""
        return {
            "package": {
                "id": pkg.id,
                "signal_id": pkg.signal_id,
                "debate_id": pkg.debate_id,
                "title": pkg.title,
                "status": pkg.status,
                "deployed": pkg.deployed,
                "deployed_at": pkg.deployed_at,
                "created_at": pkg.created_at,
            },
            "signal": {
                "id": signal_row.id,
                "competitor_name": competitor_name,
                "signal_type": signal_row.signal_type,
                "summary": signal_row.summary,
                "severity": signal_row.severity,
            },
            "debate_verdict": {
                "final_verdict": debate_row.final_verdict or "NEUTRAL",
                "final_confidence": debate_row.final_confidence or 0,
                "market_entropy_score": debate_row.market_entropy_score or 0,
                "recommended_action": debate_row.recommended_action or "",
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

    def _build_response_from_db(
        self, package, signal_row, debate_row, db: Session,
    ) -> dict:
        """Reconstruct full response from a saved package."""
        competitor_name = (
            signal_row.competitor.name if signal_row.competitor else "Competitor"
        )

        def _safe_parse(json_str):
            if not json_str:
                return {}
            try:
                return json.loads(json_str)
            except (json.JSONDecodeError, TypeError):
                return {}

        return self._make_response(
            package, signal_row, debate_row, competitor_name,
            _safe_parse(package.retention_email_json),
            _safe_parse(package.battlecard_json),
            _safe_parse(package.social_response_json),
            _safe_parse(package.internal_alert_json),
            _safe_parse(package.comparison_report_json),
        )

    # ── Helpers ───────────────────────────────────────────────────────────

    def _delete_packages_for_signal(self, db: Session, signal_id: str) -> None:
        """Delete all packages for a signal (for force rebuild)."""
        from backend.database.models import CounterStrikePackage
        db.query(CounterStrikePackage).filter(
            CounterStrikePackage.signal_id == signal_id
        ).delete()
        db.commit()
