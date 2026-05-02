import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { AuthMe } from '@/api/types';
import { ApiError } from '@/api/client';

export interface AuthState {
  user: AuthMe | null;
  loading: boolean;
  /**
   * Sign-articles success returns the AuthMe — the JWT is set by the server
   * as an httpOnly cookie, so the client never sees the token.
   */
  signArticles: (p: { email: string; handle: string; password: string }) => Promise<AuthMe>;
  board: (p: { email: string; password: string }) => Promise<AuthMe>;
  logout: () => Promise<void>;
  /** Re-fetch /api/auth/me, e.g. after a Crew change. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else if (err instanceof ApiError && err.status === 0) {
        // Network down — keep last known user; UI surfaces toast.
        setUser((prev) => prev);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // After register/login, the server's response body is the themed
  // `{ ok, message, pirate: {...} }` envelope, NOT the raw AuthMe shape that
  // the rest of the app reads (user.handle, user.crew, user.role). Once the
  // auth cookie is set, fetch /me to get the canonical AuthMe shape (which
  // also includes the joined Crew columns).
  const signArticles = useCallback(
    async (p: { email: string; handle: string; password: string }) => {
      await authApi.signArticles(p);
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    [],
  );

  const board = useCallback(async (p: { email: string; password: string }) => {
    await authApi.board(p);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, signArticles, board, logout, refresh }),
    [user, loading, signArticles, board, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
