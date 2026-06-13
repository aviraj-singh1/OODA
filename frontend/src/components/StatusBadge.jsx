/**
 * StatusBadge — Severity/verdict badge with color coding.
 * Single lookup table maps status → badge class + dot color.
 */

const STATUS_MAP = {
  HIGH:        { badge: 'badge-threat',  dot: 'bg-[var(--color-threat)]'   },
  CRITICAL:    { badge: 'badge-threat',  dot: 'bg-[var(--color-threat)]'   },
  THREAT:      { badge: 'badge-threat',  dot: 'bg-[var(--color-threat)]'   },
  MEDIUM:      { badge: 'badge-warning', dot: 'bg-[var(--color-warning)]'  },
  WARNING:     { badge: 'badge-warning', dot: 'bg-[var(--color-warning)]'  },
  WATCH:       { badge: 'badge-warning', dot: 'bg-[var(--color-warning)]'  },
  LOW:         { badge: 'badge-stable',  dot: 'bg-[var(--color-stable)]'   },
  STABLE:      { badge: 'badge-stable',  dot: 'bg-[var(--color-stable)]'   },
  OPPORTUNITY: { badge: 'badge-stable',  dot: 'bg-[var(--color-stable)]'   },
  NEUTRAL:     { badge: 'badge-neutral', dot: 'bg-[var(--color-neutral)]'  },
};

const DEFAULT_STATUS = { badge: 'badge-neutral', dot: 'bg-[var(--color-neutral)]' };

export default function StatusBadge({ status, size = 'sm' }) {
  const key = status?.toUpperCase();
  const { badge, dot } = STATUS_MAP[key] ?? DEFAULT_STATUS;
  const sizeClass = size === 'lg' ? 'text-sm px-4 py-1.5' : '';

  return (
    <span className={`badge ${badge} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status || 'UNKNOWN'}
    </span>
  );
}
