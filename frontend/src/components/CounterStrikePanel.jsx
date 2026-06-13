/**
 * CounterStrikePanel — Phase 5: Summary panel for Dashboard.
 * Shows the latest Counter-Strike package status in a compact card.
 */

import { useState, useEffect } from 'react';
import { getLatestPackage } from '../services/api';

export default function CounterStrikePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLatestPackage();
        if (mounted && res.data?.package) {
          setData(res.data);
        }
      } catch {
        // No package yet
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="card text-center py-6">
        <div className="loading-spinner mx-auto mb-2" style={{ width: 20, height: 20 }} />
        <p className="text-xs text-[var(--color-ooda-text-dim)]">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-8">
        <div className="text-2xl mb-2">🎯</div>
        <h3 className="text-sm font-semibold text-[var(--color-ooda-text)]">
          No Counter-Strike Package Yet
        </h3>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1 max-w-xs mx-auto">
          Run the debate engine first, then build a Counter-Strike package.
        </p>
      </div>
    );
  }

  const pkg = data.package;
  const signal = data.signal;
  const verdict = data.debate_verdict;
  const isDeployed = pkg?.deployed === 1 || pkg?.status === 'DEPLOYED';

  return (
    <div
      className="card"
      style={{
        borderColor: isDeployed ? 'rgba(0,230,118,0.3)' : 'rgba(245,158,11,0.25)',
        background: isDeployed
          ? 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,230,118,0.04))'
          : 'linear-gradient(135deg, var(--color-ooda-surface), rgba(245,158,11,0.04))',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isDeployed ? '✅' : '🎯'}</span>
          <div>
            <div className="text-sm font-bold text-[var(--color-ooda-text)]">
              {pkg?.title || 'Counter-Strike Package'}
            </div>
            <div className="text-[10px] text-[var(--color-ooda-text-dim)]">
              {signal?.competitor_name} · {data.asset_count || 5} assets
            </div>
          </div>
        </div>
        <span
          className="badge"
          style={{
            background: isDeployed ? 'rgba(0,230,118,0.15)' : 'rgba(245,158,11,0.15)',
            color: isDeployed ? 'var(--color-stable)' : '#f59e0b',
            border: `1px solid ${isDeployed ? 'rgba(0,230,118,0.3)' : 'rgba(245,158,11,0.3)'}`,
            fontSize: '0.6rem',
          }}
        >
          {isDeployed ? '✓ DEPLOYED' : '◯ READY'}
        </span>
      </div>

      {/* Verdict summary */}
      {verdict && (
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <span style={{ color: verdict.final_verdict === 'THREAT' ? 'var(--color-threat)' : 'var(--color-stable)' }}>
            {verdict.final_verdict}
          </span>
          <span className="text-[var(--color-ooda-text-dim)]">•</span>
          <span className="text-[var(--color-ooda-text-muted)] font-mono">
            {verdict.final_confidence ? `${Math.round(verdict.final_confidence * 100)}%` : '—'}
          </span>
          <span className="text-[var(--color-ooda-text-dim)]">•</span>
          <span className="text-[var(--color-ooda-accent)] font-mono">
            Entropy {verdict.market_entropy_score ? Math.round(verdict.market_entropy_score) : '—'}
          </span>
        </div>
      )}

      {/* Quick asset list */}
      <div className="flex flex-wrap gap-2">
        {['✉️ Email', '⚔️ Battlecard', '📱 Social', '🔔 Alert', '📊 Report'].map((label, i) => (
          <span
            key={i}
            className="text-[10px] px-2 py-1 rounded-md"
            style={{
              background: 'var(--color-ooda-surface-elevated)',
              color: 'var(--color-ooda-text-muted)',
              border: '1px solid var(--color-ooda-border)',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
