/**
 * Dashboard — Main command center.
 * Shows Market Entropy gauge, signal feed, and quick actions.
 */

import { useEffect, useState } from 'react';
import EntropyGauge from '../components/EntropyGauge';
import SignalFeed from '../components/SignalFeed';
import StatusBadge from '../components/StatusBadge';
import { getSignals, getCurrentEntropy, seedDemo, triggerPriceDrop } from '../services/api';

export default function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [entropy, setEntropy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, entRes] = await Promise.all([
        getSignals(),
        getCurrentEntropy(),
      ]);
      setSignals(sigRes.data);
      setEntropy(entRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      await fetchData();
    } catch (err) {
      console.error('Failed to seed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerPriceDrop();
      await fetchData();
    } catch (err) {
      console.error('Failed to trigger:', err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
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

      {/* Quick Actions */}
      <div className="flex gap-3 animate-fade-in animate-delay-1">
        <button
          onClick={handleSeed}
          disabled={seeding}
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
          disabled={triggering}
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
        {entropy && (
          <EntropyGauge score={entropy.score} reason={entropy.reason} />
        )}
      </div>

      {/* Agent Status Bar */}
      <div className="card animate-fade-in animate-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-ooda-text-muted)] tracking-wide uppercase">
            Agent Status
          </h2>
          <StatusBadge status="STABLE" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Marketing AI', codename: 'Watcher', color: 'var(--color-agent-marketing)', rep: '1.03' },
            { name: 'Product AI', codename: 'Archaeologist', color: 'var(--color-agent-product)', rep: '0.97' },
            { name: 'Sales AI', codename: 'Hunter', color: 'var(--color-agent-sales)', rep: '1.08' },
            { name: 'Strategy AI', codename: 'General', color: 'var(--color-agent-strategy)', rep: '1.05' },
          ].map((agent) => (
            <div
              key={agent.name}
              className="bg-[var(--color-ooda-surface-elevated)] rounded-lg p-3 border border-[var(--color-ooda-border)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                <span className="text-xs font-semibold" style={{ color: agent.color }}>
                  {agent.codename}
                </span>
              </div>
              <div className="text-[10px] text-[var(--color-ooda-text-dim)]">{agent.name}</div>
              <div className="text-xs font-mono mt-1 text-[var(--color-ooda-text-muted)]">
                Rep: {agent.rep}
              </div>
            </div>
          ))}
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
