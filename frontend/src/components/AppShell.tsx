import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
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
          <Link to={user ? '/voyage' : '/'} className="app-header-brand">
            {strings.brand}
          </Link>
          <nav className="app-nav" aria-label={strings.aria.primaryNav}>
            {user ? (
              <>
                <NavLink to="/voyage">{strings.nav.voyage}</NavLink>
                <NavLink to="/charts">{strings.nav.charts}</NavLink>
                <NavLink to="/terminal">{strings.nav.terminal}</NavLink>
                {voyage.frozen ? (
                  <NavLink to="/voyage/closing">
                    {strings.closingCeremony.navLink}
                  </NavLink>
                ) : null}
                {user.crew ? (
                  <NavLink to={`/crew/${encodeURIComponent(user.crew.name)}`}>
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
                <NavLink to="/board">{strings.nav.boardLink}</NavLink>
                <NavLink to="/sign-articles">{strings.nav.signLink}</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">{strings.brandTagline}</footer>
    </div>
  );
}
