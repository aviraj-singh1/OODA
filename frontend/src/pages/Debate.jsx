/**
 * Debate — Phase 8: Complete verdict-focused rewrite.
 * Shows full agent analysis with reasoning, evidence, actions visible by default.
 * Strategy AI verdict is a hero card with detailed breakdown.
 * Desktop: 2-col grid for agent cards, full-width strategy verdict.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  runAgents, runDebate, getLatestSignal, getLatestDebate,
  getLatestVerdicts,
} from '../services/api';

const AGENTS = {
  'Marketing AI': { code: 'Watcher',      role: 'Positioning & Perception', icon: '👁️', color: 'var(--color-agent-marketing)' },
  'Product AI':   { code: 'Archaeologist', role: 'Product Strength',         icon: '🔬', color: 'var(--color-agent-product)' },
  'Sales AI':     { code: 'Hunter',        role: 'Revenue & Pipeline Risk',  icon: '🎯', color: 'var(--color-agent-sales)' },
  'Strategy AI':  { code: 'General',       role: 'Strategic Synthesis',      icon: '🧠', color: 'var(--color-agent-strategy)' },
};

const VERDICT_STYLE = {
  THREAT:      { color: 'var(--color-threat)',  bg: 'rgba(255,59,59,0.08)',    border: 'rgba(255,59,59,0.3)',    icon: '⚠', glow: 'rgba(255,59,59,0.15)' },
  OPPORTUNITY: { color: 'var(--color-stable)',  bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.3)',   icon: '✦', glow: 'rgba(0,230,118,0.15)' },
  NEUTRAL:     { color: 'var(--color-neutral)', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)', icon: '●', glow: 'rgba(100,116,139,0.15)' },
};

/* ────────────────────────────────────────────────────────────────────────────
   Agent Verdict Card — Full detail visible by default
   ──────────────────────────────────────────────────────────────────────────── */
