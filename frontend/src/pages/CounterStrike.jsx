/**
 * CounterStrike — Phase 5: Full Counter-Strike package page.
 *
 * Flow:
 *   1. Build Counter-Strike (calls full pipeline: agents -> debate -> assets)
 *   2. View generated assets (email, battlecard, social, alert, comparison)
 *   3. Deploy (simulated)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  buildCounterStrike,
  getLatestPackage,
  deployPackage,
  getLatestSignal,
} from '../services/api';

// ── Styling constants ──────────────────────────────────────────────────────────

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

const VERDICT_COLORS = {
  THREAT: { color: 'var(--color-threat)', bg: 'rgba(255,59,59,0.10)', border: 'rgba(255,59,59,0.3)' },
  OPPORTUNITY: { color: 'var(--color-stable)', bg: 'rgba(0,230,118,0.10)', border: 'rgba(0,230,118,0.3)' },
  NEUTRAL: { color: 'var(--color-neutral)', bg: 'rgba(132,146,166,0.10)', border: 'rgba(132,146,166,0.3)' },
};

// ── Copy Helper ────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="text-[10px] px-2 py-1 rounded-md"
      style={{
        background: copied ? 'rgba(0,230,118,0.15)' : 'var(--color-ooda-surface-elevated)',
        color: copied ? 'var(--color-stable)' : 'var(--color-ooda-text-dim)',
        border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'var(--color-ooda-border)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

// ── Asset Detail Cards (PRD §14) ───────────────────────────────────────────────

function EmailAssetCard({ data }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">Subject Line</div>
        <CopyButton text={data.body || ''} />
      </div>
      <div className="text-sm font-semibold text-[var(--color-ooda-text)]">{data.subject}</div>

      {data.preview && (
        <div className="text-xs text-[var(--color-ooda-text-muted)] italic">{data.preview}</div>
      )}

      <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-2">Email Body</div>
      <div
        className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed whitespace-pre-line rounded-lg p-3"
        style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
      >
        {data.body}
      </div>

      <div className="flex items-center gap-4 mt-1">
        <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
          Tone: <span className="text-[var(--color-ooda-text-muted)] font-medium">{data.tone}</span>
        </span>
        <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
          Segment: <span className="text-[var(--color-ooda-accent)] font-medium">{data.target_segment}</span>
        </span>
      </div>
    </div>
  );
}

function BattlecardAssetCard({ data }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[var(--color-ooda-text)]">{data.title}</div>
        <CopyButton text={`${data.primary_objection}\n\nResponse: ${data.recommended_response}\n\nTalking Points:\n${(data.talking_points || []).map(p => `- ${p}`).join('\n')}`} />
      </div>

      {data.situation && (
        <div className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{data.situation}</div>
      )}

      {data.primary_objection && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.15)' }}>
          <div className="text-[10px] text-[var(--color-threat)] uppercase tracking-wider font-semibold mb-1">Primary Objection</div>
          <div className="text-xs text-[var(--color-ooda-text-muted)] italic">"{data.primary_objection}"</div>
        </div>
      )}

      {data.recommended_response && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
          <div className="text-[10px] text-[var(--color-stable)] uppercase tracking-wider font-semibold mb-1">Recommended Response</div>
          <div className="text-xs text-[var(--color-ooda-text-muted)]">{data.recommended_response}</div>
        </div>
      )}

      {data.talking_points?.length > 0 && (
        <div className="mt-1">
          <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1.5">Talking Points</div>
          <ul className="flex flex-col gap-1">
            {data.talking_points.map((pt, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-ooda-accent)] mt-0.5">•</span>
                <span className="text-xs text-[var(--color-ooda-text-muted)]">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.do_not_say?.length > 0 && (
        <div className="mt-1">
          <div className="text-[10px] text-[var(--color-threat)] uppercase tracking-wider font-semibold mb-1.5">Do Not Say</div>
          <ul className="flex flex-col gap-1">
            {data.do_not_say.map((pt, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-threat)] mt-0.5">✕</span>
                <span className="text-xs text-[var(--color-ooda-text-muted)]">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.battle_position && (
        <div
          className="rounded-lg p-3 mt-1"
          style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
        >
          <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1">Battle Position</div>
          <p className="text-xs text-[var(--color-ooda-text)] font-medium">{data.battle_position}</p>
        </div>
      )}
    </div>
  );
}

function SocialAssetCard({ data }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ooda-accent)' }}>
            {data.platform}
          </span>
          <span className="badge" style={{ background: 'rgba(0,212,255,0.10)', color: 'var(--color-ooda-accent)', border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.6rem' }}>
            {data.post_type}
          </span>
        </div>
        <CopyButton text={data.draft || ''} />
      </div>

      <div
        className="rounded-lg p-3"
        style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
      >
        <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed whitespace-pre-line">
          {data.draft}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
          Tone: <span className="text-[var(--color-ooda-text-muted)] font-medium">{data.tone}</span>
        </span>
      </div>

      {data.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,212,255,0.10)', color: 'var(--color-ooda-accent)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertAssetCard({ data }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[var(--color-ooda-text)]">{data.title}</div>
        <div className="flex items-center gap-2">
          <span
            className="badge"
            style={{
              background: data.priority === 'HIGH' ? 'rgba(255,59,59,0.12)' : 'rgba(245,158,11,0.12)',
              color: data.priority === 'HIGH' ? 'var(--color-threat)' : '#f59e0b',
              border: `1px solid ${data.priority === 'HIGH' ? 'rgba(255,59,59,0.3)' : 'rgba(245,158,11,0.3)'}`,
              fontSize: '0.6rem',
            }}
          >
            {data.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[var(--color-ooda-text-dim)]">
        Channel: <span className="font-medium text-[var(--color-ooda-accent)]">#{data.channel}</span>
      </div>

      <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">{data.message}</p>

      {data.action_items?.length > 0 && (
        <div className="mt-1">
          <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mb-1.5">Action Items</div>
          <div className="flex flex-col gap-1.5">
            {data.action_items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg p-2.5"
                style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
              >
                <span className="text-[var(--color-ooda-accent)] font-bold text-xs flex-shrink-0">{i + 1}.</span>
                <span className="text-xs text-[var(--color-ooda-text-muted)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonAssetCard({ data }) {
  if (!data || !data.sections?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[var(--color-ooda-text)]">{data.title}</div>
        <CopyButton text={data.summary || ''} />
      </div>

      {data.summary && (
        <div className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed italic">{data.summary}</div>
      )}

      {data.sections.map((section, si) => (
        <div
          key={si}
          className="rounded-lg p-3"
          style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
        >
          <div className="text-[10px] text-[var(--color-ooda-accent)] uppercase tracking-wider font-semibold mb-1.5">
            {section.heading}
          </div>
          <p className="text-xs text-[var(--color-ooda-text-muted)] leading-relaxed">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Asset Card (PRD §14 — expand/collapse) ─────────────────────────────────────

function AssetCard({ assetKey, assetData, isExpanded, onToggle }) {
  const icon = ASSET_ICONS[assetKey] || '📄';
  const label = ASSET_LABELS[assetKey] || assetKey;
  const hasData = assetData && Object.keys(assetData).length > 0;

  // Get short preview text for collapsed state
  const getPreview = () => {
    if (!hasData) return 'Not available';
    switch (assetKey) {
      case 'retention_email': return assetData.subject || 'Email generated';
      case 'battlecard': return assetData.primary_objection || 'Battlecard ready';
      case 'social_response': return `${assetData.platform} · ${assetData.post_type}`;
      case 'internal_alert': return `#${assetData.channel} · ${assetData.priority}`;
      case 'comparison_report': return `${(assetData.sections || []).length} sections`;
      default: return 'Generated';
    }
  };

  const renderDetail = () => {
    switch (assetKey) {
      case 'retention_email':    return <EmailAssetCard data={assetData} />;
      case 'battlecard':         return <BattlecardAssetCard data={assetData} />;
      case 'social_response':    return <SocialAssetCard data={assetData} />;
      case 'internal_alert':     return <AlertAssetCard data={assetData} />;
      case 'comparison_report':  return <ComparisonAssetCard data={assetData} />;
      default: return <pre className="text-xs text-[var(--color-ooda-text-dim)] overflow-auto">{JSON.stringify(assetData, null, 2)}</pre>;
    }
  };

  return (
    <div
      id={`asset-${assetKey}`}
      className="card animate-fade-in"
      style={{
        cursor: hasData ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        borderColor: isExpanded ? 'rgba(0,212,255,0.3)' : undefined,
      }}
      onClick={() => hasData && onToggle()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="text-sm font-semibold text-[var(--color-ooda-text)]">{label}</div>
            <div className="text-[10px] text-[var(--color-ooda-text-dim)]">
              {hasData ? getPreview() : 'Not available'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <span className="badge" style={{ background: 'rgba(0,230,118,0.10)', color: 'var(--color-stable)', border: '1px solid rgba(0,230,118,0.2)', fontSize: '0.55rem' }}>
              ✓ READY
            </span>
          )}
          {hasData && (
            <span className="text-[10px] text-[var(--color-ooda-text-dim)]">
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasData && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid var(--color-ooda-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderDetail()}
        </div>
      )}
    </div>
  );
}

// ── Deployment Log ─────────────────────────────────────────────────────────────

function DeploymentLog({ deployResult }) {
  if (!deployResult) return null;
  return (
    <div
      className="card animate-fade-in"
      style={{ borderColor: 'rgba(0,230,118,0.3)', background: 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,230,118,0.04))' }}
    >
      <div className="text-center mb-3">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-sm font-bold text-[var(--color-stable)]">
          {deployResult.message || 'Deployment Complete'}
        </h3>
        <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-1">
          Mode: {deployResult.deployment_mode || 'SIMULATED'}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-[var(--color-ooda-text-muted)]">
        {(deployResult.actions || []).map((action, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[var(--color-stable)]">✓</span>
            <span>{action}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--color-ooda-text-dim)] mt-3 text-center italic">
        Deployment simulated successfully. No real emails or posts sent.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CounterStrike() {
  const [packageResult, setPackageResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [currentSignalId, setCurrentSignalId] = useState(null);
  const [deployResult, setDeployResult] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Try to load existing package on mount
  const loadExisting = useCallback(async () => {
    try {
      const res = await getLatestPackage();
      if (res.data?.package) {
        setPackageResult(res.data);
        setCurrentSignalId(res.data.signal?.id || res.data.package?.signal_id);
      }
    } catch {
      // No package yet — that's fine
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const handleBuild = async (force = false) => {
    setLoading(true);
    setError(null);
    setDeployResult(null);

    try {
      let signalId = currentSignalId;
      if (!signalId) {
        const sigRes = await getLatestSignal();
        signalId = sigRes.data?.id;
        setCurrentSignalId(signalId);
      }

      if (!signalId) {
        setError('No signals found. Seed demo data first from the Dashboard.');
        setLoading(false);
        return;
      }

      const res = await buildCounterStrike(signalId, force);
      setPackageResult(res.data);
      showToast('🎯 Counter-Strike package built! 5 assets generated.');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Failed to build package';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    const pkgId = packageResult?.package?.id;
    if (!pkgId) return;

    setDeploying(true);
    try {
      const res = await deployPackage(pkgId);
      setDeployResult(res.data);
      setPackageResult(prev => ({
        ...prev,
        package: { ...prev.package, status: 'DEPLOYED', deployed: 1 },
      }));
      showToast('✅ Counter-Strike deployed (simulated)! All assets activated.');
    } catch (err) {
      showToast('Failed to deploy package.', 'error');
    } finally {
      setDeploying(false);
    }
  };

  const pkg = packageResult?.package;
  const signal = packageResult?.signal;
  const debateVerdict = packageResult?.debate_verdict;
  const assets = packageResult?.assets || {};
  const isDeployed = pkg?.deployed === 1 || pkg?.status === 'DEPLOYED';
  const verdictStyle = VERDICT_COLORS[debateVerdict?.final_verdict] || VERDICT_COLORS.NEUTRAL;

  const assetKeys = ['retention_email', 'battlecard', 'social_response', 'internal_alert', 'comparison_report'];

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-in max-w-lg mx-auto ${
            toast.type === 'error'
              ? 'bg-[rgba(255,59,59,0.15)] border border-[var(--color-threat)] text-[var(--color-threat)]'
              : 'bg-[rgba(0,230,118,0.12)] border border-[var(--color-stable)] text-[var(--color-stable)]'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header — PRD §14 */}
      <div className="animate-fade-in">
        <h1 id="cs-title" className="text-xl font-bold flex items-center gap-2">
          🎯 <span>Counter-Strike Package</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          AI-generated counter-response packages — build, review, and deploy
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 animate-fade-in animate-delay-1">
        <button
          onClick={() => handleBuild(false)}
          disabled={loading || deploying}
          className="btn-primary flex-1 text-xs"
          id="build-cs-btn"
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14 }} />
              Building...
            </>
          ) : (
            '🎯 Build Counter-Strike'
          )}
        </button>
        {pkg && !isDeployed && (
          <button
            onClick={handleDeploy}
            disabled={loading || deploying}
            className="btn-primary btn-danger flex-1 text-xs"
            id="deploy-cs-btn"
          >
            {deploying ? (
              <>
                <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                Deploying...
              </>
            ) : (
              '🚀 Deploy Counter-Strike'
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">⚠ {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12 animate-fade-in">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-sm text-[var(--color-ooda-text-muted)]">
            Running full Counter-Strike pipeline...
          </p>
          <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
            Agents → Debate → Generate 5 Assets
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !packageResult && !error && (
        <div className="card text-center py-10 animate-fade-in animate-delay-2">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-[var(--color-ooda-text)]">
            Counter-Strike Engine
          </h3>
          <p className="text-sm text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
            Click "Build Counter-Strike" to generate a full response package.
            The engine generates 5 deployable assets based on debate results.
          </p>
        </div>
      )}

      {/* ── Package Results ───────────────────────────────────────────────── */}
      {!loading && packageResult && (
        <>
          {/* Status Banner — PRD §14 top section */}
          <div
            className="card animate-fade-in"
            style={{
              borderColor: isDeployed ? 'rgba(0,230,118,0.4)' : verdictStyle.border,
              background: isDeployed
                ? 'linear-gradient(135deg, var(--color-ooda-surface), rgba(0,230,118,0.06))'
                : `linear-gradient(135deg, var(--color-ooda-surface), ${verdictStyle.bg})`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-[var(--color-ooda-text)]">
                  {pkg?.title || 'Counter-Strike Package'}
                </div>
                <div className="text-[10px] text-[var(--color-ooda-text-dim)] mt-0.5">
                  {signal?.competitor_name} · {signal?.signal_type?.replace('_', ' ')} · {signal?.severity}
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background: isDeployed ? 'rgba(0,230,118,0.15)' : 'rgba(245,158,11,0.15)',
                  color: isDeployed ? 'var(--color-stable)' : '#f59e0b',
                  border: `1px solid ${isDeployed ? 'rgba(0,230,118,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  fontSize: '0.65rem',
                }}
              >
                {isDeployed ? '✓ DEPLOYED' : '◯ READY'}
              </span>
            </div>

            {/* Signal summary */}
            <p className="text-xs text-[var(--color-ooda-text-muted)] mb-3">{signal?.summary}</p>

            {/* Verdict + Stats grid */}
            <div
              className="grid grid-cols-3 gap-3 p-3 rounded-lg"
              style={{ background: 'var(--color-ooda-surface-elevated)', border: '1px solid var(--color-ooda-border)' }}
            >
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: verdictStyle.color }}>
                  {debateVerdict?.final_verdict || '—'}
                </div>
                <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">Verdict</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-mono font-bold text-[var(--color-ooda-text)]">
                  {debateVerdict?.final_confidence ? `${Math.round(debateVerdict.final_confidence * 100)}%` : '—'}
                </div>
                <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-mono font-bold text-[var(--color-ooda-accent)]">
                  {debateVerdict?.market_entropy_score ? Math.round(debateVerdict.market_entropy_score) : '—'}
                </div>
                <div className="text-[9px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold mt-0.5">Entropy</div>
              </div>
            </div>
          </div>

          {/* Deployment Log (after deploy) */}
          {isDeployed && <DeploymentLog deployResult={deployResult} />}

          {/* Section Header: Generated Assets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-widest font-bold">📦</span>
            <span className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider font-semibold">
              Generated Assets ({packageResult.asset_count || 5})
            </span>
            <div className="flex-1" style={{ height: '1px', background: 'var(--color-ooda-border)' }} />
          </div>

          {/* 5 Asset Cards — PRD §14 */}
          {assetKeys.map((key, i) => (
            <div key={key} style={{ animationDelay: `${i * 0.08}s` }}>
              <AssetCard
                assetKey={key}
                assetData={assets[key]}
                isExpanded={expandedAsset === key}
                onToggle={() => setExpandedAsset(expandedAsset === key ? null : key)}
              />
            </div>
          ))}

          {/* Phase footer */}
          <div className="text-center py-3" style={{ borderTop: '1px solid var(--color-ooda-border)' }}>
            <p className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase tracking-wider">
              Phase 5 · Counter-Strike Engine · Deploy Mode: SIMULATED
            </p>
          </div>
        </>
      )}
    </div>
  );
}
