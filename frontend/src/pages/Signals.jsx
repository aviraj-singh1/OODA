/**
 * Signals — Phase 6: Full signal list with proper states.
 */

import { useEffect, useState, useCallback } from 'react';
import SignalFeed from '../components/SignalFeed';
import { getSignals } from '../services/api';

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSignals();
      setSignals(res.data);
    } catch {
      setError('Failed to load signals. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-lg font-black tracking-tight">Signal Intelligence</h1>
        <p className="text-[11px] text-[var(--color-ooda-text-dim)] mt-0.5">
          All detected competitor signals — newest first
        </p>
      </div>

      {/* Signal Count */}
      {!loading && !error && signals.length > 0 && (
        <div className="flex gap-2 animate-fade-in animate-delay-1">
          <div className="card flex-1 text-center py-2.5">
            <div className="text-base font-black font-mono text-[var(--color-ooda-accent)]">{signals.length}</div>
            <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Total</div>
          </div>
          <div className="card flex-1 text-center py-2.5">
            <div className="text-base font-black font-mono text-[var(--color-threat)]">
              {signals.filter(s => s.severity === 'HIGH').length}
            </div>
            <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">High</div>
          </div>
          <div className="card flex-1 text-center py-2.5">
            <div className="text-base font-black font-mono text-[var(--color-ooda-text-muted)]">
              {[...new Set(signals.map(s => s.competitor_name || s.competitor_id))].length}
            </div>
            <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Sources</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
          <button onClick={fetch} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">
            Retry →
          </button>
        </div>
      )}

      {/* Signal List */}
      {!loading && !error && (
        <div className="animate-fade-in animate-delay-2">
          <SignalFeed signals={signals} />
        </div>
      )}
    </div>
  );
}
