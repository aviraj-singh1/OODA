/**
 * EntropyPage — Phase 8: Responsive entropy deep-dive.
 * Desktop: Gauge + stats side-by-side, breakdown + timeline side-by-side.
 * Mobile: Stacked layout.
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
      <div className="animate-fade-in page-header">
        <button
          onClick={() => navigate('/')}
          className="text-[10px] text-[var(--color-ooda-accent)] font-bold hover:underline mb-2 inline-block mobile-only"
        >
          ← Back to Dashboard
        </button>
        <h1>Entropy Analysis</h1>
        <p>Market volatility breakdown and historical trends</p>
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
          {/* Gauge + Metadata — side by side on desktop */}
          <div className="responsive-split animate-fade-in animate-delay-1">
            {/* Gauge */}
            {entropy && (
              <EntropyGauge score={entropy.score} reason={entropy.reason} />
            )}

            {/* Metadata */}
            {entropy && (
              <div className="flex flex-col gap-3">
                <div className="responsive-grid-2">
                  <div className="card text-center py-3">
                    <div className="text-xl font-black font-mono text-[var(--color-ooda-accent)]">{entropy.signal_count}</div>
                    <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mt-0.5">Signals Analyzed</div>
                  </div>
                  <div className="card text-center py-3">
                    <div className="text-xl font-black font-mono text-[var(--color-ooda-text-muted)]">{entropy.window_hours}h</div>
                    <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mt-0.5">Time Window</div>
                  </div>
                </div>
                {entropy.status && (
                  <div className="card text-center py-3">
                    <div className="text-sm font-black uppercase tracking-wider"
                      style={{
                        color: entropy.score >= 81 ? 'var(--color-threat)'
                             : entropy.score >= 61 ? 'var(--color-warning)'
                             : entropy.score >= 31 ? '#f59e0b'
                             : 'var(--color-stable)'
                      }}>
                      {entropy.status}
                    </div>
                    <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mt-0.5">Market Status</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Breakdown + Timeline — side by side on desktop */}
          <div className="responsive-split">
            <div className="animate-fade-in animate-delay-3">
              {components && <EntropyBreakdown components={components.components} />}
            </div>
            <div className="animate-fade-in animate-delay-4">
              <EntropyTimeline history={history} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
