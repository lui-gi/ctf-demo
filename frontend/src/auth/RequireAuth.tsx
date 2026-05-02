import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Spinner } from '@/ui/Spinner';
import { strings } from '@/theme/strings';

export function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner label={strings.common.loading} />
        <p>{strings.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