function AgentVerdictCard({ verdict }) {
  const meta = AGENTS[verdict.agent_name] || { code: '—', role: '', icon: '🤖', color: 'var(--color-neutral)' };
  const vs = VERDICT_STYLE[verdict.verdict] || VERDICT_STYLE.NEUTRAL;
  const conf = Math.round((verdict.confidence || 0) * 100);

  // Parse evidence — handle both JSON string and array
  let evidence = [];
  if (Array.isArray(verdict.evidence)) {
    evidence = verdict.evidence;
  } else if (typeof verdict.evidence === 'string') {
    try {
      const parsed = JSON.parse(verdict.evidence);
      evidence = Array.isArray(parsed) ? parsed : (parsed?.points || []);
    } catch { evidence = []; }
  } else if (verdict.evidence_json) {
    try {
      const parsed = JSON.parse(verdict.evidence_json);
      evidence = Array.isArray(parsed) ? parsed : (parsed?.points || []);
    } catch { evidence = []; }
  }

  return (
    <div
      className="card agent-verdict-card animate-fade-in"
      style={{
        borderLeft: `3px solid ${meta.color}`,
        background: `linear-gradient(135deg, var(--color-ooda-surface), ${vs.bg})`,
      }}
    >
      {/* Header: Agent name + Verdict badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.code}</span>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)]">{verdict.agent_name}</span>
            </div>
            <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-0.5">{meta.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="badge badge-lg"
            style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}` }}
          >
            {vs.icon} {verdict.verdict || 'NEUTRAL'}
          </span>
          {verdict.urgency && (
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: verdict.urgency === 'CRITICAL' ? 'var(--color-threat)' : verdict.urgency === 'HIGH' ? 'var(--color-warning)' : 'var(--color-ooda-text-dim)' }}>
              {verdict.urgency} urgency
            </span>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
            Confidence
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: meta.color }}>{conf}%</span>
        </div>
        <div className="confidence-bar-container">
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{
                width: `${conf}%`,
                background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
                boxShadow: conf >= 60 ? `0 0 8px ${meta.color}40` : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Reasoning — always visible */}
      {verdict.reasoning && (
        <div className="mb-3">
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">Reasoning</div>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{verdict.reasoning}</p>
        </div>
      )}

      {/* Evidence — always visible */}
      {evidence.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1.5">Evidence</div>
          <div className="flex flex-col gap-1.5">
            {evidence.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                <span className="text-xs text-[var(--color-ooda-text-muted)]">{typeof e === 'string' ? e : JSON.stringify(e)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Action — always visible */}
      {verdict.recommended_action && (
        <div
          className="rounded-lg p-3"
          style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
        >
          <div className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: meta.color }}>
            ⚡ Recommended Action
          </div>
          <p className="text-xs text-[var(--color-ooda-text)] font-medium">{verdict.recommended_action}</p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Strategy AI Verdict — Hero Card
   ──────────────────────────────────────────────────────────────────────────── */
function StrategyVerdictCard({ debate }) {
  if (!debate) return null;
  const vs = VERDICT_STYLE[debate.final_verdict] || VERDICT_STYLE.NEUTRAL;
  const conf = Math.round((debate.final_confidence || 0) * 100);
  const entropy = Math.round(debate.market_entropy_score || 0);

  return (
    <div className="animate-fade-in">
      {/* Hero Verdict */}
      <div
        className="verdict-hero card"
        style={{
          background: `linear-gradient(135deg, var(--color-ooda-surface), ${vs.bg})`,
          borderColor: vs.border,
          boxShadow: `0 0 40px -8px ${vs.glow}`,
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-[0.2em] mb-3">
            🧠 Strategy AI — Final Verdict
          </div>
          <div className="verdict-text" style={{ color: vs.color }}>
            {vs.icon} {debate.final_verdict || 'PENDING'}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-lg font-mono font-black" style={{ color: vs.color }}>{conf}%</div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Confidence</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--color-ooda-border)' }} />
            <div className="text-center">
              <div className="text-lg font-mono font-black text-[var(--color-ooda-accent)]">{entropy}</div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Entropy</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--color-ooda-border)' }} />
            <div className="text-center">
              <div className="text-lg font-mono font-black text-[var(--color-warning)]">{debate.threat_level || '—'}</div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Threat</div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mt-4 max-w-sm mx-auto">
            <div className="confidence-bar-container">
              <div className="confidence-bar-track">
                <div
                  className="confidence-bar-fill"
                  style={{
                    width: `${conf}%`,
                    background: `linear-gradient(90deg, ${vs.color}, ${vs.color}88)`,
                    boxShadow: `0 0 12px ${vs.glow}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="responsive-split mt-4">
        {/* Left: Reasoning & Conflict */}
        <div className="flex flex-col gap-3">
          {/* Conflict */}
          {debate.conflict_summary && (
            <div className="card" style={{ borderColor: debate.conflict_detected ? 'rgba(245,158,11,0.3)' : 'var(--color-ooda-border)' }}>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1.5">
                {debate.conflict_detected ? '⚡ Conflict Detected' : '✓ Consensus Reached'}
              </div>
              <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{debate.conflict_summary}</p>
            </div>
          )}

          {/* Strategic Reasoning */}
          {debate.strategic_reasoning && (
            <div className="card">
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1.5">Strategic Reasoning</div>
              <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{debate.strategic_reasoning}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-3">
          {/* Recommended Action */}
          {debate.recommended_action && (
            <div
              className="card"
              style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.15)' }}
            >
              <div className="text-[9px] text-[var(--color-ooda-accent)] uppercase font-bold tracking-wider mb-1.5">
                ⚡ Recommended Action
              </div>
              <p className="text-sm text-[var(--color-ooda-text)] font-semibold">{debate.recommended_action}</p>
            </div>
          )}

          {/* Next Actions */}
          {debate.next_best_actions?.length > 0 && (
            <div className="card">
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-2">Next Best Actions</div>
              <div className="flex flex-col gap-2">
                {debate.next_best_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span
                      className="text-[10px] font-bold font-mono flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--color-ooda-accent)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Main Debate Page
   ──────────────────────────────────────────────────────────────────────────── */
export default function Debate() {
  const [signal, setSignal]       = useState(null);
  const [verdicts, setVerdicts]   = useState([]);
  const [debate, setDebate]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load existing data on mount
  const loadExisting = useCallback(async () => {
    setLoadingData(true);
    try {
      const sigRes = await getLatestSignal();
      setSignal(sigRes.data);

      try {
        const debRes = await getLatestDebate();
        if (debRes.data?.debate) {
          setDebate(debRes.data.debate);
          setVerdicts(debRes.data.agent_verdicts || []);
        }
      } catch {
        // No debate yet
        try {
          const vRes = await getLatestVerdicts();
          if (vRes.data?.verdicts) setVerdicts(vRes.data.verdicts);
          else if (Array.isArray(vRes.data)) setVerdicts(vRes.data);
        } catch {}
      }
    } catch {
      // No signal yet
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const handleRunAgents = async () => {
    if (!signal?.id) { setError('No signal found. Seed demo data first.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await runAgents(signal.id);
      setVerdicts(res.data.verdicts || []);
      showToast('✓ Agent analysis complete');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to run agents');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDebate = async () => {
    if (!signal?.id) { setError('No signal found. Seed demo data first.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await runDebate(signal.id);
      setDebate(res.data.debate);
      setVerdicts(res.data.agent_verdicts || []);
      showToast('⚖ Strategy AI verdict delivered');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to run debate');
    } finally {
      setLoading(false);
    }
  };

  const agentVerdicts = verdicts.filter(v => v.agent_name !== 'Strategy AI');

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-in page-header">
        <h1>Agent Analysis & Verdict</h1>
        <p>AI agents analyze signals, then Strategy AI delivers the final verdict</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 animate-fade-in animate-delay-1">
        <button
          onClick={handleRunAgents}
          disabled={loading}
          className="btn-outline flex-1 text-[11px]"
        >
          {loading ? '⏳ Running...' : '◆ Run Agent Analysis'}
        </button>
        <button
          onClick={handleRunDebate}
          disabled={loading}
          className="btn-primary flex-1 text-[11px]"
        >
          {loading ? '⏳ Running...' : '⚖ Run Full Debate'}
        </button>
      </div>

      {/* Loading progress */}
      {loading && (
        <div className="progress-bar-track">
          <div className="progress-bar-fill" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
        </div>
      )}

      {/* Loading */}
      {(loadingData || loading) && verdicts.length === 0 && !error && (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Signal Context */}
      {signal && (
        <div className="card animate-fade-in animate-delay-1" style={{ borderLeft: '3px solid var(--color-ooda-accent)' }}>
          <div className="text-[9px] text-[var(--color-ooda-accent)] uppercase font-bold tracking-widest mb-1">Signal Under Analysis</div>
          <p className="text-[13px] text-[var(--color-ooda-text)] font-medium">{signal.summary}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-[var(--color-ooda-text-dim)]">{signal.competitor_name}</span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)]">•</span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] capitalize">{signal.signal_type?.replace(/_/g, ' ')}</span>
            {signal.percentage_change != null && (
              <span className="text-[10px] font-mono font-bold text-[var(--color-threat)]">
                {signal.percentage_change}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Agent Verdicts — Full detail, responsive grid */}
      {agentVerdicts.length > 0 && (
        <>
          <div className="section-label">Agent Verdicts — {agentVerdicts.length} analyses</div>
          <div className="responsive-grid-2">
            {agentVerdicts.map((v, i) => (
              <div key={v.agent_name || i} style={{ animationDelay: `${i * 0.08}s` }}>
                <AgentVerdictCard verdict={v} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Strategy AI Verdict */}
      {debate && (
        <>
          <div className="section-label mt-2">Strategy AI — Final Verdict</div>
          <StrategyVerdictCard debate={debate} />
        </>
      )}

      {/* Empty State */}
      {!loadingData && !loading && verdicts.length === 0 && !error && (
        <div className="card text-center py-12 animate-fade-in animate-delay-2">
          <div className="text-4xl mb-3 opacity-30">◆</div>
          <h3 className="text-base font-semibold text-[var(--color-ooda-text)]">
            No Analysis Yet
          </h3>
          <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2 max-w-sm mx-auto leading-relaxed">
            Click <strong>"Run Agent Analysis"</strong> to have Marketing AI, Product AI, and Sales AI analyze the latest signal.
            Then click <strong>"Run Full Debate"</strong> for Strategy AI's final verdict with conflict detection and recommended actions.
          </p>
        </div>
      )}
    </div>
  );
}
