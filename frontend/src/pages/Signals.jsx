/**
 * Signals — Full signal list page with error state.
 */

import { useEffect, useState, useCallback } from 'react';
import SignalFeed from '../components/SignalFeed';
import { getSignals } from '../services/api';

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSignals();
      setSignals(res.data);
    } catch (err) {
      setError('Failed to load signals. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          📡 <span>Signal Intelligence</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          All detected competitor signals — newest first
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="loading-spinner" />
          </div>
        )}
        {error && (
          <div className="card border-[var(--color-threat)]">
            <p className="text-sm text-[var(--color-threat)]">⚠ {error}</p>
            <button
              onClick={fetchSignals}
              className="mt-2 text-xs text-[var(--color-ooda-accent)] hover:underline"
            >
              Retry →
            </button>
          </div>
        )}
        {!loading && !error && <SignalFeed signals={signals} />}
      </div>
    </div>
  );
}
