/**
 * Debate — Phase 4: Full Debate Engine page.
 *
 * Flow:
 *   1. Signal Summary (competitor, type, entropy)
 *   2. Agent Round (Marketing AI, Product AI, Sales AI cards)
 *   3. Conflict Detection card
 *   4. Strategy AI / General final verdict card
 *
 * Buttons: Run Debate, Re-run Debate (force=true)
 */

import { useState, useEffect, useCallback } from 'react';
import AgentDebateView from '../components/AgentDebateView';
import {
  runDebate,
  getDebateBySignal,
  getLatestSignal,
  getLatestDebate,
} from '../services/api';

// ── Verdict styling ────────────────────────────────────────────────────────────
const VERDICT_COLORS = {
  THREAT: {
    bg: 'rgba(255, 59, 59, 0.10)',
    border: 'rgba(255, 59, 59, 0.35)',
    color: 'var(--color-threat)',
    glow: '0 0 30px rgba(255, 59, 59, 0.15)',
    label: '⚠ THREAT',
  },
  OPPORTUNITY: {
    bg: 'rgba(0, 230, 118, 0.10)',
    border: 'rgba(0, 230, 118, 0.35)',
    color: 'var(--color-stable)',
    glow: '0 0 30px rgba(0, 230, 118, 0.15)',
    label: '✦ OPPORTUNITY',
  },
  NEUTRAL: {
    bg: 'rgba(132, 146, 166, 0.10)',
    border: 'rgba(132, 146, 166, 0.35)',
    color: 'var(--color-neutral)',
    glow: '0 0 30px rgba(132, 146, 166, 0.10)',
    label: '● NEUTRAL',
  },
};

const THREAT_LEVEL_COLORS = {
  CRITICAL: 'var(--color-threat)',
  HIGH: 'var(--color-warning)',
  MEDIUM: '#f59e0b',
  LOW: 'var(--color-stable)',
};

