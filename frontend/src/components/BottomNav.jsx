/**
 * BottomNav — Mobile-first bottom navigation bar.
 */

import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Command', icon: '⚡' },
  { to: '/signals', label: 'Signals', icon: '📡' },
  { to: '/entropy', label: 'Entropy', icon: '🔥' },
  { to: '/debate', label: 'Agents', icon: '🤖' },
  { to: '/counter-strike', label: 'Strike', icon: '🎯' },
  { to: '/rivals', label: 'Rivals', icon: '👁️' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all no-underline ${
                isActive
                  ? 'text-[var(--color-ooda-accent)] bg-[rgba(0,212,255,0.08)]'
                  : 'text-[var(--color-ooda-text-dim)] hover:text-[var(--color-ooda-text-muted)]'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
