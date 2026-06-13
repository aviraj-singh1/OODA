"""
OODA Export Generator — Phase 5
Generates internal team alert and competitor comparison report
for the Counter-Strike package.
Deterministic demo output — no LLM dependency.

Note: OfficeKit is NOT a code-level exporter. This module generates
the structured data. OfficeKit is used to mirror phone, transfer
files, and show the phone-laptop workflow.
"""

from __future__ import annotations
from datetime import datetime, timezone


def generate_internal_alert(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate an internal team alert (Slack/email notification).

    Returns a structured alert dict for team communication.
    """
    signal_type = signal.get("signal_type", "")
    severity = signal.get("severity", "MEDIUM")
    summary = signal.get("summary", "Competitor activity detected")
    final_verdict = debate.get("final_verdict", "NEUTRAL")
    final_confidence = debate.get("final_confidence", 0)
    recommended_action = debate.get("recommended_action", "Monitor the situation")
    entropy = debate.get("market_entropy_score", 0)

    confidence_pct = round((final_confidence or 0) * 100)

    # Build action items by team
    if signal_type == "price_change" and final_verdict == "THREAT":
        action_items = [
            {"team": "Sales", "action": "Review pipeline for at-risk deals. Update pricing objection talking points."},
            {"team": "Marketing", "action": "Prepare retention messaging. Draft value-over-price positioning."},
            {"team": "Product", "action": "No immediate changes needed. Continue roadmap execution."},
            {"team": "Customer Success", "action": "Prepare talking points for inbound pricing questions."},
            {"team": "Leadership", "action": "Review competitive response plan. Approve battlecard distribution."},
        ]
    elif signal_type == "feature_launch":
        action_items = [
            {"team": "Product", "action": "Evaluate feature overlap. Update competitive feature matrix."},
            {"team": "Marketing", "action": "Prepare positioning response if asked about the feature."},
            {"team": "Sales", "action": "Monitor for prospect questions about this feature."},
        ]
    else:
        action_items = [
            {"team": "All Teams", "action": "Acknowledge and monitor for follow-up signals."},
        ]

    return {
        "alert_type": "COMPETITIVE_INTELLIGENCE",
        "severity": severity,
        "headline": f"🚨 {severity} SEVERITY — {competitor_name} Activity Detected",
        "summary": summary,
        "verdict": final_verdict,
        "confidence": f"{confidence_pct}%",
        "entropy_score": entropy,
        "recommended_action": recommended_action,
        "action_items": action_items,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channel": "#competitive-intel",
        "urgency_note": (
            "This alert requires immediate attention."
            if severity == "HIGH"
            else "This alert is informational. Monitor for changes."
        ),
    }


def generate_comparison_report(
    signal: dict,
    debate: dict,
    competitor_name: str = "Competitor",
) -> dict:
    """
    Generate a competitor comparison one-pager report.

    Returns structured data for a comparison report.
    """
    signal_type = signal.get("signal_type", "")
    new_value = signal.get("new_value", "")
    old_value = signal.get("old_value", "")

    # Base comparison data
    comparison = {
        "title": f"Competitive Analysis: Us vs {competitor_name}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "signal_context": signal.get("summary", ""),
        "verdict": debate.get("final_verdict", "NEUTRAL"),
        "sections": [],
    }

    # Pricing section
    if signal_type == "price_change":
        comparison["sections"].append({
            "name": "Pricing Comparison",
            "data": [
                {"metric": "Pro Plan Price", "us": old_value or "₹999/month", "them": new_value or "Unknown", "advantage": "them"},
                {"metric": "Price-to-Value Ratio", "us": "4.2x ROI", "them": "Not published", "advantage": "us"},
                {"metric": "Hidden Costs", "us": "All-inclusive", "them": "Support add-on, API limits", "advantage": "us"},
                {"metric": "Annual Discount", "us": "20% off annual", "them": "10% off annual", "advantage": "us"},
            ],
        })

    # Feature section (always included)
    comparison["sections"].append({
        "name": "Feature Comparison",
        "data": [
            {"metric": "Native Integrations", "us": "50+", "them": "~18", "advantage": "us"},
            {"metric": "AI Capabilities", "us": "Full AI suite", "them": "Basic AI tools", "advantage": "us"},
            {"metric": "Custom Reporting", "us": "Unlimited custom reports", "them": "5 report templates", "advantage": "us"},
            {"metric": "Workflow Automation", "us": "Visual builder + API", "them": "Template-based only", "advantage": "us"},
            {"metric": "A/B Testing", "us": "Multi-variant testing", "them": "Basic A/B only", "advantage": "us"},
        ],
    })

    # Reliability section
    comparison["sections"].append({
        "name": "Reliability & Support",
        "data": [
            {"metric": "Uptime SLA", "us": "99.9% guaranteed", "them": "No published SLA", "advantage": "us"},
            {"metric": "Support Model", "us": "Dedicated account manager", "them": "Ticket-based", "advantage": "us"},
            {"metric": "Avg Response Time", "us": "< 2 hours", "them": "24-48 hours", "advantage": "us"},
            {"metric": "Security", "us": "SOC 2 Type II, GDPR", "them": "SOC 2 Type I", "advantage": "us"},
            {"metric": "Data Residency", "us": "Multi-region choice", "them": "US only", "advantage": "us"},
        ],
    })

    # Summary
    our_advantages = sum(
        1 for section in comparison["sections"]
        for row in section["data"]
        if row.get("advantage") == "us"
    )
    their_advantages = sum(
        1 for section in comparison["sections"]
        for row in section["data"]
        if row.get("advantage") == "them"
    )

    comparison["summary"] = {
        "our_advantages": our_advantages,
        "their_advantages": their_advantages,
        "conclusion": (
            f"Across {our_advantages + their_advantages} comparison points, "
            f"we lead in {our_advantages} areas. "
            f"{'Their recent price cut is their primary competitive lever, '
            'but our value proposition remains significantly stronger across '
            'features, reliability, and support.'}"
            if signal_type == "price_change"
            else f"We maintain clear advantages in {our_advantages} out of "
                 f"{our_advantages + their_advantages} comparison areas."
        ),
    }

    return comparison
