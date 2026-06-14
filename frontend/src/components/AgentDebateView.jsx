/**
 * AgentDebateView — Phase 3: Agent verdict cards.
 * Renders individual agent analysis results with verdict, confidence,
 * urgency, reasoning, evidence, and recommended actions.
 */

import { useState } from 'react';

// Agent metadata — maps to OODA design system colors
const AGENT_CONFIG = {
  'Marketing AI': {
    codename: 'Watcher',
    icon: '👁️',
    color: 'var(--color-agent-marketing)',
    bgGlow: 'rgba(168, 85, 247, 0.08)',
    borderGlow: 'rgba(168, 85, 247, 0.25)',
  },
  'Product AI': {
    codename: 'Archaeologist',
    icon: '🔬',
    color: 'var(--color-agent-product)',
    bgGlow: 'rgba(59, 130, 246, 0.08)',
    borderGlow: 'rgba(59, 130, 246, 0.25)',
  },
  'Sales AI': {
    codename: 'Hunter',
    icon: '🎯',
    color: 'var(--color-agent-sales)',
    bgGlow: 'rgba(245, 158, 11, 0.08)',
    borderGlow: 'rgba(245, 158, 11, 0.25)',
  },
};

// Verdict styling
const VERDICT_STYLES = {
  THREAT: {
    bg: 'rgba(255, 59, 59, 0.12)',
    color: 'var(--color-threat)',
    border: 'rgba(255, 59, 59, 0.3)',
    label: 'THREAT',
  },
  OPPORTUNITY: {
    bg: 'rgba(0, 230, 118, 0.12)',
    color: 'var(--color-stable)',
    border: 'rgba(0, 230, 118, 0.3)',
    label: 'OPPORTUNITY',
  },
  NEUTRAL: {
    bg: 'rgba(132, 146, 166, 0.12)',
    color: 'var(--color-neutral)',
    border: 'rgba(132, 146, 166, 0.3)',
    label: 'NEUTRAL',
  },
};

// Urgency styling
const URGENCY_STYLES = {
  CRITICAL: { color: 'var(--color-threat)', dot: '#ff3b3b' },
  HIGH: { color: 'var(--color-warning)', dot: '#ff9500' },
  MEDIUM: { color: '#f59e0b', dot: '#f59e0b' },
  LOW: { color: 'var(--color-stable)', dot: '#00e676' },
};

function parseEvidence(evidenceJson) {
  if (!evidenceJson) return { points: [], generatedBy: null };
  if (Array.isArray(evidenceJson)) return { points: evidenceJson, generatedBy: null };
  try {
    const parsed = JSON.parse(evidenceJson);
    // New Phase 7 format: { points: [...], generated_by: "..." }
    if (parsed && parsed.points && Array.isArray(parsed.points)) {
      return { points: parsed.points, generatedBy: parsed.generated_by || null };
    }
    // Old format: plain array
    if (Array.isArray(parsed)) return { points: parsed, generatedBy: null };
    return { points: [], generatedBy: null };
  } catch {
    return { points: [], generatedBy: null };
  }
}

function GeneratedByLabel({ generatedBy }) {
  if (!generatedBy) return null;
  const labels = {
    ollama: { text: 'Ollama', className: 'generated-by generated-by-ollama' },
    openrouter: { text: 'OpenRouter', className: 'generated-by generated-by-openrouter' },
    demo_fallback: { text: 'Demo Fallback', className: 'generated-by generated-by-fallback' },
  };
  const cfg = labels[generatedBy] || labels.demo_fallback;
  return <span className={cfg.className}>⚡ {cfg.text}</span>;
}

function ConfidenceBar({ confidence, color }) {
  const pct = Math.round((confidence || 0) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 entropy-bar-track" style={{ height: '6px' }}>
        <div
          className="entropy-bar-fill"
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '4px',
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />
      </div>
      <span
        className="text-sm font-mono font-bold"
        style={{ color, minWidth: '36px', textAlign: 'right' }}
      >
        {pct}%
      </span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.NEUTRAL;
  return (
    <span
      className="badge"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
      }}
    >
      {verdict === 'THREAT' && '⚠ '}
      {verdict === 'OPPORTUNITY' && '✦ '}
      {style.label}
    </span>
  );
}

function UrgencyIndicator({ urgency }) {
  const style = URGENCY_STYLES[urgency] || URGENCY_STYLES.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: style.dot, boxShadow: `0 0 6px ${style.dot}40` }}
      />
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: style.color }}>
        {urgency}
      </span>
    </div>
  );
}

export default function AgentDebateView({ verdicts = [], loading = false }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-sm text-[var(--color-ooda-text-muted)]">
          Running agent analysis...
        </p>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          Marketing AI · Product AI · Sales AI
        </p>
      </div>
    );
  }

  if (!verdicts.length) {
    return (
      <div className="card text-center py-10">
        <div className="text-3xl mb-3">🤖</div>
        <h3 className="text-lg font-semibold text-[var(--color-ooda-text)]">
          Agent Analysis
        </h3>
        <p className="text-sm text-[var(--color-ooda-text-dim)] mt-2">
          Click "Run Agent Analysis" to analyze the latest signal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {verdicts.map((v, idx) => {
        const config = AGENT_CONFIG[v.agent_name] || {
          codename: v.agent_codename || 'Unknown',
          icon: '🤖',
          color: 'var(--color-ooda-accent)',
          bgGlow: 'rgba(0, 212, 255, 0.08)',
          borderGlow: 'rgba(0, 212, 255, 0.25)',
        };
        const { points: evidence, generatedBy } = parseEvidence(v.evidence_json);
        const isExpanded = expandedIdx === idx;

        return (
          <div
            key={v.id || idx}
            className="animate-fade-in"
            style={{ animationDelay: `${idx * 0.12}s` }}
          >
            <div
              className="card"
              style={{
                borderColor: config.borderGlow,
                background: `linear-gradient(135deg, var(--color-ooda-surface), ${config.bgGlow})`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: config.color }}
                      >
                        {config.codename}
                      </span>
                      <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-medium">
                        {v.agent_name}
                      </span>
                      <GeneratedByLabel generatedBy={generatedBy} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyIndicator urgency={v.urgency} />
                  <VerdictBadge verdict={v.verdict} />
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                    Confidence
                  </span>
                  {v.reputation_weight != null && (
                    <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
                      Rep: {v.reputation_weight?.toFixed(2)}
                    </span>
                  )}
                </div>
                <ConfidenceBar confidence={v.confidence} color={config.color} />
              </div>

              {/* Reasoning — always visible */}
              <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed mb-2">
                {v.reasoning}
              </p>

              {/* Expand indicator */}
              <div className="text-center">
                <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
                  {isExpanded ? '▲ Less' : '▼ Details'}
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: `1px solid ${config.borderGlow}` }}
                >
                  {/* Evidence */}
                  {evidence.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-2">
                        Evidence
                      </h4>
                      <ul className="flex flex-col gap-1.5">
                        {evidence.map((e, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: config.color }}
                            />
                            <span className="text-xs text-[var(--color-ooda-text-muted)]">
                              {e}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {v.recommended_action && (
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: 'var(--color-ooda-surface-elevated)',
                        border: '1px solid var(--color-ooda-border)',
                      }}
                    >
                      <h4 className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1">
                        ⚡ Recommended Action
                      </h4>
                      <p className="text-xs text-[var(--color-ooda-text)] font-medium">
                        {v.recommended_action}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
