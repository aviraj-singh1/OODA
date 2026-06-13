/**
 * AssetCard — Phase 5: Standalone asset card component.
 * Re-exports a compact asset card for use outside CounterStrike page.
 *
 * For the full expand/collapse experience, see CounterStrike.jsx which
 * has the detailed asset cards inline.
 */

const ASSET_ICONS = {
  retention_email: '✉️',
  battlecard: '⚔️',
  social_response: '📱',
  internal_alert: '🔔',
  comparison_report: '📊',
};

const ASSET_LABELS = {
  retention_email: 'Retention Email',
  battlecard: 'Sales Battlecard',
  social_response: 'Social Response',
  internal_alert: 'Internal Alert',
  comparison_report: 'Comparison Report',
};

export default function AssetCard({ assetKey, title, status, onClick }) {
  const icon = ASSET_ICONS[assetKey] || '📄';
  const label = title || ASSET_LABELS[assetKey] || 'Asset';
  const displayStatus = status || 'Pending';
  const isReady = displayStatus === 'READY' || displayStatus === 'Generated';

  return (
    <div
      className="card flex items-center gap-3"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[var(--color-ooda-text)]">{label}</h4>
        <p className="text-xs text-[var(--color-ooda-text-dim)]">{displayStatus}</p>
      </div>
      {isReady && (
        <span
          className="badge"
          style={{
            background: 'rgba(0,230,118,0.10)',
            color: 'var(--color-stable)',
            border: '1px solid rgba(0,230,118,0.2)',
            fontSize: '0.55rem',
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}
