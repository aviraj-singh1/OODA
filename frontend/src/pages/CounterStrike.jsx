/**
 * CounterStrike — Counter-strategy response page.
 * Placeholder for Phase 5.
 */

import CounterStrikePanel from '../components/CounterStrikePanel';

export default function CounterStrike() {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🎯 <span>Counter-Strike</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          AI-generated counter-response packages
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        <CounterStrikePanel />
      </div>
    </div>
  );
}
