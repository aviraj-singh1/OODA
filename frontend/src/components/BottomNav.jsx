/**
 * BottomNav — Phase 6: Clean 5-tab mobile navigation.
 */

import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',                label: 'Home',    icon: '⌘' },
  { to: '/signals',         label: 'Signals', icon: '◉' },
  { to: '/debate',          label: 'Agents',  icon: '◆' },
  { to: '/counter-strike',  label: 'Strike',  icon: '⚡' },
  { to: '/rivals',          label: 'Rivals',  icon: '◎' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all no-underline ${
                isActive
                  ? 'text-[var(--color-ooda-accent)]'
                  : 'text-[var(--color-ooda-text-dim)] hover:text-[var(--color-ooda-text-muted)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-base" style={{ opacity: isActive ? 1 : 0.6 }}>
                  {item.icon}
                </span>
                <span
                  className="text-[9px] font-bold tracking-wider uppercase"
                  style={{ opacity: isActive ? 1 : 0.5 }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: 'var(--color-ooda-accent)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
