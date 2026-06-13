/**
 * CounterStrikePanel — Phase 6: Compact dashboard summary of latest package.
 */

import { useState, useEffect } from 'react';
import { getLatestPackage } from '../services/api';

export default function CounterStrikePanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await getLatestPackage();
        if (ok && res.data?.package) setData(res.data);
      } catch {}
    })();
    return () => { ok = false; };
  }, []);

  if (!data) return null;

  const pkg = data.package;
  const isDeployed = pkg?.status === 'DEPLOYED' || pkg?.deployed === 1;

  return (
    <div
      className="card"
      style={{
        borderColor: isDeployed ? 'rgba(0,230,118,0.25)' : 'rgba(0,212,255,0.15)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{isDeployed ? '✓' : '⚡'}</span>
          <div>
            <div className="text-xs font-bold text-[var(--color-ooda-text)]">Counter-Strike</div>
            <div className="text-[9px] text-[var(--color-ooda-text-dim)]">
              {data.asset_count || 5} assets · {data.signal?.competitor_name || ''}
            </div>
          </div>
        </div>
        <span
          className="badge"
          style={{
            background: isDeployed ? 'rgba(0,230,118,0.1)' : 'rgba(245,158,11,0.1)',
            color: isDeployed ? 'var(--color-stable)' : 'var(--color-warning)',
            border: `1px solid ${isDeployed ? 'rgba(0,230,118,0.25)' : 'rgba(245,158,11,0.25)'}`,
          }}
        >
          {isDeployed ? 'Deployed' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
