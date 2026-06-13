/**
 * Dashboard — Main command center.
 * Shows Market Entropy gauge, signal feed, agent status, and quick actions.
 */

import { useEffect, useState, useCallback } from 'react';
import EntropyGauge from '../components/EntropyGauge';
import SignalFeed from '../components/SignalFeed';
import StatusBadge from '../components/StatusBadge';
import { getSignals, getCurrentEntropy, getReputations, seedDemo, triggerPriceDrop } from '../services/api';

// Static agent metadata — codenames and colors don't change
const AGENT_META = {
  'Marketing AI': { codename: 'Watcher', color: 'var(--color-agent-marketing)' },
  'Product AI':   { codename: 'Archaeologist', color: 'var(--color-agent-product)' },
  'Sales AI':     { codename: 'Hunter', color: 'var(--color-agent-sales)' },
  'Strategy AI':  { codename: 'General', color: 'var(--color-agent-strategy)' },
};

// Fallback when API hasn't been seeded yet
const DEFAULT_REPUTATIONS = Object.entries(AGENT_META).map(([name]) => ({
  agent_name: name,
  reputation_score: 1.0,
}));

export default function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [entropy, setEntropy] = useState(null);
  const [reputations, setReputations] = useState(DEFAULT_REPUTATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sigRes, entRes, repRes] = await Promise.all([
        getSignals(),
        getCurrentEntropy(),
        getReputations(),
      ]);
      setSignals(sigRes.data);
      setEntropy(entRes.data);
      if (repRes.data?.length) setReputations(repRes.data);
    } catch (err) {
      setError('Backend unreachable. Is the server running on port 8000?');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      await fetchData();
      showToast('Demo data seeded. 3 signals loaded.');
    } catch (err) {
      showToast('Failed to seed demo data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerPriceDrop();
      await fetchData();
      showToast('🚨 LIVE signal triggered: RivalFlow price drop detected!');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to trigger price drop.';
      showToast(detail, 'error');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-in max-w-lg mx-auto ${
            toast.type === 'error'
              ? 'bg-[rgba(255,59,59,0.15)] border border-[var(--color-threat)] text-[var(--color-threat)]'
              : 'bg-[rgba(0,230,118,0.12)] border border-[var(--color-stable)] text-[var(--color-stable)]'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-ooda-accent)] pulse-threat" />
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-gradient">OODA</span>
            <span className="text-[var(--color-ooda-text-muted)] font-normal ml-2 text-sm">
              Command Center
            </span>
          </h1>
        </div>
        <p className="text-xs text-[var(--color-ooda-text-dim)] ml-5">
          Real-time competitive intelligence & counter-strategy engine
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">⚠ {error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-xs text-[var(--color-ooda-accent)] hover:underline"
          >
            Retry connection →
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 animate-fade-in animate-delay-1">
        <button
          onClick={handleSeed}
          disabled={seeding || triggering}
          className="btn-primary flex-1 text-xs"
        >
          {seeding ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14 }} />
              Seeding...
            </>
          ) : (
            '🌱 Seed Demo'
          )}
        </button>
        <button
          onClick={handleTrigger}
          disabled={seeding || triggering}
          className="btn-primary btn-danger flex-1 text-xs"
        >
          {triggering ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14 }} />
              Triggering...
            </>
          ) : (
            '🚨 Trigger Price Drop'
          )}
        </button>
      </div>

      {/* Entropy Gauge */}
      <div className="animate-fade-in animate-delay-2">
        {entropy && <EntropyGauge score={entropy.score} reason={entropy.reason} />}
      </div>

      {/* Agent Status — live from API */}
      <div className="card animate-fade-in animate-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-ooda-text-muted)] tracking-wide uppercase">
            Agent Status
          </h2>
          <StatusBadge status="STABLE" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {reputations.map((rep) => {
            const meta = AGENT_META[rep.agent_name] || { codename: rep.agent_name, color: 'var(--color-ooda-accent)' };
            return (
              <div
                key={rep.agent_name}
                className="bg-[var(--color-ooda-surface-elevated)] rounded-lg p-3 border border-[var(--color-ooda-border)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                  <span className="text-xs font-semibold" style={{ color: meta.color }}>
                    {meta.codename}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)]">{rep.agent_name}</div>
                <div className="text-xs font-mono mt-1 text-[var(--color-ooda-text-muted)]">
                  Rep: {rep.reputation_score?.toFixed(2) ?? '1.00'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signal Feed */}
      <div className="animate-fade-in animate-delay-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-ooda-text-muted)] tracking-wide uppercase">
            Signal Feed
          </h2>
          <span className="text-xs text-[var(--color-ooda-text-dim)] font-mono">
            {signals.length} signals
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="loading-spinner" />
          </div>
        ) : (
          <SignalFeed signals={signals} />
        )}
      </div>
    </div>
  );
}
