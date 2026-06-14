/**
 * SideNav — Desktop sidebar navigation for OODA.
 * Shown only on screens ≥ 768px via CSS.
 * Features: Glassmorphism background, active state with dot indicator, branding.
 */

import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',               label: 'Dashboard',      icon: '⌘' },
  { to: '/signals',        label: 'Signals',        icon: '◉' },
  { to: '/entropy',        label: 'Entropy',        icon: '◈' },
  { to: '/debate',         label: 'Agent Analysis', icon: '◆' },
  { to: '/counter-strike', label: 'Counter-Strike', icon: '⚡' },
  { to: '/rivals',         label: 'Rivals',         icon: '◎' },
];

function SideNavLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `side-nav-link ${isActive ? 'active' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
          {isActive && <span className="nav-active-dot" />}
        </>
      )}
    </NavLink>
  );
}

export default function SideNav() {
  return (
    <nav className="side-nav">
      {/* Brand */}
      <div className="side-nav-brand">
        <h1>
          <span className="text-gradient">OODA</span>
        </h1>
        <p>Observe · Orient · Decide · Act</p>
      </div>

      {/* Links */}
      <div className="side-nav-links">
        {navItems.map((item) => (
          <SideNavLink key={item.to} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="side-nav-footer">
        <div style={{ fontSize: '0.5625rem', color: 'var(--color-ooda-text-dim)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Competitive Intelligence
        </div>
        <div style={{ fontSize: '0.5rem', color: 'var(--color-ooda-text-dim)', marginTop: '0.25rem', opacity: 0.5 }}>
          v8.0 · Phase 8
        </div>
      </div>
    </nav>
  );
}