const URGENCY_DOTS = {
  CRITICAL: { color: 'var(--color-threat)', dot: '#ff3b3b' },
  HIGH: { color: 'var(--color-warning)', dot: '#ff9500' },
  MEDIUM: { color: '#f59e0b', dot: '#f59e0b' },
  LOW: { color: 'var(--color-stable)', dot: '#00e676' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SignalSummaryCard({ signal, entropyScore }) {
  if (!signal) return null;

  return (
    <div
      className="card animate-fade-in animate-delay-1"
      style={{
        borderLeft: '3px solid var(--color-ooda-accent)',
        background: 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0, 212, 255, 0.04))',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: 'var(--color-ooda-accent)' }}
        >
          Signal Under Analysis
        </span>
        {signal.severity && (
          <span
            className="badge badge-threat"
            style={{ fontSize: '0.6rem', padding: '2px 8px' }}
          >
            {signal.severity}
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-[var(--color-ooda-text)] mb-1">
        {signal.competitor_name || 'Unknown Competitor'}
      </h3>
      <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed mb-3">
        {signal.summary}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
            Type
          </span>
          <span className="text-xs font-mono text-[var(--color-ooda-text-muted)]">
            {signal.signal_type?.replace('_', ' ')}
          </span>
        </div>
        {entropyScore != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
              Entropy
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{
                color:
                  entropyScore >= 61
                    ? 'var(--color-threat)'
                    : entropyScore >= 31
                    ? 'var(--color-warning)'
                    : 'var(--color-stable)',
              }}
            >
              {Math.round(entropyScore)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConflictCard({ debate }) {
  if (!debate) return null;
  const isConflicted = debate.conflict_detected;

  return (
    <div
      className="card animate-fade-in"
      style={{
        borderColor: isConflicted
          ? 'rgba(255, 149, 0, 0.4)'
          : 'rgba(0, 230, 118, 0.3)',
        background: isConflicted
          ? 'linear-gradient(135deg, var(--color-ooda-surface), rgba(255, 149, 0, 0.06))'
          : 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0, 230, 118, 0.04))',
        boxShadow: isConflicted
          ? '0 0 20px rgba(255, 149, 0, 0.08)'
          : '0 0 20px rgba(0, 230, 118, 0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isConflicted ? '⚡' : '✓'}</span>
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{
            color: isConflicted ? 'var(--color-warning)' : 'var(--color-stable)',
          }}
        >
          {isConflicted ? 'Conflict Detected' : 'Agents Mostly Agree'}
        </span>
      </div>
      <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">
        {debate.conflict_summary}
      </p>
      {debate.weighted_score != null && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
            Weighted Score
          </span>
          <span className="text-xs font-mono font-bold text-[var(--color-ooda-text-muted)]">
            {debate.weighted_score.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function StrategyVerdictCard({ debate }) {
  if (!debate) return null;

  const verdict = debate.final_verdict || 'NEUTRAL';
  const style = VERDICT_COLORS[verdict] || VERDICT_COLORS.NEUTRAL;
  const threatColor = THREAT_LEVEL_COLORS[debate.threat_level] || '#8492a6';
  const urgStyle = URGENCY_DOTS[debate.urgency] || URGENCY_DOTS.MEDIUM;
  const confidencePct = Math.round((debate.final_confidence || 0) * 100);

  return (
    <div
      className="card animate-fade-in"
      style={{
        borderColor: style.border,
        background: `linear-gradient(135deg, var(--color-ooda-surface), ${style.bg})`,
        boxShadow: style.glow,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${style.color}, transparent)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎖️</span>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--color-agent-strategy)' }}
              >
                General
              </span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-medium">
                Strategy AI
              </span>
            </div>
          </div>
        </div>
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
          {style.label}
        </span>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 gap-3 mb-4"
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--color-ooda-surface-elevated)',
          border: '1px solid var(--color-ooda-border)',
        }}
      >
        {/* Confidence */}
        <div className="text-center">
          <div
            className="text-lg font-mono font-bold"
            style={{ color: style.color }}
          >
            {confidencePct}%
          </div>
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">
            Confidence
          </div>
        </div>

        {/* Threat Level */}
        <div className="text-center">
          <div
            className="text-lg font-bold uppercase"
            style={{ color: threatColor, fontSize: '0.95rem' }}
          >
            {debate.threat_level || '—'}
          </div>
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">
            Threat Level
          </div>
        </div>

        {/* Urgency */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: urgStyle.dot,
                boxShadow: `0 0 6px ${urgStyle.dot}40`,
              }}
            />
            <span
              className="text-sm font-bold uppercase"
              style={{ color: urgStyle.color }}
            >
              {debate.urgency || '—'}
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">
            Urgency
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="entropy-bar-track" style={{ height: '6px' }}>
          <div
            className="entropy-bar-fill"
            style={{
              width: `${confidencePct}%`,
              height: '100%',
              borderRadius: '4px',
              background: `linear-gradient(90deg, ${style.color}, ${style.color}88)`,
            }}
          />
        </div>
      </div>

      {/* Strategic Reasoning */}
      {debate.strategic_reasoning && (
        <div className="mb-4">
          <h4 className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1.5">
            Strategic Reasoning
          </h4>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">
            {debate.strategic_reasoning}
          </p>
        </div>
      )}

      {/* Recommended Action */}
      {debate.recommended_action && (
        <div
          className="rounded-lg p-3 mb-4"
          style={{
            background: `linear-gradient(135deg, ${style.bg}, transparent)`,
            border: `1px solid ${style.border}`,
          }}
        >
          <h4 className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1">
            ⚡ Recommended Action
          </h4>
          <p className="text-sm font-semibold" style={{ color: style.color }}>
            {debate.recommended_action}
          </p>
        </div>
      )}

      {/* Next Best Actions */}
      {debate.next_best_actions?.length > 0 && (
        <div>
          <h4 className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-2">
            Next Best Actions
          </h4>
          <ol className="flex flex-col gap-2">
            {debate.next_best_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed pt-0.5">
                  {action}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Debate() {
  const [debateResult, setDebateResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [currentSignalId, setCurrentSignalId] = useState(null);

  // Try to load existing debate on mount
  const loadExisting = useCallback(async () => {
    try {
      // First try: get latest signal and check for its debate
      const sigRes = await getLatestSignal();
      const signal = sigRes.data;
      if (signal?.id) {
        setCurrentSignalId(signal.id);
        try {
          const debateRes = await getDebateBySignal(signal.id);
          if (debateRes.data) {
            setDebateResult(debateRes.data);
            setHasRun(true);
          }
        } catch {
          // No debate for this signal yet — that's fine
        }
      }
    } catch {
      // No signals at all — will show empty state
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const handleRunDebate = async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // Get latest signal if we don't have one
      let signalId = currentSignalId;
      if (!signalId) {
        const sigRes = await getLatestSignal();
        signalId = sigRes.data?.id;
        setCurrentSignalId(signalId);
      }

      if (!signalId) {
        setError('No signals found. Seed demo data first from the Dashboard.');
        setLoading(false);
        return;
      }

      // Run debate
      const res = await runDebate(signalId, force);
      setDebateResult(res.data);
      setHasRun(true);
    } catch (err) {
      const detail =
        err?.response?.data?.detail || err.message || 'Failed to run debate';
      if (err?.response?.status === 404) {
        setError('No signals found. Seed demo data first from the Dashboard.');
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const signal = debateResult?.signal || null;
  const entropyScore = debateResult?.market_entropy_score;
  const agentVerdicts = debateResult?.agent_verdicts || [];
  const debate = debateResult?.debate || null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          ⚔️ <span>Debate Engine</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          AI agents debate, detect conflict, and Strategy AI delivers the final
          verdict
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 animate-fade-in animate-delay-1">
        <button
          onClick={() => handleRunDebate(false)}
          disabled={loading}
          className="btn-primary flex-1 text-xs"
          id="run-debate-btn"
        >
          {loading ? (
            <>
              <span
                className="loading-spinner"
                style={{ width: 14, height: 14 }}
              />
              Running Debate...
            </>
          ) : (
            '⚔️ Run Debate'
          )}
        </button>
        {hasRun && (
          <button
            onClick={() => handleRunDebate(true)}
            disabled={loading}
            className="btn-primary text-xs"
            style={{
              background: 'var(--color-ooda-surface-elevated)',
              color: 'var(--color-ooda-text-muted)',
              border: '1px solid var(--color-ooda-border)',
            }}
            id="rerun-debate-btn"
          >
            ↻ Re-run
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">
            ⚠ {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12 animate-fade-in">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-sm text-[var(--color-ooda-text-muted)]">
            Running full debate pipeline...
          </p>
          <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
            Agents → Conflict Detection → Strategy AI
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !debateResult && !error && (
        <div className="card text-center py-10 animate-fade-in animate-delay-2">
          <div className="text-3xl mb-3">⚔️</div>
          <h3 className="text-lg font-semibold text-[var(--color-ooda-text)]">
            Debate Engine
          </h3>
          <p className="text-sm text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
            Click "Run Debate" to analyze the latest signal. Agents will debate,
            conflicts will be detected, and Strategy AI will deliver the final
            verdict.
          </p>
        </div>
      )}

      {/* ── Debate Results ──────────────────────────────────────────────── */}
      {!loading && debateResult && (
        <>
          {/* Section 1: Signal Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-widest font-bold">
                01
              </span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                Signal Intelligence
              </span>
              <div
                className="flex-1"
                style={{
                  height: '1px',
                  background: 'var(--color-ooda-border)',
                }}
              />
            </div>
            <SignalSummaryCard signal={signal} entropyScore={entropyScore} />
          </div>

          {/* Section 2: Agent Round */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-widest font-bold">
                02
              </span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                Agent Round
              </span>
              <div
                className="flex-1"
                style={{
                  height: '1px',
                  background: 'var(--color-ooda-border)',
                }}
              />
            </div>
            <AgentDebateView verdicts={agentVerdicts} loading={false} />
          </div>

          {/* Section 3: Conflict Detection */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-widest font-bold">
                03
              </span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                Conflict Analysis
              </span>
              <div
                className="flex-1"
                style={{
                  height: '1px',
                  background: 'var(--color-ooda-border)',
                }}
              />
            </div>
            <ConflictCard debate={debate} />
          </div>

          {/* Section 4: Strategy AI Final Verdict */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-widest font-bold">
                04
              </span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                Strategy AI — Final Verdict
              </span>
              <div
                className="flex-1"
                style={{
                  height: '1px',
                  background: 'var(--color-ooda-border)',
                }}
              />
            </div>
            <StrategyVerdictCard debate={debate} />
          </div>

          {/* Phase footer */}
          <div
            className="text-center py-3 animate-fade-in"
            style={{ borderTop: '1px solid var(--color-ooda-border)' }}
          >
            <p className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider">
              Phase 4 · Debate Engine Complete
            </p>
            <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-1">
              Counter-Strike Package → Phase 5
            </p>
          </div>
        </>
      )}
    </div>
  );
}
