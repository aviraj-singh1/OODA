/**
 * EntropyBreakdown — Horizontal bar chart showing the 6 entropy components.
 * Each bar represents a component's raw score (0–100) with color-coded fill.
 */

function getBarColor(score) {
  if (score >= 80) return 'var(--color-threat)';
  if (score >= 50) return 'var(--color-warning)';
  if (score >= 25) return '#f59e0b';
  return 'var(--color-stable)';
}

const COMPONENT_ICONS = {
  pricing_shock: '💰',
  news_spike: '📰',
  sentiment_shift: '💬',
  sales_risk: '📉',
  product_velocity: '🚀',
  source_reliability: '🛡️',
};

export default function EntropyBreakdown({ components = {} }) {
  // Support both direct object and array format
  const entries = Array.isArray(components)
    ? components
    : Object.entries(components).map(([key, score]) => ({
        key,
        label: key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        score,
        weight: null,
      }));

  if (entries.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-ooda-text-muted)]">
          Component Breakdown
        </h3>
        <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
          6 factors
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((comp, i) => {
          const score = typeof comp === 'object' ? comp.score : comp;
          const label = comp.label || comp.key;
          const key = comp.key || String(i);
          const icon = COMPONENT_ICONS[key] || '📊';
          const color = getBarColor(score);
          const weight = comp.weight;

          return (
            <div key={key} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-[var(--color-ooda-text)]">
                    {label}
                  </span>
                  {weight != null && (
                    <span className="text-[10px] text-[var(--color-ooda-text-dim)] font-mono">
                      ×{weight}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color }}
                >
                  {Math.round(score)}
                </span>
              </div>

              <div className="entropy-bar-track">
                <div
                  className="entropy-bar-fill h-full rounded"
                  style={{
                    width: `${Math.min(score, 100)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    boxShadow: score >= 60 ? `0 0 8px ${color}40` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
