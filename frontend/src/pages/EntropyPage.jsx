/**
 * EntropyPage — Phase 6: Clean entropy deep-dive.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntropyGauge from '../components/EntropyGauge';
import EntropyBreakdown from '../components/EntropyBreakdown';
import EntropyTimeline from '../components/EntropyTimeline';
import { getCurrentEntropy, getEntropyComponents, getEntropyHistory } from '../services/api';

export default function EntropyPage() {
  const [entropy, setEntropy]       = useState(null);
  const [components, setComponents] = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, c, h] = await Promise.all([
        getCurrentEntropy(), getEntropyComponents(), getEntropyHistory(),
      ]);
      setEntropy(e.data);
      setComponents(c.data);
      setHistory(h.data);
    } catch {
      setError('Failed to load entropy data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="text-[10px] text-[var(--color-ooda-accent)] font-bold hover:underline mb-2 inline-block"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-lg font-black tracking-tight">Entropy Analysis</h1>
        <p className="text-[11px] text-[var(--color-ooda-text-dim)] mt-0.5">
          Market volatility breakdown and historical trends
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)]">{error}</p>
          <button onClick={fetchData} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">Retry →</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16"><div className="loading-spinner" /></div>
      )}

      {!loading && !error && (
        <>
          {/* Gauge */}
          {entropy && (
            <div className="animate-fade-in animate-delay-1">
              <EntropyGauge score={entropy.score} reason={entropy.reason} />
            </div>
          )}

          {/* Metadata */}
          {entropy && (
            <div className="flex gap-2 animate-fade-in animate-delay-2">
              <div className="card flex-1 text-center py-2.5">
                <div className="text-base font-black font-mono text-[var(--color-ooda-accent)]">{entropy.signal_count}</div>
                <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Signals</div>
              </div>
              <div className="card flex-1 text-center py-2.5">
                <div className="text-base font-black font-mono text-[var(--color-ooda-text-muted)]">{entropy.window_hours}h</div>
                <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Window</div>
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div className="animate-fade-in animate-delay-3">
            {components && <EntropyBreakdown components={components.components} />}
          </div>

          {/* Timeline */}
          <div className="animate-fade-in animate-delay-4">
            <EntropyTimeline history={history} />
          </div>
        </>
      )}
    </div>
  );
}
