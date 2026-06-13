/**
 * CounterStrike — Phase 6: Polished Counter-Strike build + deploy page.
 * Shows package status, 5 expandable asset cards, deploy button, deployment log.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLatestSignal, buildCounterStrike, getLatestPackage, deployPackage,
} from '../services/api';

const ASSETS = [
  { key: 'retention_email',   icon: '✉',  label: 'Retention Email',   fields: ['subject', 'preview', 'body', 'tone', 'target_segment'] },
  { key: 'battlecard',        icon: '⚔',  label: 'Sales Battlecard',  fields: ['situation', 'primary_objection', 'recommended_response', 'talking_points', 'do_not_say', 'battle_position'] },
  { key: 'social_response',   icon: '📱', label: 'Social Response',   fields: ['platform', 'post_type', 'draft', 'tone', 'hashtags'] },
  { key: 'internal_alert',    icon: '🔔', label: 'Internal Alert',    fields: ['channel', 'priority', 'title', 'message', 'action_items'] },
  { key: 'comparison_report', icon: '📊', label: 'Comparison Report', fields: ['title', 'summary', 'sections'] },
];

function AssetDetail({ asset, config }) {
  if (!asset) return <p className="text-xs text-[var(--color-ooda-text-dim)]">Not generated yet</p>;

  return (
    <div className="flex flex-col gap-2">
      {config.fields.map(field => {
        const val = asset[field];
        if (val == null || val === '') return null;

        // Array fields
        if (Array.isArray(val)) {
          return (
            <div key={field}>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">
                {field.replace(/_/g, ' ')}
              </div>
              {val.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-0.5">
                  <span className="text-[var(--color-ooda-accent)] text-[10px]">•</span>
                  <span className="text-xs text-[var(--color-ooda-text-muted)]">
                    {typeof item === 'object' ? (item.heading ? `${item.heading}: ${item.content}` : JSON.stringify(item)) : item}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        // Long text fields (body, draft, message, situation)
        if (typeof val === 'string' && val.length > 80) {
          return (
            <div key={field}>
              <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-1">
                {field.replace(/_/g, ' ')}
              </div>
              <div
                className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed p-2.5 rounded-lg whitespace-pre-wrap"
                style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
              >
                {val}
              </div>
            </div>
          );
        }

        // Short text
        return (
          <div key={field} className="flex items-start gap-2">
            <span className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider min-w-[60px]">
              {field.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-[var(--color-ooda-text)] font-medium">{val}</span>
          </div>
        );
      })}
    </div>
  );
}

function AssetCard({ asset, config }) {
  const [open, setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const hasData = asset != null;

  const handleCopy = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(JSON.stringify(asset, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Preview text
  let preview = '';
  if (hasData) {
    preview = asset.subject || asset.situation || asset.draft || asset.title || asset.summary || '';
    if (preview.length > 80) preview = preview.slice(0, 80) + '...';
  }

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{config.icon}</span>
          <div>
            <div className="text-xs font-bold text-[var(--color-ooda-text)]">{config.label}</div>
            {!open && preview && (
              <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-0.5 line-clamp-1">{preview}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <button onClick={handleCopy} className="text-[9px] text-[var(--color-ooda-accent)] font-bold hover:underline">
              {copied ? '✓' : 'Copy'}
            </button>
          )}
          <span className="text-[10px] text-[var(--color-ooda-text-dim)]">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && hasData && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-ooda-border)' }}>
          <AssetDetail asset={asset} config={config} />
        </div>
      )}
    </div>
  );
}

export default function CounterStrike() {
  const [signal, setSignal]       = useState(null);
  const [pkg, setPkg]             = useState(null);
  const [assets, setAssets]       = useState(null);
  const [building, setBuilding]   = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load existing data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sigRes = await getLatestSignal();
      setSignal(sigRes.data);

      try {
        const pkgRes = await getLatestPackage();
        if (pkgRes.data?.package) {
          setPkg(pkgRes.data.package);
          setAssets(pkgRes.data.assets);
        }
      } catch {}
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBuild = async () => {
    if (!signal?.id) return;
    setBuilding(true);
    setError(null);
    try {
      const res = await buildCounterStrike(signal.id, !!pkg);
      setPkg(res.data.package);
      setAssets(res.data.assets);
      setDeployLog(null);
      showToast('⚡ Counter-Strike package built');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Build failed';
      setError(detail);
      showToast(detail, 'error');
    } finally {
      setBuilding(false);
    }
  };

  const handleDeploy = async () => {
    if (!pkg?.id) return;
    setDeploying(true);
    try {
      const res = await deployPackage(pkg.id);
      setPkg(p => ({ ...p, status: 'DEPLOYED', deployed: 1 }));
      setDeployLog(res.data);
      showToast('✓ Counter-Strike deployed (simulated)');
    } catch (err) {
      showToast('Deploy failed', 'error');
    } finally {
      setDeploying(false);
    }
  };

  const isDeployed = pkg?.status === 'DEPLOYED' || pkg?.deployed === 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-lg font-black tracking-tight">Counter-Strike</h1>
        <p className="text-[11px] text-[var(--color-ooda-text-dim)] mt-0.5">
          Generated response package — ready to deploy
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16"><div className="loading-spinner" /></div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
          <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-1">
            Run the debate engine first, then build Counter-Strike.
          </p>
          <button onClick={() => navigate('/debate')} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">
            Go to Debate →
          </button>
        </div>
      )}

      {!loading && (
        <>
          {/* Status Card */}
          {pkg ? (
            <div
              className="card animate-fade-in animate-delay-1"
              style={{
                borderColor: isDeployed ? 'rgba(0,230,118,0.3)' : 'rgba(0,212,255,0.2)',
                background: isDeployed
                  ? 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,230,118,0.04))'
                  : 'var(--color-ooda-surface)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-[var(--color-ooda-text)]">{pkg.title || 'Counter-Strike Package'}</div>
                  <div className="text-[10px] text-[var(--color-ooda-text-dim)] mt-0.5">
                    {signal?.competitor_name} · {signal?.signal_type?.replace(/_/g, ' ')}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    background: isDeployed ? 'rgba(0,230,118,0.1)' : 'rgba(0,212,255,0.1)',
                    color: isDeployed ? 'var(--color-stable)' : 'var(--color-ooda-accent)',
                    border: `1px solid ${isDeployed ? 'rgba(0,230,118,0.25)' : 'rgba(0,212,255,0.25)'}`,
                  }}
                >
                  {isDeployed ? '✓ Deployed' : '◯ Ready'}
                </span>
              </div>

              {/* Quick stats */}
              <div className="flex gap-2 mb-3">
                <div className="genome-stat flex-1">
                  <span className="genome-stat-value text-[var(--color-ooda-accent)]">5</span>
                  <span className="genome-stat-label">Assets</span>
                </div>
                <div className="genome-stat flex-1">
                  <span className="genome-stat-value text-[var(--color-threat)]">{pkg.threat_level || 'HIGH'}</span>
                  <span className="genome-stat-label">Threat</span>
                </div>
                <div className="genome-stat flex-1">
                  <span className="genome-stat-value" style={{ color: isDeployed ? 'var(--color-stable)' : 'var(--color-warning)' }}>
                    {isDeployed ? 'LIVE' : 'READY'}
                  </span>
                  <span className="genome-stat-label">Status</span>
                </div>
              </div>

              {/* Build / Deploy buttons */}
              <div className="flex gap-2">
                <button onClick={handleBuild} disabled={building} className="btn-outline flex-1 text-[11px]">
                  {building ? '...' : '⟳ Rebuild'}
                </button>
                {!isDeployed && (
                  <button onClick={handleDeploy} disabled={deploying} className="btn-primary flex-1 text-[11px]">
                    {deploying ? '...' : '⚡ Deploy Counter-Strike'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* No package yet */
            <div className="card text-center py-10 animate-fade-in animate-delay-1">
              <div className="text-3xl mb-3 opacity-30">⚡</div>
              <h3 className="text-sm font-bold text-[var(--color-ooda-text)]">No Package Yet</h3>
              <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
                Run the debate engine first, then build a Counter-Strike response package.
              </p>
              <div className="flex gap-2 mt-4 justify-center">
                <button onClick={() => navigate('/debate')} className="btn-outline text-[11px]">
                  ⚖ Go to Debate
                </button>
                <button onClick={handleBuild} disabled={building || !signal} className="btn-primary text-[11px]">
                  {building ? '...' : '⚡ Build Now'}
                </button>
              </div>
            </div>
          )}

          {/* Asset Cards */}
          {assets && (
            <>
              <div className="section-label animate-fade-in animate-delay-2">Generated Assets</div>
              {ASSETS.map((config, i) => (
                <div key={config.key} className="animate-fade-in" style={{ animationDelay: `${(i + 2) * 0.06}s` }}>
                  <AssetCard asset={assets[config.key]} config={config} />
                </div>
              ))}
            </>
          )}

          {/* Deployment Log */}
          {deployLog && (
            <>
              <div className="section-label animate-fade-in">Deployment Log</div>
              <div className="card card-stable animate-fade-in">
                <div className="text-[10px] text-[var(--color-stable)] uppercase font-bold tracking-wider mb-2">
                  ✓ Deployment Complete — {deployLog.deployment_mode || 'Simulated'}
                </div>
                {deployLog.actions?.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-[var(--color-stable)] text-[10px] mt-0.5">✓</span>
                    <span className="text-xs text-[var(--color-ooda-text-muted)]">
                      {typeof action === 'string' ? action : action.description || action.action || JSON.stringify(action)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
