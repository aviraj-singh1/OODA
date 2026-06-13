/**
 * AssetCard — Placeholder for Phase 5.
 */

export default function AssetCard({ title, icon, status }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-2xl">{icon || '📄'}</span>
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title || 'Asset'}</h4>
        <p className="text-xs text-[var(--color-ooda-text-dim)]">{status || 'Pending'}</p>
      </div>
    </div>
  );
}
