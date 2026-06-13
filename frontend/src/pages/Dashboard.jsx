/**
 * Dashboard — Phase 6: Main command center.
 * Shows market entropy, active alert, quick actions, signal feed preview.
 * Designed to immediately tell judges: "Something happened. OODA caught it."
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntropyGauge from '../components/EntropyGauge';
import SignalFeed from '../components/SignalFeed';
import {
  getSignals, getCurrentEntropy, getReputations,
  seedDemo, triggerPriceDrop,
} from '../services/api';

const AGENT_META = {
  'Marketing AI': { code: 'Watcher',      color: 'var(--color-agent-marketing)' },
  'Product AI':   { code: 'Archaeologist', color: 'var(--color-agent-product)' },
  'Sales AI':     { code: 'Hunter',        color: 'var(--color-agent-sales)' },
  'Strategy AI':  { code: 'General',       color: 'var(--color-agent-strategy)' },
};

export default function Dashboard() {
  const [signals, setSignals]       = useState([]);
  const [entropy, setEntropy]       = useState(null);
  const [reputations, setReputations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [seeding, setSeeding]       = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast]           = useState(null);
  const [showDemo, setShowDemo]     = useState(false);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sigRes, entRes, repRes] = await Promise.all([
        getSignals(), getCurrentEntropy(), getReputations(),
      ]);
      setSignals(sigRes.data);
      setEntropy(entRes.data);
      if (repRes.data?.length) setReputations(repRes.data);
    } catch {
      setError('Backend unreachable. Is the server running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      await fetchData();
      showToast('✓ Demo data seeded successfully');
    } catch {
      showToast('Failed to seed demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerPriceDrop();
      await fetchData();
      showToast('⚡ RivalFlow price drop detected!');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to trigger', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const latestHighSignal = signals.find(s => s.severity === 'HIGH');
  const hasSignals = signals.length > 0;
  const entropyScore = entropy?.score || 0;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-gradient">OODA</span>
            </h1>
            <p className="text-[11px] text-[var(--color-ooda-text-dim)] font-medium tracking-wider mt-0.5">
              Observe · Orient · Decide · Act
            </p>
          </div>
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="btn-outline text-[10px] py-1.5 px-3"
          >
            {showDemo ? 'Hide' : 'Demo'}
          </button>
        </div>
      </div>

      {/* Demo Controls (collapsible) */}
      {showDemo && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-2">
            Demo Controls
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding || triggering}
              className="btn-outline flex-1 text-[11px]"
            >
              {seeding ? '...' : '⟳ Seed Data'}
            </button>
            <button
              onClick={handleTrigger}
              disabled={seeding || triggering}
              className="btn-primary btn-danger flex-1 text-[11px] py-2"
            >
              {triggering ? '...' : '⚡ Price Drop'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
          <button onClick={fetchData} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">
            Retry →
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Entropy Gauge */}
          <div className="animate-fade-in animate-delay-1">
            <EntropyGauge score={entropyScore} reason={entropy?.reason || ''} status={entropy?.status} />
          </div>

          {/* Active Alert */}
          {latestHighSignal && (
            <button
              onClick={() => navigate('/signals')}
              className="card card-threat animate-fade-in animate-delay-2 w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-threat)] pulse-dot flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[var(--color-threat)] uppercase font-bold tracking-wider">
                    Active Alert
                  </div>
                  <p className="text-sm text-[var(--color-ooda-text)] font-medium mt-0.5 line-clamp-2">
                    {latestHighSignal.summary}
                  </p>
                </div>
                {latestHighSignal.percentage_change != null && (
                  <span className="text-lg font-black font-mono text-[var(--color-threat)] flex-shrink-0">
                    {latestHighSignal.percentage_change}%
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Quick Actions */}
          <div className="animate-fade-in animate-delay-3">
            <div className="section-label mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/signals')}  className="btn-outline text-[11px]">◉ View Signals</button>
              <button onClick={() => navigate('/debate')}   className="btn-outline text-[11px]">◆ Run Agents</button>
              <button onClick={() => navigate('/debate')}   className="btn-outline text-[11px]">⚖ View Debate</button>
              <button onClick={() => navigate('/counter-strike')} className="btn-outline text-[11px]">⚡ Counter-Strike</button>
            </div>
          </div>

          {/* Agent Grid */}
          {reputations.length > 0 && (
            <div className="animate-fade-in animate-delay-4">
              <div className="section-label mb-2">Agents Online</div>
              <div className="grid grid-cols-4 gap-2">
                {reputations.slice(0, 4).map((rep) => {
                  const meta = AGENT_META[rep.agent_name] || { code: '—', color: 'var(--color-neutral)' };
                  return (
                    <div
                      key={rep.agent_name}
                      className="rounded-xl p-2.5 text-center border border-[var(--color-ooda-border)]"
                      style={{ background: 'var(--color-ooda-surface)' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mx-auto mb-1.5 pulse-dot"
                        style={{ background: meta.color }}
                      />
                      <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: meta.color }}>
                        {meta.code.slice(0, 6)}
                      </div>
                      <div className="text-[8px] text-[var(--color-ooda-text-dim)] mt-0.5 font-mono">
                        {rep.reputation_score?.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signal Feed Preview */}
          {hasSignals && (
            <div className="animate-fade-in animate-delay-5">
              <div className="flex items-center justify-between mb-2">
                <div className="section-label flex-1">Latest Signals</div>
                <button
                  onClick={() => navigate('/signals')}
                  className="text-[10px] text-[var(--color-ooda-accent)] font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>
              <SignalFeed signals={signals.slice(0, 3)} compact />
            </div>
          )}

          {/* Empty State */}
          {!hasSignals && (
            <div className="card text-center py-12 animate-fade-in animate-delay-2">
              <div className="text-4xl mb-3 opacity-30">⌘</div>
              <h3 className="text-base font-semibold text-[var(--color-ooda-text)]">
                Command Center Ready
              </h3>
              <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
                Click the Demo button above to seed data and trigger the RivalFlow price drop scenario.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
