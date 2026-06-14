/**
 * Rivals — Phase 8: Responsive competitor genome page.
 * Desktop: 2-col grid for genome cards.
 * Mobile: Stacked layout.
 */

import { useEffect, useState, useCallback } from 'react';
import { getCompetitorGenomes } from '../services/api';

const THREAT_COLORS = {
  CRITICAL: 'var(--color-threat)',
  HIGH:     'var(--color-warning)',
  MEDIUM:   '#f59e0b',
  LOW:      'var(--color-stable)',
  DORMANT:  'var(--color-neutral)',
};

function GenomeCard({ genome }) {
  const [open, setOpen] = useState(false);
  const color = THREAT_COLORS[genome.threat_level] || 'var(--color-neutral)';

  return (
    <div
      className="card"
      style={{ borderLeft: `3px solid ${color}`, cursor: 'pointer' }}
      onClick={() => setOpen(!open)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-sm font-bold text-[var(--color-ooda-text)]">{genome.competitor_name}</div>
          <div className="text-[10px] text-[var(--color-ooda-text-dim)]">{genome.category || 'Competitor'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="badge"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}40`,
            }}
          >
            {genome.threat_level}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-1.5 mt-2.5">
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-ooda-accent)]">{genome.total_signals}</span>
          <span className="genome-stat-label">Signals</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-threat)]">{genome.pricing_signals}</span>
          <span className="genome-stat-label">Pricing</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-agent-product)]">{genome.product_signals}</span>
          <span className="genome-stat-label">Product</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-ooda-text-muted)]">{Math.round(genome.activity_score)}</span>
          <span className="genome-stat-label">Activity</span>
        </div>
      </div>

      {/* Latest Move */}
      {genome.latest_move && (
        <div className="mt-2.5 text-xs text-[var(--color-ooda-text-muted)]">
          <span className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold">Latest: </span>
          {genome.latest_move}
        </div>
      )}

      {/* Expanded */}
      {open && (
        <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--color-ooda-border)' }}>
          {/* Price */}
          {genome.current_price && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold min-w-[60px]">Price</span>
              <span className="text-xs font-mono font-bold text-[var(--color-ooda-text)]">{genome.current_price}</span>
              {genome.last_price_change != null && (
                <span className="text-xs font-mono font-bold text-[var(--color-threat)]">
                  ({genome.last_price_change > 0 ? '+' : ''}{genome.last_price_change}%)
                </span>
              )}
            </div>
          )}

          {/* URL */}
          {genome.website_url && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold min-w-[60px]">URL</span>
              <span className="text-xs text-[var(--color-ooda-accent)]">{genome.website_url}</span>
            </div>
          )}

          {/* Behavior */}
          <div className="rounded-lg p-2.5" style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}>
            <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">Behavior Analysis</div>
            <p className="text-xs text-[var(--color-ooda-text-muted)]">
              {genome.pricing_signals > 0 ? 'Aggressive pricing moves detected. ' : ''}
              {genome.product_signals > 0 ? 'Active product development. ' : ''}
              {genome.news_signals > 0 ? 'Gaining media attention. ' : ''}
              {genome.total_signals === 0 ? 'No recent activity detected.' : ''}
              Threat level: {genome.threat_level}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Rivals() {
  const [genomes, setGenomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompetitorGenomes();
      setGenomes(res.data);
    } catch {
      setError('Failed to load competitor data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="animate-fade-in page-header">
        <h1>Rivals</h1>
        <p>Competitor genome profiles — threat assessment & pricing intel</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16"><div className="loading-spinner" /></div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
          <button onClick={fetch} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">Retry →</button>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && genomes.length > 0 && (
        <>
          <div className="responsive-grid-3 animate-fade-in animate-delay-1">
            <div className="card text-center py-2.5">
              <div className="text-base font-black font-mono text-[var(--color-ooda-accent)]">{genomes.length}</div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Tracked</div>
            </div>
            <div className="card text-center py-2.5">
              <div className="text-base font-black font-mono text-[var(--color-threat)]">
                {genomes.filter(g => g.threat_level === 'CRITICAL' || g.threat_level === 'HIGH').length}
              </div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">High Threat</div>
            </div>
            <div className="card text-center py-2.5">
              <div className="text-base font-black font-mono text-[var(--color-ooda-text-muted)]">
                {genomes.reduce((s, g) => s + g.total_signals, 0)}
              </div>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">Signals</div>
            </div>
          </div>

          {/* Genome Cards — responsive grid */}
          <div className="responsive-grid-2">
            {genomes.map((genome, i) => (
              <div key={genome.competitor_id} className="animate-fade-in" style={{ animationDelay: `${(i + 1) * 0.08}s` }}>
                <GenomeCard genome={genome} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty */}
      {!loading && !error && genomes.length === 0 && (
        <div className="card text-center py-12 animate-fade-in">
          <div className="text-3xl mb-3 opacity-30">◎</div>
          <h3 className="text-sm font-semibold text-[var(--color-ooda-text)]">No Competitors Tracked</h3>
          <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2">Seed demo data from the dashboard to begin.</p>
        </div>
      )}
    </div>
  );
}
