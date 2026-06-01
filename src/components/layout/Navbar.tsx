import { NavLink, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '../auth/useSupabaseSession';
import { RadRepPilotLogo } from '../branding/RadRepPilotLogo';

type NavbarVariant = 'public' | 'app';

interface NavbarProps {
  variant?: NavbarVariant;
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/about', label: 'About' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/feedback', label: 'Feedback' },
];

const appLinks = [
  { to: '/', label: 'Home' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/reports/new', label: 'New Report' },
  { to: '/preferences', label: 'Preferences' },
];

export function Navbar({ variant = 'public' }: NavbarProps) {
  const navigate = useNavigate();
  const { session, signOut } = useSupabaseSession();
  const links = session ? appLinks : publicLinks;

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className={`platform-navbar ${variant}`}>
      <NavLink className="platform-brand" to="/" aria-label="RadRepPilot home">
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
        ) : (
          <>
            <NavLink className="ghost-link" to="/login">
              Login
            </NavLink>
            <NavLink className="button-link" to="/signup">
              Signup
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
