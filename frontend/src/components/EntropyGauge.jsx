/**
 * EntropyGauge — Phase 8: Responsive gauge with larger size on desktop.
 */

import { useEffect, useState } from 'react';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(score) {
  if (score >= 81) return 'var(--color-threat)';
  if (score >= 61) return 'var(--color-warning)';
  if (score >= 31) return '#f59e0b';
  return 'var(--color-stable)';
}

function getStatus(score) {
  if (score >= 81) return 'Critical';
  if (score >= 61) return 'High Volatility';
  if (score >= 31) return 'Watch';
  return 'Stable';
}

export default function EntropyGauge({ score = 0, reason = '', status }) {
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    if (score === 0) { setAnim(0); return; }
    const dur = 900;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(from + (score - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRCUMFERENCE - (anim / 100) * CIRCUMFERENCE;
  const color = getColor(score);
  const label = status || getStatus(score);

  return (
    <div className="card flex flex-col items-center py-6 relative overflow-hidden">
      {/* Subtle glow */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ background: `radial-gradient(circle at 50% 40%, ${color}, transparent 60%)` }}
      />

      {/* SVG Gauge */}
      <div className="relative z-10">
        <svg width="140" height="140" viewBox="0 0 140 140" className="block md:hidden">
          {/* Track */}
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--color-ooda-border)" strokeWidth="7" />
          {/* Fill */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="entropy-ring"
            transform="rotate(-90 70 70)"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {/* Score */}
          <text x="70" y="64" textAnchor="middle" fill={color}
            style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            {anim}
          </text>
          <text x="70" y="82" textAnchor="middle" fill="var(--color-ooda-text-dim)"
            style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em' }}>
            / 100
          </text>
        </svg>

        {/* Desktop version — larger */}
        <svg width="180" height="180" viewBox="0 0 180 180" className="hidden md:block">
          <circle cx="90" cy="90" r="68" fill="none" stroke="var(--color-ooda-border)" strokeWidth="8" />
          <circle
            cx="90" cy="90" r="68"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 68}
            strokeDashoffset={(2 * Math.PI * 68) - (anim / 100) * (2 * Math.PI * 68)}
            className="entropy-ring"
            transform="rotate(-90 90 90)"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          <text x="90" y="82" textAnchor="middle" fill={color}
            style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            {anim}
          </text>
          <text x="90" y="104" textAnchor="middle" fill="var(--color-ooda-text-dim)"
            style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>
            / 100
          </text>
        </svg>
      </div>

      {/* Status Label */}
      <div className="text-center z-10 mt-2">
        <div className="text-[11px] md:text-[13px] font-black tracking-widest uppercase" style={{ color }}>
          {label}
        </div>
        <div className="text-[10px] text-[var(--color-ooda-text-dim)] font-medium tracking-wider uppercase mt-0.5">
          Market Entropy
        </div>
      </div>

      {/* Reason */}
      {reason && (
        <p className="text-[11px] text-[var(--color-ooda-text-dim)] mt-3 text-center max-w-[300px] leading-relaxed z-10">
          {reason}
        </p>
      )}
    </div>
  );
}
