import { NavLink } from 'react-router-dom';
import { useSupabaseSession } from '../auth/useSupabaseSession';
import { RadRepPilotLogo } from '../branding/RadRepPilotLogo';

type NavbarVariant = 'public' | 'app';

interface NavbarProps {
  variant?: NavbarVariant;
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/feedback', label: 'Feedback' },
];

const appLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/reports/new', label: 'New Report' },
  { to: '/preferences', label: 'Preferences' },
];

export function Navbar({ variant = 'public' }: NavbarProps) {
  const links = variant === 'app' ? appLinks : publicLinks;
  const { session, signOut } = useSupabaseSession();

  async function handleLogout() {
    await signOut();
  }

  return (
    <header className={`platform-navbar ${variant}`}>
      <NavLink className="platform-brand" to={variant === 'app' ? '/dashboard' : '/'} aria-label="RadRepPilot home">
        <RadRepPilotLogo variant="iconOnly" size={36} />
        <span>
          <strong>RadRepPilot</strong>
          <small>Radiology reporting education platform</small>
        </span>
      </NavLink>

      <nav className="platform-nav-links" aria-label={variant === 'app' ? 'App navigation' : 'Public navigation'}>
        {links.map((link) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} end={link.to === '/'} key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="platform-nav-actions">
        {session ? (
          <>
            <span className="session-pill">{session.user.email}</span>
            <button className="ghost-link nav-button" onClick={handleLogout} type="button">
              Logout
            </button>
          </>
        ) : variant === 'public' ? (
          <>
            <NavLink className="ghost-link" to="/login">
              Login
            </NavLink>
            <NavLink className="button-link" to="/signup">
              Signup
            </NavLink>
          </>
        ) : (
          <NavLink className="ghost-link" to="/">
            Prototype home
          </NavLink>
        )}
      </div>
    </header>
  );
}
