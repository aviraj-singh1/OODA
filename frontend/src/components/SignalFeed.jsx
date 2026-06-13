/**
 * SignalFeed — List of competitive signals with severity indicators.
 */

import StatusBadge from './StatusBadge';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function getSignalIcon(type) {
  const icons = {
    price_change: '💰',
    news_mention: '📰',
    feature_launch: '🚀',
    review_change: '⭐',
    hiring: '👥',
    social_mention: '📱',
  };
  return icons[type] || '📡';
}

export default function SignalFeed({ signals = [], onSignalClick }) {
  if (signals.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-[var(--color-ooda-text-dim)] text-sm">
          No signals detected. Seed demo data to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {signals.map((signal, i) => (
        <button
          key={signal.id}
          onClick={() => onSignalClick?.(signal)}
          className={`card text-left w-full transition-all hover:bg-[var(--color-ooda-surface-elevated)] animate-fade-in ${
            signal.severity === 'HIGH' ? 'card-threat' : ''
          }`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="text-xl mt-0.5">{getSignalIcon(signal.signal_type)}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium text-[var(--color-ooda-accent)]">
                  {signal.competitor_name || 'Unknown'}
                </span>
                <StatusBadge status={signal.severity} />
              </div>
              <p className="text-sm text-[var(--color-ooda-text)] leading-relaxed line-clamp-2">
                {signal.summary}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[var(--color-ooda-text-dim)] font-mono">
                  {formatTime(signal.timestamp)}
                </span>
                <span className="text-xs text-[var(--color-ooda-text-dim)]">
                  {formatDate(signal.timestamp)}
                </span>
                <span className="text-xs text-[var(--color-ooda-text-dim)] capitalize">
                  {signal.source?.replaceAll('_', ' ')}
                </span>
              </div>
            </div>

            {/* Percentage change — use != null to correctly show 0% changes */}
            {signal.percentage_change != null && (
              <div className="text-right flex-shrink-0">
                <span
                  className="text-lg font-bold font-mono"
                  style={{
                    color: signal.percentage_change < 0 ? 'var(--color-threat)' : 'var(--color-stable)',
                  }}
                >
                  {signal.percentage_change > 0 ? '+' : ''}
                  {signal.percentage_change}%
                </span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
