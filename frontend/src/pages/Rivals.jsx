/**
 * Rivals — Competitor genome intelligence page.
 * Phase 2: Replaced basic list with rich CompetitorGenomeCard cards
 * fetched from the /genomes API.
 */

import { useEffect, useState, useCallback } from 'react';
import CompetitorGenomeCard from '../components/CompetitorGenomeCard';
import { getCompetitorGenomes } from '../services/api';

export default function Rivals() {
  const [genomes, setGenomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGenomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompetitorGenomes();
      setGenomes(res.data);
    } catch (err) {
      setError('Failed to load competitor genome data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          👁️ <span>Rivals</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          Competitive genome profiles — threat level, activity, and pricing intel
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="loading-spinner" />
          </div>
        )}

        {error && (
          <div className="card" style={{ borderColor: 'var(--color-threat)' }}>
            <p className="text-sm text-[var(--color-threat)]">⚠ {error}</p>
            <button
              onClick={fetchGenomes}
              className="mt-2 text-xs text-[var(--color-ooda-accent)] hover:underline"
            >
              Retry →
            </button>
          </div>
        )}

        {!loading && !error && genomes.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-[var(--color-ooda-text-dim)] text-sm">
              No competitors tracked yet. Seed demo data first.
            </p>
          </div>
        )}

        {!loading && !error && genomes.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Summary Stats */}
            <div className="flex gap-3">
              <div className="card flex-1 text-center py-3">
                <div className="text-lg font-bold font-mono text-[var(--color-ooda-accent)]">
                  {genomes.length}
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                  Tracked
                </div>
              </div>
              <div className="card flex-1 text-center py-3">
                <div className="text-lg font-bold font-mono text-[var(--color-threat)]">
                  {genomes.filter((g) => g.threat_level === 'CRITICAL' || g.threat_level === 'HIGH').length}
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                  High Threat
                </div>
              </div>
              <div className="card flex-1 text-center py-3">
                <div className="text-lg font-bold font-mono text-[var(--color-ooda-text-muted)]">
                  {genomes.reduce((sum, g) => sum + g.total_signals, 0)}
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                  Total Signals
                </div>
              </div>
            </div>

            {/* Genome Cards */}
            {genomes.map((genome, i) => (
              <div
                key={genome.competitor_id}
                className="animate-fade-in"
                style={{ animationDelay: `${(i + 1) * 0.1}s` }}
              >
                <CompetitorGenomeCard genome={genome} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
