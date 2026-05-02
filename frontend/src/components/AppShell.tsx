import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { strings } from '@/theme/strings';
import { Button } from '@/ui/Button';
import { useToast } from '@/ui/Toast';
import { useVoyageState } from '@/ws/socket';
import './AppShell.css';

export function AppShell(): JSX.Element {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const voyage = useVoyageState();
  const location = useLocation();
  // Landing is the only route that goes edge-to-edge; every other route
  // keeps the contained 1200px main column.
  const isFullBleed = location.pathname === '/';

  const onLogout = async (): Promise<void> => {
    await logout();
    toast.push({
      message: strings.auth.logoutSuccess,
      variant: 'info',
      durationMs: 4000,
    });
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to={user ? '/challenges' : '/'} className="app-header-brand">
            {strings.brand}
          </Link>
          <nav className="app-nav" aria-label={strings.aria.primaryNav}>
            {user ? (
              <>
                <NavLink to="/challenges">{strings.nav.voyage}</NavLink>
                <NavLink to="/leaderboard">{strings.nav.charts}</NavLink>
                <NavLink to="/terminal">{strings.nav.terminal}</NavLink>
                {voyage.frozen ? (
                  <NavLink to="/closing">
                    {strings.closingCeremony.navLink}
                  </NavLink>
                ) : null}
                {user.crew ? (
                  <NavLink to={`/team/${encodeURIComponent(user.crew.name)}`}>
                    {strings.nav.crew}
                  </NavLink>
                ) : null}
                {user.role === 'admin' ? (
                  <NavLink to="/admin">{strings.nav.admin}</NavLink>
                ) : null}
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  {strings.nav.logout}
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="pc-btn pc-btn--secondary pc-btn--sm app-nav-cta"
                >
                  {strings.nav.boardLink}
                </Link>
                <Link
                  to="/signup"
                  className="pc-btn pc-btn--primary pc-btn--sm app-nav-cta"
                >
                  {strings.nav.signLink}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={isFullBleed ? 'main--full-bleed' : undefined}
      >
        <Outlet />
      </main>
      <footer className="app-footer">{strings.brandTagline}</footer>
    </div>
  );
}
