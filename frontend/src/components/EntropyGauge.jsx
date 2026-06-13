/**
 * EntropyGauge — Circular Market Entropy Score display.
 */

import { useEffect, useState } from 'react';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getEntropyColor(score) {
  if (score >= 81) return 'var(--color-threat)';
  if (score >= 61) return 'var(--color-warning)';
  if (score >= 31) return '#f59e0b';
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

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
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

      {/* SVG Gauge */}
      <div className="relative z-10">
        <svg width="140" height="140" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--color-ooda-border)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="entropy-ring"
            transform="rotate(-90 60 60)"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          {/* Score text */}
          <text
            x="60"
            y="55"
            textAnchor="middle"
            fill={color}
            className="font-mono"
            style={{ fontSize: '28px', fontWeight: 700 }}
          >
            {animatedScore}
          </text>
          <text
            x="60"
            y="72"
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
