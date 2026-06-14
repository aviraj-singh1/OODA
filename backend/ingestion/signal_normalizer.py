"""
OODA Signal Normalizer — Phase 7
Converts raw API responses into normalized signal dictionaries
compatible with the SignalCreate schema.
"""

from datetime import datetime, timezone
from typing import Optional


def normalize_signal(
    source: str,
    signal_type: str,
    competitor_id: Optional[str],
    competitor_name: Optional[str],
    summary: str,
    raw_content: Optional[str] = None,
    severity: str = "MEDIUM",
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    percentage_change: Optional[float] = None,
    metadata: Optional[dict] = None,
) -> dict:
    """
    Create a normalized signal dictionary ready for database insertion.

    Parameters
    ----------
    source : str
        Origin of the signal (e.g., "newsapi", "serpapi", "github", "web_watcher").
    signal_type : str
        Classification (e.g., "news_mention", "price_change", "repo_activity").
    competitor_id : str or None
        ID of the associated competitor.
    competitor_name : str or None
        Display name of the competitor.
    summary : str
        Human-readable summary of the signal.
    raw_content : str or None
        Raw data from the source.
    severity : str
        "LOW", "MEDIUM", or "HIGH".
    old_value, new_value : str or None
        For change-type signals.
    percentage_change : float or None
        For numeric change signals.
    metadata : dict or None
        Additional source-specific metadata (title, URL, etc.).

    Returns
    -------
    dict
        Normalized signal dict compatible with crud.create_signal.
    """
    return {
        "source": source,
        "signal_type": signal_type,
        "competitor_id": competitor_id,
        "competitor_name": competitor_name or "",
        "summary": summary[:500],
        "raw_content": _build_raw_content(raw_content, metadata),
        "severity": severity if severity in ("LOW", "MEDIUM", "HIGH") else "MEDIUM",
        "old_value": old_value,
        "new_value": new_value,
        "percentage_change": percentage_change,
        "metadata": metadata or {},
    }


def _build_raw_content(raw_content: Optional[str], metadata: Optional[dict]) -> str:
    """Combine raw content and metadata into a single raw_content string."""
    parts = []
    if raw_content:
        parts.append(raw_content[:1000])
    if metadata:
        meta_str = " | ".join(f"{k}: {v}" for k, v in metadata.items() if v)
        if meta_str:
            parts.append(f"[Metadata] {meta_str}")
    return "\n".join(parts) if parts else ""


def deduplicate_signals(signals: list[dict], existing_summaries: set[str]) -> list[dict]:
    """
    Remove duplicate signals by checking summary + source against existing set.

    Parameters
    ----------
    signals : list[dict]
        List of normalized signal dicts.
    existing_summaries : set[str]
        Set of "source:summary_hash" strings already in DB.

    Returns
    -------
    list[dict]
        Deduplicated signal list.
    """
    unique = []
    seen = set(existing_summaries)
    for sig in signals:
        key = f"{sig['source']}:{sig['summary'][:100]}"
        if key not in seen:
            seen.add(key)
            unique.append(sig)
    return unique
