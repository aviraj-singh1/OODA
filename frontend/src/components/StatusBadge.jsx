/**
 * StatusBadge — Severity/verdict badge with color coding.
 */

export default function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    HIGH: 'badge-threat',
    CRITICAL: 'badge-threat',
    THREAT: 'badge-threat',
    MEDIUM: 'badge-warning',
    WARNING: 'badge-warning',
    WATCH: 'badge-warning',
    LOW: 'badge-stable',
    STABLE: 'badge-stable',
    OPPORTUNITY: 'badge-stable',
    NEUTRAL: 'badge-neutral',
  };

  const dotColor = {
    HIGH: 'bg-[var(--color-threat)]',
    CRITICAL: 'bg-[var(--color-threat)]',
    THREAT: 'bg-[var(--color-threat)]',
    MEDIUM: 'bg-[var(--color-warning)]',
    WARNING: 'bg-[var(--color-warning)]',
    WATCH: 'bg-[var(--color-warning)]',
    LOW: 'bg-[var(--color-stable)]',
    STABLE: 'bg-[var(--color-stable)]',
    OPPORTUNITY: 'bg-[var(--color-stable)]',
    NEUTRAL: 'bg-[var(--color-neutral)]',
  };

  const badgeClass = styles[status?.toUpperCase()] || 'badge-neutral';
  const dot = dotColor[status?.toUpperCase()] || 'bg-[var(--color-neutral)]';
  const sizeClass = size === 'lg' ? 'text-sm px-4 py-1.5' : '';

  return (
    <span className={`badge ${badgeClass} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status || 'UNKNOWN'}
    </span>
  );
}
