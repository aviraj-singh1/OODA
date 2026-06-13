/**
 * EntropyPage — Dedicated entropy analysis deep-dive.
 * Shows full EntropyGauge, component breakdown, and timeline history.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntropyGauge from '../components/EntropyGauge';
import EntropyBreakdown from '../components/EntropyBreakdown';
import EntropyTimeline from '../components/EntropyTimeline';
import { getCurrentEntropy, getEntropyComponents, getEntropyHistory } from '../services/api';

export default function EntropyPage() {
  const [entropy, setEntropy] = useState(null);
  const [components, setComponents] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entRes, compRes, histRes] = await Promise.all([
        getCurrentEntropy(),
        getEntropyComponents(),
        getEntropyHistory(),
      ]);
      setEntropy(entRes.data);
      setComponents(compRes.data);
      setHistory(histRes.data);
    } catch (err) {
      setError('Failed to load entropy data. Check backend connection.');
      console.error('Entropy fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-[var(--color-ooda-accent)] hover:underline mb-3 inline-block"
        >
          ← Back to Command Center
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          🔥 <span>Entropy Analysis</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          Deep-dive into market volatility factors and historical trends
        </p>
      </div>

      {/* Error */}
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Entropy Gauge */}
          <div className="animate-fade-in animate-delay-1">
            {entropy && (
              <EntropyGauge score={entropy.score} reason={entropy.reason} />
            )}
          </div>

          {/* Metadata */}
          {entropy && (
            <div className="flex gap-3 animate-fade-in animate-delay-2">
              <div className="card flex-1 text-center py-3">
                <div className="text-lg font-bold font-mono text-[var(--color-ooda-accent)]">
                  {entropy.signal_count}
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                  Signals Analyzed
                </div>
              </div>
              <div className="card flex-1 text-center py-3">
                <div className="text-lg font-bold font-mono text-[var(--color-ooda-text-muted)]">
                  {entropy.window_hours}h
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                  Look-back Window
                </div>
              </div>
            </div>
          )}

          {/* Component Breakdown */}
          <div className="animate-fade-in animate-delay-3">
            {components && (
              <EntropyBreakdown components={components.components} />
            )}
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
