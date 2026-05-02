import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireAdmin } from '@/auth/RequireAdmin';
import { ToastProvider } from '@/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/components/AppShell';
import { Landing } from '@/routes/Landing';
import { SignArticles } from '@/routes/SignArticles';
import { Board } from '@/routes/Board';
import { Voyage } from '@/routes/Voyage';
import { Category } from '@/routes/Category';
import { Island } from '@/routes/Island';
import { Charts } from '@/routes/Charts';
import { Crew } from '@/routes/Crew';
import { Terminal } from '@/routes/Terminal';
import { NotFound } from '@/routes/NotFound';
import { Spinner } from '@/ui/Spinner';
import { strings } from '@/theme/strings';

// Admin is lazy-loaded — guarantees a separate JS chunk so non-admin Pirates
// never download admin code (verified in Vite's build output as `admin-*.js`).
const AdminApp = lazy(() => import('@/admin/AdminApp'));

// Closing Ceremony is lazy-loaded too — most players never reach the freeze
// reveal, so the locked-letter constant + parchment styles ride a separate
// chunk that loads only when a player visits /closing.
const ClosingCeremony = lazy(() =>
  import('@/routes/ClosingCeremony').then((m) => ({ default: m.ClosingCeremony })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Landing />} />
                  <Route path="/signup" element={<SignArticles />} />
                  <Route path="/login" element={<Board />} />

                  <Route
                    path="/challenges"
                    element={
                      <RequireAuth>
                        <Voyage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/challenges/:category"
                    element={
                      <RequireAuth>
                        <Category />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/challenges/:category/:slug"
                    element={
                      <RequireAuth>
                        <Island />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <RequireAuth>
                        <Charts />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/closing"
                    element={
                      <RequireAuth>
                        <Suspense
                          fallback={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                              <Spinner label={strings.common.loading} />
                            </div>
                          }
                        >
                          <ClosingCeremony />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/team/:name"
                    element={
                      <RequireAuth>
                        <Crew />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/terminal"
                    element={
                      <RequireAuth>
                        <Terminal />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <RequireAdmin>
                        <Suspense
                          fallback={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                              <Spinner label={strings.common.loading} />
                            </div>
                          }
                        >
                          <AdminApp />
                        </Suspense>
                      </RequireAdmin>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
