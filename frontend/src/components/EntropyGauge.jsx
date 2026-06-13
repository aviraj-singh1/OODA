/**
 * EntropyGauge — Circular Market Entropy Score display.
 */

import { useEffect, useState } from 'react';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getEntropyColor(score) {
  if (score >= 81) return 'var(--color-threat)';
  if (score >= 61) return 'var(--color-warning)';
  if (score >= 31) return '#f59e0b'; // amber-500, consistent with agent-sales
  return 'var(--color-stable)';
}

function getEntropyStatus(score) {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH VOLATILITY';
  if (score >= 31) return 'WATCH';
  return 'STABLE';
}

export default function EntropyGauge({ score = 0, reason = '' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth count-up animation
  useEffect(() => {
    if (score === 0) { setAnimatedScore(0); return; }
    const duration = 1000;
    const start = performance.now();
    const from = animatedScore;
    const to = score;

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const progress = (animatedScore / 100) * CIRCUMFERENCE;
  const offset = CIRCUMFERENCE - progress;
  const color = getEntropyColor(score);
  const status = getEntropyStatus(score);

  return (
    <div className="card flex flex-col items-center gap-4 p-6 relative overflow-hidden">
      {/* Subtle glow behind gauge */}
      <div
        className="absolute inset-0 opacity-10 blur-3xl"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
      />

      {/* Label */}
      <div className="flex items-center gap-2 z-10">
        <div className="w-2 h-2 rounded-full pulse-threat" style={{ background: color }} />
        <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-ooda-text-muted)]">
          Market Entropy
        </span>
      </div>

      {/* SVG Gauge — viewBox and rendered size match to avoid clipping */}
      <div className="relative z-10">
        <svg width="148" height="148" viewBox="0 0 148 148">
          {/* Background ring */}
          <circle
            cx="74"
            cy="74"
            r={RADIUS}
            fill="none"
            stroke="var(--color-ooda-border)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="74"
            cy="74"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="entropy-ring"
            transform="rotate(-90 74 74)"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          {/* Score text */}
          <text
            x="74"
            y="69"
            textAnchor="middle"
            fill={color}
            style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {animatedScore}
          </text>
          <text
            x="74"
            y="86"
            textAnchor="middle"
            fill="var(--color-ooda-text-muted)"
            style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.1em' }}
          >
            / 100
          </text>
        </svg>
      </div>

      {/* Status */}
      <div className="text-center z-10">
        <div
          className="text-sm font-bold tracking-wide"
          style={{ color }}
        >
          {status}
        </div>
        {reason && (
          <p className="text-xs text-[var(--color-ooda-text-muted)] mt-1.5 max-w-[240px] leading-relaxed">
            {reason}
          </p>
        )}
      </div>
    </div>
  );
}
