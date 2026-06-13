/**
 * CompetitorGenomeCard — Rich competitor profile card showing genome intelligence.
 * Displays threat level, activity score, signal breakdown, pricing intel, and latest move.
 */

import StatusBadge from './StatusBadge';

const THREAT_COLORS = {
  CRITICAL: 'var(--color-threat)',
  HIGH: 'var(--color-warning)',
  MEDIUM: '#f59e0b',
  LOW: 'var(--color-stable)',
  DORMANT: 'var(--color-neutral)',
};

const THREAT_CSS = {
  CRITICAL: 'threat-critical',
  HIGH: 'threat-high',
  MEDIUM: 'threat-medium',
  LOW: 'threat-low',
  DORMANT: 'threat-dormant',
};

function ActivityRing({ score, color }) {
  const RADIUS = 18;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke="var(--color-ooda-border)"
        strokeWidth="3"
      />
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
        style={{
          transition: 'stroke-dashoffset 1s ease',
          filter: `drop-shadow(0 0 4px ${color}60)`,
        }}
      />
      <text
        x="24" y="26"
        textAnchor="middle"
        fill={color}
        style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const days = Math.floor(diffHrs / 24);
  return `${days}d ago`;
}

export default function CompetitorGenomeCard({ genome }) {
  if (!genome) return null;

  const threatColor = THREAT_COLORS[genome.threat_level] || 'var(--color-neutral)';
  const threatCss = THREAT_CSS[genome.threat_level] || 'threat-dormant';

  return (
    <div className={`card threat-indicator ${threatCss}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Activity Ring */}
        <ActivityRing score={genome.activity_score} color={threatColor} />

        {/* Name & Category */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{genome.competitor_name}</h3>
          <p className="text-xs text-[var(--color-ooda-text-dim)] truncate">
            {genome.category || 'Uncategorized'}
          </p>
        </div>

        {/* Threat Badge */}
        <StatusBadge status={genome.threat_level} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-ooda-accent)]">
            {genome.total_signals}
          </span>
          <span className="genome-stat-label">Signals</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-threat)]">
            {genome.pricing_signals}
          </span>
          <span className="genome-stat-label">Pricing</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-agent-product)]">
            {genome.product_signals}
          </span>
          <span className="genome-stat-label">Product</span>
        </div>
        <div className="genome-stat">
          <span className="genome-stat-value text-[var(--color-agent-marketing)]">
            {genome.news_signals}
          </span>
          <span className="genome-stat-label">News</span>
        </div>
      </div>

      {/* Pricing Intel */}
      {genome.current_price && (
        <div className="bg-[var(--color-ooda-surface-elevated)] rounded-lg p-3 mb-3 border border-[var(--color-ooda-border)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
                Current Price
              </span>
              <div className="text-sm font-bold font-mono text-[var(--color-ooda-text)]">
                {genome.current_price}
              </div>
            </div>
            {genome.last_price_change != null && (
              <span
                className="text-lg font-bold font-mono"
                style={{
                  color: genome.last_price_change < 0 ? 'var(--color-threat)' : 'var(--color-stable)',
                }}
              >
                {genome.last_price_change > 0 ? '+' : ''}
                {genome.last_price_change}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Latest Move */}
      {genome.latest_move && (
        <div className="border-t border-[var(--color-ooda-border)] pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
              Latest Move
            </span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
              {formatTimeAgo(genome.latest_move_time)}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed line-clamp-2">
            {genome.latest_move}
          </p>
        </div>
      )}

      {/* Website Link */}
      {genome.website_url && (
        <div className="mt-3 pt-3 border-t border-[var(--color-ooda-border)]">
          <a
            href={genome.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-ooda-accent)] hover:underline"
          >
            Visit website →
          </a>
        </div>
      )}
    </div>
  );
}
