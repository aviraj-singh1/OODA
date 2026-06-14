/**
 * Dashboard — Phase 8: Responsive command center.
 * Desktop: 2-col layout for gauge+alert, horizontal quick actions.
 * Mobile: Stacked layout as before.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntropyGauge from '../components/EntropyGauge';
import SignalFeed from '../components/SignalFeed';
import {
  getSignals, getCurrentEntropy, getReputations,
  seedDemo, triggerPriceDrop,
  getIngestionStatus, runLiveIngestion, runFullDemoFlow,
} from '../services/api';

const AGENT_META = {
  'Marketing AI': { code: 'Watcher',      color: 'var(--color-agent-marketing)' },
  'Product AI':   { code: 'Archaeologist', color: 'var(--color-agent-product)' },
  'Sales AI':     { code: 'Hunter',        color: 'var(--color-agent-sales)' },
  'Strategy AI':  { code: 'General',       color: 'var(--color-agent-strategy)' },
};

export default function Dashboard() {
  const [signals, setSignals]       = useState([]);
  const [entropy, setEntropy]       = useState(null);
  const [reputations, setReputations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [seeding, setSeeding]       = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast]           = useState(null);
  const [showDemo, setShowDemo]     = useState(false);

  // Phase 7 state
  const [ingestionStatus, setIngestionStatus] = useState(null);
  const [scanning, setScanning]     = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [runningFlow, setRunningFlow] = useState(false);
  const [flowResult, setFlowResult] = useState(null);

  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sigRes, entRes, repRes] = await Promise.all([
        getSignals(), getCurrentEntropy(), getReputations(),
      ]);
      setSignals(sigRes.data);
      setEntropy(entRes.data);
      if (repRes.data?.length) setReputations(repRes.data);
    } catch {
      setError('Backend unreachable. Is the server running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIngestionStatus = useCallback(async () => {
    try {
      const res = await getIngestionStatus();
      setIngestionStatus(res.data);
    } catch {
      // Silent fail — ingestion status is optional
    }
  }, []);

  useEffect(() => { fetchData(); fetchIngestionStatus(); }, [fetchData, fetchIngestionStatus]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      await fetchData();
      showToast('✓ Demo data seeded successfully');
    } catch {
      showToast('Failed to seed demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerPriceDrop();
      await fetchData();
      showToast('⚡ RivalFlow price drop detected!');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to trigger', 'error');
    } finally {
      setTriggering(false);
    }
  };

  // Phase 7: Live Scan
  const handleLiveScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await runLiveIngestion();
      setScanResult(res.data);
      await fetchData();
      const count = res.data?.signals_created || 0;
      if (count > 0) {
        showToast(`✓ ${count} live signal${count > 1 ? 's' : ''} found`);
      } else {
        showToast('No live signals found — demo mode fallback still active');
      }
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Live scan failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  // Phase 7: Full OODA Flow
  const handleFullFlow = async () => {
    setRunningFlow(true);
    setFlowResult(null);
    try {
      const res = await runFullDemoFlow();
      setFlowResult(res.data);
      await fetchData();
      showToast('✓ Full OODA flow prepared!');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Full flow failed', 'error');
    } finally {
      setRunningFlow(false);
    }
  };

  const latestHighSignal = signals.find(s => s.severity === 'HIGH');
  const hasSignals = signals.length > 0;
  const entropyScore = entropy?.score || 0;

  // Helper: source status row
  const StatusRow = ({ label, connected }) => (
    <div className="live-intel-row">
      <div className="live-intel-label">
        <span className={`status-dot ${connected ? 'status-dot-connected' : 'status-dot-missing'}`} />
        {label}
      </div>
      <div className="live-intel-value" style={{ color: connected ? 'var(--color-stable)' : 'var(--color-ooda-text-dim)' }}>
        {connected ? 'Connected' : 'Not configured'}
      </div>
    </div>
  );

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
        <div className="flex items-center justify-between">
          <div className="page-header">
            <h1>
              <span className="text-gradient">OODA</span>
              <span className="desktop-only text-[var(--color-ooda-text-dim)] text-sm font-normal ml-3">Command Center</span>
            </h1>
            <p className="text-[11px] text-[var(--color-ooda-text-dim)] font-medium tracking-wider mt-0.5">
              Observe · Orient · Decide · Act
            </p>
          </div>
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="btn-outline text-[10px] py-1.5 px-3"
          >
            {showDemo ? 'Hide' : 'Demo'}
          </button>
        </div>
      </div>

      {/* Demo Controls (collapsible) */}
      {showDemo && (
        <div className="responsive-split animate-fade-in">
          {/* Original Demo Controls */}
          <div className="card" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
            <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider mb-2">
              Demo Controls
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSeed}
                disabled={seeding || triggering || runningFlow}
                className="btn-outline flex-1 text-[11px]"
              >
                {seeding ? '...' : '⟳ Seed Data'}
              </button>
              <button
                onClick={handleTrigger}
                disabled={seeding || triggering || runningFlow}
                className="btn-primary btn-danger flex-1 text-[11px] py-2"
              >
                {triggering ? '...' : '⚡ Price Drop'}
              </button>
            </div>

            {/* Full OODA Flow Button */}
            <div className="mt-3">
              <button
                onClick={handleFullFlow}
                disabled={runningFlow || scanning}
                className="btn-primary w-full text-[11px] py-2.5"
              >
                {runningFlow ? '⏳ Running Full OODA Flow...' : '🚀 Run Full OODA Flow'}
              </button>
              {runningFlow && (
                <div className="progress-bar-track mt-2">
                  <div className="progress-bar-fill" />
                </div>
              )}
            </div>

            {/* Full Flow Result */}
            {flowResult && (
              <div className="result-card result-card-success mt-3 animate-fade-in">
                <div className="text-[10px] uppercase font-bold text-[var(--color-stable)] mb-2">
                  ✓ Flow Complete
                </div>
                <div className="flex flex-col gap-1.5 text-[11px] text-[var(--color-ooda-text-muted)]">
                  <div>Entropy: <span className="font-mono font-bold text-[var(--color-ooda-text)]">{flowResult.entropy_score}</span></div>
                  <div>Agents: {flowResult.agent_verdicts?.length || 0} verdicts</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => navigate('/debate')} className="btn-outline flex-1 text-[10px] py-1.5">
                      View Debate
                    </button>
                    <button onClick={() => navigate('/counter-strike')} className="btn-outline flex-1 text-[10px] py-1.5">
                      Counter-Strike
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Intelligence Panel */}
          <div className="live-intel-panel animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-[var(--color-ooda-text-dim)] uppercase font-bold tracking-wider">
                Live Intelligence
              </div>
              {ingestionStatus && (
                <span className={`badge-source badge-${ingestionStatus.data_mode || 'hybrid'}`}>
                  {ingestionStatus.data_mode || 'hybrid'}
                </span>
              )}
            </div>

            <p className="text-[10px] text-[var(--color-ooda-text-dim)] mb-3 leading-relaxed">
              Live Scan checks configured public sources and converts findings into OODA signals.
            </p>

            {/* Status Rows */}
            {ingestionStatus ? (
              <>
                <StatusRow label="LLM (Ollama)" connected={ingestionStatus.ollama_configured} />
                <StatusRow label="LLM (OpenRouter)" connected={ingestionStatus.openrouter_configured} />
                <StatusRow label="NewsAPI" connected={ingestionStatus.newsapi_configured} />
                <StatusRow label="SerpAPI" connected={ingestionStatus.serpapi_configured} />
                <StatusRow label="GitHub" connected={ingestionStatus.github_configured} />
                <StatusRow label="Web Watcher" connected={ingestionStatus.web_watcher_available} />
              </>
            ) : (
              <div className="text-[11px] text-[var(--color-ooda-text-dim)] py-2">
                Loading status...
              </div>
            )}

            {/* Live Scan Button */}
            <div className="mt-3">
              <button
                onClick={handleLiveScan}
                disabled={scanning || runningFlow}
                className="btn-outline w-full text-[11px]"
              >
                {scanning ? '⏳ Scanning...' : '🔍 Run Live Scan'}
              </button>
              {scanning && (
                <div className="progress-bar-track mt-2">
                  <div className="progress-bar-fill" />
                </div>
              )}
            </div>

            {/* Scan Result */}
            {scanResult && !scanning && (
              <div className="result-card mt-3 animate-fade-in">
                <div className="text-[11px] text-[var(--color-ooda-text-muted)]">
                  {scanResult.signals_created > 0 ? (
                    <span className="text-[var(--color-stable)] font-semibold">
                      ✓ {scanResult.signals_created} live signal{scanResult.signals_created > 1 ? 's' : ''} found
                    </span>
                  ) : (
                    <span>No live signals found — demo mode fallback still active</span>
                  )}
                  {scanResult.warnings?.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-[var(--color-ooda-text-dim)]">
                      {scanResult.warnings.slice(0, 3).map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state if no APIs configured */}
            {ingestionStatus && !ingestionStatus.newsapi_configured && !ingestionStatus.serpapi_configured && !ingestionStatus.github_configured && (
              <div className="text-[10px] text-[var(--color-ooda-text-dim)] mt-2 italic">
                Live sources not configured yet. Demo mode is active.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card card-threat animate-fade-in">
          <p className="text-sm text-[var(--color-threat)] font-medium">{error}</p>
          <button onClick={fetchData} className="text-xs text-[var(--color-ooda-accent)] mt-2 hover:underline">
            Retry →
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Entropy + Active Alert — side by side on desktop */}
          <div className="responsive-split animate-fade-in animate-delay-1">
            {/* Entropy Gauge */}
            <EntropyGauge score={entropyScore} reason={entropy?.reason || ''} status={entropy?.status} />

            {/* Active Alert OR Agent Grid */}
            <div className="flex flex-col gap-3">
              {latestHighSignal && (
                <button
                  onClick={() => navigate('/signals')}
                  className="card card-threat w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-threat)] pulse-dot flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-[var(--color-threat)] uppercase font-bold tracking-wider">
                        Active Alert
                      </div>
                      <p className="text-sm text-[var(--color-ooda-text)] font-medium mt-0.5 line-clamp-2">
                        {latestHighSignal.summary}
                      </p>
                    </div>
                    {latestHighSignal.percentage_change != null && (
                      <span className="text-lg font-black font-mono text-[var(--color-threat)] flex-shrink-0">
                        {latestHighSignal.percentage_change}%
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Agent Grid */}
              {reputations.length > 0 && (
                <div>
                  <div className="section-label mb-2">Agents Online</div>
                  <div className="responsive-grid-4">
                    {reputations.slice(0, 4).map((rep) => {
                      const meta = AGENT_META[rep.agent_name] || { code: '—', color: 'var(--color-neutral)' };
                      return (
                        <div
                          key={rep.agent_name}
                          className="rounded-xl p-2.5 text-center border border-[var(--color-ooda-border)]"
                          style={{ background: 'var(--color-ooda-surface)' }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mx-auto mb-1.5 pulse-dot"
                            style={{ background: meta.color }}
                          />
                          <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: meta.color }}>
                            {meta.code.slice(0, 6)}
                          </div>
                          <div className="text-[8px] text-[var(--color-ooda-text-dim)] mt-0.5 font-mono">
                            {rep.reputation_score?.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in animate-delay-3">
            <div className="section-label mb-2">Quick Actions</div>
            <div className="responsive-grid-4">
              <button onClick={() => navigate('/signals')}  className="btn-outline text-[11px]">◉ View Signals</button>
              <button onClick={() => navigate('/debate')}   className="btn-outline text-[11px]">◆ Run Agents</button>
              <button onClick={() => navigate('/debate')}   className="btn-outline text-[11px]">⚖ View Debate</button>
              <button onClick={() => navigate('/counter-strike')} className="btn-outline text-[11px]">⚡ Counter-Strike</button>
            </div>
          </div>

          {/* Signal Feed Preview */}
          {hasSignals && (
            <div className="animate-fade-in animate-delay-5">
              <div className="flex items-center justify-between mb-2">
                <div className="section-label flex-1">Latest Signals</div>
                <button
                  onClick={() => navigate('/signals')}
                  className="text-[10px] text-[var(--color-ooda-accent)] font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>
              <SignalFeed signals={signals.slice(0, 4)} compact />
            </div>
          )}

          {/* Empty State */}
          {!hasSignals && (
            <div className="card text-center py-12 animate-fade-in animate-delay-2">
              <div className="text-4xl mb-3 opacity-30">⌘</div>
              <h3 className="text-base font-semibold text-[var(--color-ooda-text)]">
                Command Center Ready
              </h3>
              <p className="text-xs text-[var(--color-ooda-text-dim)] mt-2 max-w-xs mx-auto">
                Click the Demo button above to seed data and trigger the RivalFlow price drop scenario.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
