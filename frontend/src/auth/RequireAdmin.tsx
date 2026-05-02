import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Spinner } from '@/ui/Spinner';
import { strings } from '@/theme/strings';

export function RequireAdmin({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner label={strings.common.loading} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="surface-deep" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>{strings.common.notFoundHeading}</h1>
        <p>{strings.common.forbidden}</p>
      </div>
    );
  }

  return <>{children}</>;
}
