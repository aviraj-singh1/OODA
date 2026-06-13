/**
 * SignalFeed — Phase 6: Polished signal cards with value change display.
 * Supports compact mode for dashboard preview.
 */

import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getTypeLabel(type) {
  const labels = {
    price_change: 'Price Change',
    news_mention: 'News',
    feature_launch: 'Feature',
    social_mention: 'Social',
    review_change: 'Review',
    hiring: 'Hiring',
  };
  return labels[type] || type?.replace(/_/g, ' ') || 'Signal';
}

export default function SignalFeed({ signals = [], compact = false, onSignalClick }) {
  const navigate = useNavigate();

  if (signals.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-[var(--color-ooda-text-dim)]">
          No signals detected yet. Seed demo data to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {signals.map((signal, i) => (
        <div
          key={signal.id}
          className={`card animate-fade-in ${signal.severity === 'HIGH' ? 'card-threat' : ''}`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {/* Top row: competitor + type + severity + time */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-bold text-[var(--color-ooda-accent)]">
              {signal.competitor_name || 'Unknown'}
            </span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-medium">
              {getTypeLabel(signal.signal_type)}
            </span>
            <StatusBadge status={signal.severity} />
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono ml-auto">
              {timeAgo(signal.timestamp)}
            </span>
          </div>

          {/* Summary */}
          <p className={`text-[13px] text-[var(--color-ooda-text)] leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>
            {signal.summary}
          </p>

          {/* Value Change Row */}
          {(signal.old_value || signal.new_value) && !compact && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {signal.old_value && (
                <span className="text-xs font-mono text-[var(--color-ooda-text-dim)] line-through">
                  {signal.old_value}
                </span>
              )}
              {signal.old_value && signal.new_value && (
                <span className="text-[var(--color-ooda-text-dim)]">→</span>
              )}
              {signal.new_value && (
                <span className="text-xs font-mono font-bold text-[var(--color-ooda-text)]">
                  {signal.new_value}
                </span>
              )}
              {signal.percentage_change != null && (
                <span
                  className="badge ml-auto"
                  style={{
                    background: signal.percentage_change < 0 ? 'rgba(255,59,59,0.1)' : 'rgba(0,230,118,0.1)',
                    color: signal.percentage_change < 0 ? 'var(--color-threat)' : 'var(--color-stable)',
                    border: `1px solid ${signal.percentage_change < 0 ? 'rgba(255,59,59,0.25)' : 'rgba(0,230,118,0.25)'}`,
                  }}
                >
                  {signal.percentage_change > 0 ? '+' : ''}{signal.percentage_change}%
                </span>
              )}
            </div>
          )}

          {/* Source + Analyze button */}
          {!compact && (
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[10px] text-[var(--color-ooda-text-dim)] capitalize">
                via {signal.source?.replaceAll('_', ' ')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSignalClick) onSignalClick(signal);
                  else navigate('/debate');
                }}
                className="text-[10px] font-bold text-[var(--color-ooda-accent)] hover:underline"
              >
                Analyze →
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
