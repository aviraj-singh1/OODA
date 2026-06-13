/**
 * Debate — Phase 6: Polished Agent Analysis & Strategy Verdict page.
 * Clean cards for each agent, then Strategy AI final verdict.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  runAgents, runDebate, getLatestSignal, getLatestDebate,
  getLatestVerdicts,
} from '../services/api';

const AGENTS = {
  'Marketing AI': { code: 'Watcher',      role: 'Positioning & Perception', color: 'var(--color-agent-marketing)' },
  'Product AI':   { code: 'Archaeologist', role: 'Product Strength',         color: 'var(--color-agent-product)' },
  'Sales AI':     { code: 'Hunter',        role: 'Revenue & Pipeline Risk',  color: 'var(--color-agent-sales)' },
  'Strategy AI':  { code: 'General',       role: 'Strategic Synthesis',      color: 'var(--color-agent-strategy)' },
};

const VERDICT_STYLE = {
  THREAT:      { color: 'var(--color-threat)',  bg: 'rgba(255,59,59,0.08)',  border: 'rgba(255,59,59,0.3)' },
  OPPORTUNITY: { color: 'var(--color-stable)',  bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.3)' },
  NEUTRAL:     { color: 'var(--color-neutral)', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)' },
};

function AgentCard({ verdict }) {
  const [open, setOpen] = useState(false);
  const meta = AGENTS[verdict.agent_name] || { code: '—', role: '', color: 'var(--color-neutral)' };
  const vs = VERDICT_STYLE[verdict.verdict] || VERDICT_STYLE.NEUTRAL;
  const conf = Math.round((verdict.confidence || 0) * 100);

  return (
    <div
      className="card"
      style={{ borderLeft: `3px solid ${meta.color}`, cursor: 'pointer' }}
      onClick={() => setOpen(!open)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: meta.color }} />
          <div>
            <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.code}</span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] ml-1.5">{verdict.agent_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="badge"
            style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}` }}
          >
            {verdict.verdict || 'NEUTRAL'}
          </span>
          <span className="text-[10px] font-mono font-bold text-[var(--color-ooda-text-muted)]">{conf}%</span>
        </div>
      </div>

      {/* Role */}
      <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-1">{meta.role}</p>

      {/* Expanded */}
      {open && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-ooda-border)' }}>
          {/* Reasoning */}
          {verdict.reasoning && (
            <div className="mb-3">
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">Reasoning</div>
              <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{verdict.reasoning}</p>
            </div>
          )}

          {/* Evidence */}
          {verdict.evidence?.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">Evidence</div>
              <div className="flex flex-col gap-1">
                {verdict.evidence.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[var(--color-ooda-accent)] text-[10px] mt-0.5">•</span>
                    <span className="text-xs text-[var(--color-ooda-text-muted)]">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action */}
          {verdict.recommended_action && (
            <div
              className="rounded-lg p-2.5"
              style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
            >
              <div className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: meta.color }}>
                Recommended Action
              </div>
              <p className="text-xs text-[var(--color-ooda-text)] font-medium">{verdict.recommended_action}</p>
            </div>
          )}

          {/* Urgency */}
          {verdict.urgency && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold">Urgency:</span>
              <span className="badge badge-warning text-[9px]">{verdict.urgency}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StrategyVerdictCard({ debate }) {
  if (!debate) return null;
  const vs = VERDICT_STYLE[debate.final_verdict] || VERDICT_STYLE.NEUTRAL;
  const conf = Math.round((debate.final_confidence || 0) * 100);
  const entropy = Math.round(debate.market_entropy_score || 0);

  return (
    <div
      className="card"
      style={{
        background: `linear-gradient(135deg, var(--color-ooda-surface), ${vs.bg})`,
        borderColor: vs.border,
      }}
    >
      <div className="text-center mb-4">
        <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-widest mb-2">
          Strategy AI — Final Verdict
        </div>
        <div className="text-2xl font-black tracking-tight" style={{ color: vs.color }}>
          {debate.final_verdict || 'PENDING'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="genome-stat">
          <span className="genome-stat-value font-mono" style={{ color: vs.color }}>{conf}%</span>
          <span className="genome-stat-label">Confidence</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value font-mono text-[var(--color-ooda-accent)]">{entropy}</span>
          <span className="genome-stat-label">Entropy</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value font-mono text-[var(--color-warning)]">{debate.threat_level || '—'}</span>
          <span className="genome-stat-label">Threat</span>
        </div>
      </div>

      {/* Conflict */}
      {debate.conflict_summary && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}>
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">
            {debate.conflict_detected ? '⚡ Conflict Detected' : 'Consensus'}
          </div>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{debate.conflict_summary}</p>
        </div>
      )}

      {/* Strategic Reasoning */}
      {debate.strategic_reasoning && (
        <div className="mb-3">
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">Strategic Reasoning</div>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{debate.strategic_reasoning}</p>
        </div>
      )}

      {/* Recommended Action */}
      {debate.recommended_action && (
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <div className="text-[9px] text-[var(--color-ooda-accent)] uppercase font-bold tracking-wider mb-1">
            Recommended Action
          </div>
          <p className="text-xs text-[var(--color-ooda-text)] font-semibold">{debate.recommended_action}</p>
        </div>
      )}

      {/* Next Actions */}
      {debate.next_best_actions?.length > 0 && (
        <div className="mt-3">
          <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1.5">Next Actions</div>
          <div className="flex flex-col gap-1">
            {debate.next_best_actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-ooda-accent)] text-[10px] font-bold">{i + 1}.</span>
                <span className="text-xs text-[var(--color-ooda-text-muted)]">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="animate-fade-in">
        <h1 className="text-lg font-black tracking-tight">Agent Analysis</h1>
        <p className="text-[11px] text-[var(--color-ooda-text-dim)] mt-0.5">
          AI agents analyze signals from different business perspectives
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 animate-fade-in animate-delay-1">
        <button
          onClick={handleRunAgents}
          disabled={loading}
          className="btn-outline flex-1 text-[11px]"
        >
          {loading ? '...' : '◆ Run Agents'}
        </button>
        <button
          onClick={handleRunDebate}
          disabled={loading}
          className="btn-primary flex-1 text-[11px]"
        >
          {loading ? '...' : '⚖ Run Debate'}
        </button>
      </div>

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

      {/* Agent Verdicts */}
      {agentVerdicts.length > 0 && (
        <>
          <div className="section-label">Agent Verdicts</div>
          {agentVerdicts.map((v, i) => (
            <div key={v.agent_name} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <AgentCard verdict={v} />
            </div>
          ))}
        </>
      )}

      {/* Strategy AI Verdict */}
      {debate && (
        <>
          <div className="section-label">Strategy AI Verdict</div>
          <div className="animate-fade-in">
            <StrategyVerdictCard debate={debate} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!loadingData && !loading && verdicts.length === 0 && !error && (
        <div className="card text-center py-12 animate-fade-in animate-delay-2">
          <div className="text-3xl mb-3 opacity-30">◆</div>
          <h3 className="text-base font-semibold text-[var(--color-ooda-text)]">
            No Analysis Yet
          </h3>
          <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
            Click "Run Agents" to have Marketing AI, Product AI, and Sales AI analyze the latest signal.
            Then click "Run Debate" for Strategy AI's final verdict.
          </p>
        </div>
      )}
    </div>
  );
}
