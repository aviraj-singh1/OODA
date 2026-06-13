/**
 * CounterStrikePanel — Phase 5: Summary panel for Dashboard integration.
 * Shows the latest Counter-Strike package status in a compact card.
 */

import { useState, useEffect } from 'react';
import { getLatestPackage } from '../services/api';

export default function CounterStrikePanel() {
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLatestPackage();
        if (mounted && res.data?.package) {
          setPkg(res.data);
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

  if (!pkg) {
    return (
      <div className="card text-center py-8">
        <div className="text-2xl mb-2">🎯</div>
        <h3 className="text-sm font-semibold text-[var(--color-ooda-text)]">
          No Counter-Strike Package Yet
        </h3>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1 max-w-xs mx-auto">
          Run the debate engine first, then build a Counter-Strike package to generate response assets.
        </p>
      </div>
    );
  }

  const isDeployed = pkg.package?.deployed === 1 || pkg.package?.status === 'DEPLOYED';
  const assetCount = pkg.asset_count || 5;
  const verdict = pkg.debate_verdict?.final_verdict || 'NEUTRAL';

  return (
    <div
      className="card"
      style={{
        borderColor: isDeployed ? 'rgba(0,230,118,0.3)' : 'rgba(0,212,255,0.2)',
        background: isDeployed
          ? 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,230,118,0.04))'
          : 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,212,255,0.04))',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isDeployed ? '✅' : '🎯'}</span>
          <div>
            <div className="text-sm font-bold text-[var(--color-ooda-text)]">
              {pkg.package?.title || 'Counter-Strike Package'}
            </div>
            <div className="text-[10px] text-[var(--color-ooda-text-dim)]">
              {pkg.signal?.competitor_name} · {assetCount} assets
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
          {isDeployed ? 'DEPLOYED' : 'READY'}
        </span>
      </div>

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
