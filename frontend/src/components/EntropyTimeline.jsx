/**
 * EntropyTimeline — Visual timeline of entropy score history.
 * Shows score progression with colored dots and mini bar visualization.
 */

function getTimelineColor(score) {
  if (score >= 81) return 'var(--color-threat)';
  if (score >= 61) return 'var(--color-warning)';
  if (score >= 31) return '#f59e0b';
  return 'var(--color-stable)';
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function EntropyTimeline({ history = [] }) {
  if (history.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-[var(--color-ooda-text-dim)] text-sm">
          No entropy history available.
        </p>
      </div>
    );
  }

  const maxScore = Math.max(...history.map((h) => h.score), 1);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-ooda-text-muted)]">
          Entropy Timeline
        </h3>
        <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
          {history.length} snapshots
        </span>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-2 mb-5 h-16">
        {history.map((point, i) => {
          const color = getTimelineColor(point.score);
          const height = Math.max((point.score / 100) * 100, 4);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span
                className="text-[10px] font-mono font-bold"
                style={{ color }}
              >
                {point.score}
              </span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${height}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}44)`,
                  boxShadow: point.score >= 60 ? `0 -4px 12px ${color}30` : 'none',
                  transition: 'height 0.6s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Timeline list */}
      <div className="flex flex-col gap-0">
        {history.map((point, i) => {
          const color = getTimelineColor(point.score);
          const isLast = i === history.length - 1;

          return (
            <div
              key={i}
              className="flex items-start gap-3 pb-4 relative animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Dot + Line */}
              <div className="relative flex-shrink-0">
                <div
                  className="timeline-dot"
                  style={{
                    background: color,
                    borderColor: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }}
                />
                {!isLast && <div className="timeline-line" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color }}
                  >
                    {point.score}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                    {point.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed line-clamp-1">
                  {point.reason}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
                    {formatTimestamp(point.timestamp)}
                  </span>
                  <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
                    {formatDate(point.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
