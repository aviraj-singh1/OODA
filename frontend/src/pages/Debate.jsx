/**
 * Debate — Phase 3: Agent Analysis page.
 * Runs individual agent analysis and displays verdict cards.
 * Full debate engine comes in Phase 4.
 */

import { useState, useEffect, useCallback } from 'react';
import AgentDebateView from '../components/AgentDebateView';
import { runAgents, getLatestAgentVerdicts, getLatestSignal } from '../services/api';

export default function Debate() {
  const [verdicts, setVerdicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signalInfo, setSignalInfo] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  // Load existing verdicts on mount
  const loadExisting = useCallback(async () => {
    try {
      const res = await getLatestAgentVerdicts();
      if (res.data?.length) {
        setVerdicts(res.data);
        setHasRun(true);
      }
    } catch {
      // No existing verdicts — that's fine
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const handleRunAnalysis = async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get latest signal
      const sigRes = await getLatestSignal();
      const signal = sigRes.data;
      setSignalInfo(signal);

      // 2. Run agents against it
      const res = await runAgents(signal.id, force);
      setVerdicts(res.data.verdicts || []);
      setHasRun(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Failed to run agent analysis';
      if (err?.response?.status === 404) {
        setError('No signals found. Seed demo data first from the Dashboard.');
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🤖 <span>Agent Analysis</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          AI agents analyze the latest signal from different business perspectives
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 animate-fade-in animate-delay-1">
        <button
          onClick={() => handleRunAnalysis(false)}
          disabled={loading}
          className="btn-primary flex-1 text-xs"
          id="run-agent-analysis-btn"
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14 }} />
              Analyzing...
            </>
          ) : (
            '🧠 Run Agent Analysis'
          )}
        </button>
        {hasRun && (
          <button
            onClick={() => handleRunAnalysis(true)}
            disabled={loading}
            className="btn-primary text-xs"
            style={{
              background: 'var(--color-ooda-surface-elevated)',
              color: 'var(--color-ooda-text-muted)',
              border: '1px solid var(--color-ooda-border)',
            }}
            id="rerun-agent-analysis-btn"
          >
            ↻ Re-run
          </button>
        )}
      </div>

      {/* Signal Context */}
      {signalInfo && (
        <div
          className="card animate-fade-in animate-delay-1"
          style={{
            background: 'var(--color-ooda-surface-elevated)',
            borderLeft: '3px solid var(--color-ooda-accent)',
            padding: '12px 16px',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[var(--color-ooda-accent)] font-semibold uppercase tracking-wider">
              Analyzing Signal
            </span>
            <span className="badge badge-threat" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
              {signalInfo.severity}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ooda-text-muted)]">
            {signalInfo.summary}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">⚠ {error}</p>
        </div>
      )}

      {/* Agent Verdicts */}
      <div className="animate-fade-in animate-delay-2">
        <AgentDebateView verdicts={verdicts} loading={loading} />
      </div>

      {/* Phase info */}
      {hasRun && !loading && verdicts.length > 0 && (
        <div
          className="text-center py-3 animate-fade-in animate-delay-3"
          style={{ borderTop: '1px solid var(--color-ooda-border)' }}
        >
          <p className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider">
            Phase 3 · Individual Agent Analysis
          </p>
          <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-1">
            Agent debate & strategy synthesis → Phase 4
          </p>
        </div>
      )}
    </div>
  );
}
