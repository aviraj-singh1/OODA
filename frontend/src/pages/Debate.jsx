/**
 * Debate — Agent debate view page.
 * Placeholder for Phase 4.
 */

import AgentDebateView from '../components/AgentDebateView';

export default function Debate() {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          ⚔️ <span>Agent Debate</span>
        </h1>
        <p className="text-xs text-[var(--color-ooda-text-dim)] mt-1">
          AI agents debate the impact of competitor signals
        </p>
      </div>

      <div className="animate-fade-in animate-delay-1">
        <AgentDebateView />
      </div>
    </div>
  );
}
