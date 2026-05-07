# progctf Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React + Vite frontend for the progctf pirate-themed CTF platform, covering all pages from landing through challenge submission.

**Architecture:** Single-page application with React Router v6 for client-side routing, AuthContext for JWT auth state, and component-local state for page data. No global store — each page fetches its own data. 30-second polling for bounties and crew rank.

**Tech Stack:** React 18, Vite, React Router v6, Tailwind CSS v3, Vitest, React Testing Library, @testing-library/jest-dom

---

## File Map

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   ├── api.ts           # fetch wrapper with auth + 401 handling
│   │   └── types.ts         # all shared TypeScript interfaces
│   ├── contexts/
│   │   └── AuthContext.tsx  # JWT storage, user state, crew rank poll
│   ├── router/
│   │   ├── index.tsx        # createBrowserRouter config
│   │   ├── RequireAuth.tsx  # redirects to /login if not authenticated
│   │   └── RedirectIfAuth.tsx # redirects to /dashboard if authenticated
│   ├── components/
│   │   ├── layout/
│   │   │   ├── RootLayout.tsx
│   │   │   ├── TopNav.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── ui/
│   │       ├── CategoryCard.tsx
│   │       ├── ChallengeCard.tsx
│   │       ├── QuestionBlock.tsx
│   │       ├── FlagInput.tsx
│   │       ├── DifficultyBadge.tsx
│   │       ├── SolveToast.tsx
│   │       └── CrewBadge.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ChallengesPage.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── ChallengePage.tsx
│   │   ├── BountiesPage.tsx
│   │   ├── CrewPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   └── __tests__/
│       ├── setup.ts
│       ├── router.test.tsx
│       ├── QuestionBlock.test.tsx
│       └── FlagInput.test.tsx
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `frontend/` (entire directory)
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/__tests__/setup.ts`

- [ ] **Step 1: Scaffold the Vite project**

From the repo root:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `frontend/tailwind.config.ts` with:
```ts
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#03082e',
          900: '#0a1a5c',
          800: '#0d3070',
          700: '#1a3a6a',
          600: '#2a4a8a',
        },
        amber: '#ffb347',
        steel: '#8ab4e8',
        success: '#4dbb88',
        danger: '#cc4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [forms],
} satisfies Config
```

- [ ] **Step 4: Write `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    height: 100%;
  }
  body {
    @apply bg-navy-950 text-white;
  }
}
```

- [ ] **Step 5: Configure Vitest in `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 6: Write test setup file**

Create `frontend/src/__tests__/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
```

- [ ] **Step 8: Write a placeholder `src/App.tsx`** (replaced by router in later tasks)

```tsx
export default function App() {
  return <div>progctf</div>
}
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite server running at `http://localhost:5173`

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React + Vite + Tailwind frontend"
```

---

## Task 2: Shared Types + API Client

**Files:**
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export interface User {
  id: string
  username: string
  email: string
}

export interface CrewRank {
  crewName: string
  rank: number
}

export interface Category {
  slug: string
  name: string
  icon: string
  totalChallenges: number
  solvedChallenges: number
}

export interface Challenge {
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  solved: boolean
}

export interface Question {
  id: string
  text: string
  solved: boolean
  pointsEarned: number
}

export interface ChallengeDetail {
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  embedUrl: string | null
  downloadUrls: string[]
  questions: Question[]
  flagSolved: boolean
}

export interface SubmitResponse {
  correct: boolean
  pointsEarned: number
}

export interface BountyEntry {
  rank: number
  crewName: string
  totalPoints: number
  solveCount: number
}

export interface Crew {
  id: string
  name: string
  inviteCode: string
  members: CrewMember[]
}

export interface CrewMember {
  id: string
  username: string
  points: number
}

export interface DashboardStats {
  totalPoints: number
  solvedChallenges: number
  totalChallenges: number
  recentSolves: RecentSolve[]
}

export interface RecentSolve {
  challengeTitle: string
  category: string
  pointsEarned: number
  solvedAt: string
}

export interface ProfileStats extends DashboardStats {
  username: string
  crewName: string | null
}
```

- [ ] **Step 2: Write `src/lib/api.ts`**

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
```

- [ ] **Step 3: Add `.env.example` to frontend**

Create `frontend/.env.example`:
```
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/ frontend/.env.example
git commit -m "feat: add shared types and API client"
```

---

## Task 3: AuthContext

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Write `src/contexts/AuthContext.tsx`**

```tsx
import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { User, CrewRank } from '../lib/types'

interface AuthContextValue {
  user: User | null
  crewRank: CrewRank | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })
  const [crewRank, setCrewRank] = useState<CrewRank | null>(null)

  const login = useCallback((token: string, incoming: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(incoming))
    setUser(incoming)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCrewRank(null)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchRank = () =>
      api.get<CrewRank>('/api/me/crew-rank').then(setCrewRank).catch(() => {})
    fetchRank()
    const id = setInterval(fetchRank, 30_000)
    return () => clearInterval(id)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, crewRank, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/contexts/
git commit -m "feat: add AuthContext with JWT storage and crew rank polling"
```

---

## Task 4: Router + Route Guard

**Files:**
- Create: `frontend/src/router/RequireAuth.tsx`
- Create: `frontend/src/router/RedirectIfAuth.tsx`
- Create: `frontend/src/router/index.tsx`
- Create: `frontend/src/__tests__/router.test.tsx`

- [ ] **Step 1: Write the failing route guard tests**

Create `frontend/src/__tests__/router.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../contexts/AuthContext'
import RequireAuth from '../router/RequireAuth'
import RedirectIfAuth from '../router/RedirectIfAuth'

const mockUseAuth = vi.mocked(useAuth)

describe('RequireAuth', () => {
  test('redirects unauthenticated user to /login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, user: null, crewRank: null,
      login: vi.fn(), logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  test('renders protected route for authenticated user', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'pirate', email: 'p@sea.io' },
      crewRank: null, login: vi.fn(), logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('RedirectIfAuth', () => {
  test('redirects authenticated user to /dashboard', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'pirate', email: 'p@sea.io' },
      crewRank: null, login: vi.fn(), logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RedirectIfAuth />}>
            <Route path="/" element={<div>Landing</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Landing')).not.toBeInTheDocument()
  })

  test('renders public route for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, user: null, crewRank: null,
      login: vi.fn(), logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RedirectIfAuth />}>
            <Route path="/" element={<div>Landing</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Landing')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/__tests__/router.test.tsx
```
Expected: FAIL — `RequireAuth` and `RedirectIfAuth` not found.

- [ ] **Step 3: Create placeholder pages and layout stubs for router wiring**

Create `frontend/src/pages/LandingPage.tsx`:
```tsx
export default function LandingPage() { return <div>Landing</div> }
```
Repeat for all pages — `LoginPage`, `RegisterPage`, `DashboardPage`, `ChallengesPage`, `CategoryPage`, `ChallengePage`, `BountiesPage`, `CrewPage`, `ProfilePage`, `NotFoundPage` — each returning `<div>PageName</div>`.

Also create layout stubs so the router imports resolve (replaced with real implementations in Task 5):

Create `frontend/src/components/layout/RootLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
export default function RootLayout() { return <Outlet /> }
```

Create `frontend/src/components/layout/AuthLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
export default function AuthLayout() { return <Outlet /> }
```

- [ ] **Step 4: Write `src/router/RequireAuth.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 5: Write `src/router/RedirectIfAuth.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RedirectIfAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
```

- [ ] **Step 6: Write `src/router/index.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import RedirectIfAuth from './RedirectIfAuth'
import RootLayout from '../components/layout/RootLayout'
import AuthLayout from '../components/layout/AuthLayout'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ChallengesPage from '../pages/ChallengesPage'
import CategoryPage from '../pages/CategoryPage'
import ChallengePage from '../pages/ChallengePage'
import BountiesPage from '../pages/BountiesPage'
import CrewPage from '../pages/CrewPage'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuth />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/challenges', element: <ChallengesPage /> },
          { path: '/challenges/:category', element: <CategoryPage /> },
          { path: '/challenges/:category/:slug', element: <ChallengePage /> },
          { path: '/bounties', element: <BountiesPage /> },
          { path: '/crew', element: <CrewPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/router.test.tsx
```
Expected: 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/router/ frontend/src/pages/ frontend/src/__tests__/
git commit -m "feat: add router with RequireAuth and RedirectIfAuth guards"
```

---

## Task 5: Layout Components

**Files:**
- Create: `frontend/src/components/layout/RootLayout.tsx`
- Create: `frontend/src/components/layout/TopNav.tsx`
- Create: `frontend/src/components/layout/AuthLayout.tsx`
- Create: `frontend/src/components/ui/CrewBadge.tsx`

- [ ] **Step 1: Write `CrewBadge.tsx`**

```tsx
import type { CrewRank } from '../../lib/types'

interface Props {
  crewRank: CrewRank | null
}

export default function CrewBadge({ crewRank }: Props) {
  if (!crewRank) return null
  return (
    <span className="text-steel text-xs">
      Crew: <span className="text-white font-semibold">{crewRank.crewName}</span>
      {' '}·{' '}
      <span className="text-amber font-mono">#{crewRank.rank}</span>
    </span>
  )
}
```

- [ ] **Step 2: Write `TopNav.tsx`**

```tsx
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CrewBadge from '../ui/CrewBadge'

const links = [
  { to: '/challenges', label: 'Challenges' },
  { to: '/bounties', label: 'Bounties' },
  { to: '/crew', label: 'Crew' },
  { to: '/profile', label: 'Profile' },
]

export default function TopNav() {
  const { logout, crewRank } = useAuth()
  return (
    <nav className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur border-b border-navy-700 px-6 py-3 flex items-center justify-between">
      <Link
        to="/dashboard"
        className="font-mono font-black italic text-xl tracking-wide"
      >
        <span className="text-white">prog</span>
        <span className="text-amber">ctf</span>
      </Link>

      <div className="flex items-center gap-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'text-white text-sm border-b border-amber pb-0.5'
                : 'text-steel text-sm hover:text-white transition-colors'
            }
          >
            {label}
          </NavLink>
        ))}
        <CrewBadge crewRank={crewRank} />
        <button
          onClick={logout}
          className="text-steel text-sm hover:text-danger transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Write `RootLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Write `AuthLayout.tsx`**

```tsx
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 60%, #0d3070 100%)' }}
    >
      <Link to="/" className="font-mono font-black italic text-3xl tracking-wide mb-8">
        <span className="text-white">prog</span>
        <span className="text-amber">ctf</span>
      </Link>
      <div className="w-full max-w-sm bg-navy-900/80 border border-navy-700 rounded-lg p-8">
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify layout renders**

```bash
npm run dev
```
Navigate to `http://localhost:5173/dashboard` — should redirect to `/login` (AuthLayout). Navigate to `/challenges` after manually setting a fake token — should show TopNav.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add RootLayout, TopNav, AuthLayout, CrewBadge"
```

---

## Task 6: Landing Page

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write `LandingPage.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 45%, #0d3070 75%, #0a2050 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[8%] left-[15%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 top-[12%] left-[60%]" />
        <div className="absolute w-1 h-1 rounded-full bg-white/50 top-[6%] left-[80%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/30 top-[20%] left-[35%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/50 top-[5%] left-[50%]" />
        <div className="absolute w-1 h-1 rounded-full bg-white/30 top-[15%] left-[90%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 top-[18%] left-[70%]" />
      </div>

      {/* Moon */}
      <div
        className="absolute top-10 left-14 w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #fffbe8, #e8d89a)',
          boxShadow: '0 0 30px 12px rgba(255,251,232,0.25)',
        }}
      />

      {/* Minimal nav */}
      <nav className="relative z-10 flex justify-end gap-6 px-10 py-6">
        <Link to="/login" className="text-steel text-sm hover:text-white transition-colors">
          Login
        </Link>
        <Link
          to="/register"
          className="text-sm px-4 py-1.5 border border-amber/60 text-amber rounded hover:bg-amber/10 transition-colors"
        >
          Register
        </Link>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10">
        <div
          className="text-9xl mb-6 select-none"
          style={{ filter: 'drop-shadow(0 0 24px rgba(255,179,71,0.35))' }}
        >
          🏴‍☠️
        </div>
        <h1 className="font-mono font-black italic text-6xl tracking-wide mb-3">
          <span className="text-white">prog</span>
          <span className="text-amber">ctf</span>
        </h1>
        <p className="text-steel text-sm tracking-[0.3em] uppercase mb-10">
          Encrypted Treasures
        </p>
        <div className="flex gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
          >
            Join the Hunt
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-navy-700 text-steel rounded hover:text-white hover:border-steel transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Rocky coast SVG */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none">
        <svg viewBox="0 0 1440 100" fill="none" className="w-full" preserveAspectRatio="none">
          <path
            d="M0 70 Q180 35 360 60 Q540 85 720 50 Q900 15 1080 48 Q1260 80 1440 42 L1440 100 L0 100 Z"
            fill="#0a1a5c" opacity="0.55"
          />
          <path
            d="M0 82 Q220 55 440 75 Q660 95 880 65 Q1060 40 1240 72 Q1360 88 1440 62 L1440 100 L0 100 Z"
            fill="#0d3070" opacity="0.75"
          />
          <path
            d="M0 92 Q300 75 600 88 Q900 100 1200 84 Q1340 78 1440 88 L1440 100 L0 100 Z"
            fill="#0a2050" opacity="0.9"
          />
        </svg>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```
Open `http://localhost:5173` — should see the Deep Ocean hero with moon, stars, ship emoji, wordmark, rocky coast, and two CTA buttons.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: build Deep Ocean landing page hero"
```

---

## Task 7: Login + Register Pages

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Write `LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../lib/types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
      login(res.token, res.user)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        {error && <p className="text-danger text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p className="text-center text-steel text-xs mt-4">
        No account?{' '}
        <Link to="/register" className="text-amber hover:underline">Register</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 2: Write `RegisterPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../lib/types'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/register', {
        username, email, password,
      })
      login(res.token, res.user)
      navigate('/dashboard')
    } catch {
      setError('Registration failed. Username or email may already be taken.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-6 text-center">Create Account</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        {error && <p className="text-danger text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="text-center text-steel text-xs mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-amber hover:underline">Login</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/RegisterPage.tsx
git commit -m "feat: add login and register pages"
```

---

## Task 8: Shared UI — DifficultyBadge, CategoryCard, ChallengeCard

**Files:**
- Create: `frontend/src/components/ui/DifficultyBadge.tsx`
- Create: `frontend/src/components/ui/CategoryCard.tsx`
- Create: `frontend/src/components/ui/ChallengeCard.tsx`

- [ ] **Step 1: Write `DifficultyBadge.tsx`**

```tsx
interface Props {
  difficulty: 'easy' | 'medium' | 'hard'
}

const config = {
  easy:   { label: 'Easy',   className: 'bg-success/20 text-success border-success/30' },
  medium: { label: 'Medium', className: 'bg-amber/20 text-amber border-amber/30' },
  hard:   { label: 'Hard',   className: 'bg-danger/20 text-danger border-danger/30' },
}

export default function DifficultyBadge({ difficulty }: Props) {
  const { label, className } = config[difficulty]
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${className}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Write `CategoryCard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { Category } from '../../lib/types'

interface Props {
  category: Category
}

export default function CategoryCard({ category }: Props) {
  const pct = category.totalChallenges === 0
    ? 0
    : Math.round((category.solvedChallenges / category.totalChallenges) * 100)

  return (
    <Link
      to={`/challenges/${category.slug}`}
      className="group block bg-navy-900 border border-navy-700 rounded-lg p-5 hover:border-steel transition-colors"
    >
      <div className="text-4xl mb-3">{category.icon}</div>
      <h3 className="text-white font-semibold mb-1 group-hover:text-steel transition-colors">
        {category.name}
      </h3>
      <p className="text-steel text-xs mb-3">
        {category.solvedChallenges} / {category.totalChallenges} solved
      </p>
      <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write `ChallengeCard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { Challenge } from '../../lib/types'
import DifficultyBadge from './DifficultyBadge'

interface Props {
  challenge: Challenge
  categorySlug: string
}

export default function ChallengeCard({ challenge, categorySlug }: Props) {
  return (
    <Link
      to={`/challenges/${categorySlug}/${challenge.slug}`}
      className={`block bg-navy-900 border rounded-lg p-4 hover:border-steel transition-colors ${
        challenge.solved ? 'border-success/40 opacity-70' : 'border-navy-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`font-semibold text-sm ${challenge.solved ? 'text-success' : 'text-white'}`}>
          {challenge.solved && <span className="mr-1">✓</span>}
          {challenge.title}
        </h3>
        <span className="text-amber font-mono text-xs shrink-0">{challenge.points} pts</span>
      </div>
      <DifficultyBadge difficulty={challenge.difficulty} />
    </Link>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/DifficultyBadge.tsx frontend/src/components/ui/CategoryCard.tsx frontend/src/components/ui/ChallengeCard.tsx
git commit -m "feat: add DifficultyBadge, CategoryCard, ChallengeCard components"
```

---

## Task 9: ChallengesPage + CategoryPage

**Files:**
- Modify: `frontend/src/pages/ChallengesPage.tsx`
- Modify: `frontend/src/pages/CategoryPage.tsx`

- [ ] **Step 1: Write `ChallengesPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Category } from '../lib/types'
import CategoryCard from '../components/ui/CategoryCard'

export default function ChallengesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load challenges.</p>
        <button
          onClick={() => { setError(false); api.get<Category[]>('/api/categories').then(setCategories).catch(() => setError(true)) }}
          className="px-4 py-2 border border-navy-700 rounded text-sm hover:text-white transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Challenges</h1>
      <p className="text-steel text-sm mb-8">Select a category to begin your hunt.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `CategoryPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Challenge } from '../lib/types'
import ChallengeCard from '../components/ui/ChallengeCard'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!category) return
    api.get<{ name: string; challenges: Challenge[] }>(`/api/categories/${category}`)
      .then(res => { setCategoryName(res.name); setChallenges(res.challenges) })
      .catch(() => setError(true))
  }, [category])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load this category.</p>
        <Link to="/challenges" className="text-amber hover:underline text-sm">← Back to Challenges</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <p className="text-steel text-xs mb-4">
        <Link to="/challenges" className="hover:text-white transition-colors">Challenges</Link>
        {' '}›{' '}
        <span className="text-white">{categoryName}</span>
      </p>
      <h1 className="text-2xl font-bold text-white mb-8">{categoryName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(ch => (
          <ChallengeCard key={ch.slug} challenge={ch} categorySlug={category!} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ChallengesPage.tsx frontend/src/pages/CategoryPage.tsx
git commit -m "feat: add ChallengesPage category grid and CategoryPage"
```

---

## Task 10: QuestionBlock (TDD)

**Files:**
- Create: `frontend/src/__tests__/QuestionBlock.test.tsx`
- Create: `frontend/src/components/ui/QuestionBlock.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/__tests__/QuestionBlock.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockPost = vi.fn()
vi.mock('../lib/api', () => ({ api: { post: mockPost } }))

import QuestionBlock from '../components/ui/QuestionBlock'

describe('QuestionBlock', () => {
  beforeEach(() => { mockPost.mockReset() })

  test('renders question text', () => {
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={false}
        initialPoints={0}
      />
    )
    expect(screen.getByText('What IP does the attacker use?')).toBeInTheDocument()
  })

  test('shows correct feedback on right answer', async () => {
    mockPost.mockResolvedValueOnce({ correct: true, pointsEarned: 10 })
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={false}
        initialPoints={0}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '192.168.1.1' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText(/correct/i)).toBeInTheDocument())
    expect(screen.getByText(/10 pts/i)).toBeInTheDocument()
  })

  test('disables input after correct answer', async () => {
    mockPost.mockResolvedValueOnce({ correct: true, pointsEarned: 10 })
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={false}
        initialPoints={0}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '192.168.1.1' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeDisabled())
  })

  test('shows incorrect feedback on wrong answer', async () => {
    mockPost.mockResolvedValueOnce({ correct: false, pointsEarned: 0 })
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={false}
        initialPoints={0}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText(/incorrect/i)).toBeInTheDocument())
  })

  test('input remains enabled after incorrect answer', async () => {
    mockPost.mockResolvedValueOnce({ correct: false, pointsEarned: 0 })
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={false}
        initialPoints={0}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText(/incorrect/i)).toBeInTheDocument())
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  test('renders pre-solved state when initialSolved is true', () => {
    render(
      <QuestionBlock
        id="q1"
        text="What IP does the attacker use?"
        endpoint="/api/challenges/slug/questions/q1"
        initialSolved={true}
        initialPoints={10}
      />
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/QuestionBlock.test.tsx
```
Expected: FAIL — `QuestionBlock` not found.

- [ ] **Step 3: Write `QuestionBlock.tsx`**

```tsx
import { useState } from 'react'
import { api } from '../../lib/api'
import type { SubmitResponse } from '../../lib/types'

interface Props {
  id: string
  text: string
  endpoint: string
  initialSolved: boolean
  initialPoints: number
}

type Status = 'idle' | 'loading' | 'correct' | 'incorrect'

export default function QuestionBlock({ id, text, endpoint, initialSolved, initialPoints }: Props) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>(initialSolved ? 'correct' : 'idle')
  const [points, setPoints] = useState(initialPoints)
  const [shake, setShake] = useState(false)

  const solved = status === 'correct'

  async function handleSubmit() {
    if (solved || !answer.trim()) return
    setStatus('loading')
    try {
      const res = await api.post<SubmitResponse>(endpoint, { answer: answer.trim() })
      if (res.correct) {
        setPoints(res.pointsEarned)
        setStatus('correct')
      } else {
        setStatus('incorrect')
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
      <label htmlFor={id} className="text-steel text-sm">{text}</label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={solved ? '✓ Answered' : answer}
          onChange={e => { setAnswer(e.target.value); if (status === 'incorrect') setStatus('idle') }}
          disabled={solved || status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Your answer…"
          className={`flex-1 bg-navy-950 border rounded px-3 py-2 text-sm focus:outline-none transition-colors disabled:opacity-60 ${
            solved
              ? 'border-success/50 text-success'
              : status === 'incorrect'
              ? 'border-danger/50 text-white'
              : 'border-navy-700 text-white focus:border-steel'
          }`}
        />
        {!solved && (
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || !answer.trim()}
            className="px-4 py-2 bg-navy-700 text-steel text-sm rounded hover:bg-navy-600 hover:text-white disabled:opacity-40 transition-colors"
          >
            {status === 'loading' ? '…' : 'Submit'}
          </button>
        )}
      </div>
      {status === 'correct' && (
        <p className="text-success text-xs">✓ Correct — {points} pts</p>
      )}
      {status === 'incorrect' && (
        <p className="text-danger text-xs">✗ Incorrect, try again.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/QuestionBlock.test.tsx
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/QuestionBlock.tsx frontend/src/__tests__/QuestionBlock.test.tsx
git commit -m "feat: add QuestionBlock with correct/incorrect state (TDD)"
```

---

## Task 11: FlagInput (TDD)

**Files:**
- Create: `frontend/src/__tests__/FlagInput.test.tsx`
- Create: `frontend/src/components/ui/FlagInput.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/__tests__/FlagInput.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockPost = vi.fn()
vi.mock('../lib/api', () => ({ api: { post: mockPost } }))

import FlagInput from '../components/ui/FlagInput'

describe('FlagInput', () => {
  beforeEach(() => { mockPost.mockReset() })

  test('renders amber-styled flag input with placeholder', () => {
    render(<FlagInput endpoint="/api/challenges/slug/flag" initialSolved={false} />)
    expect(screen.getByPlaceholderText(/progctf\{/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit flag/i })).toBeInTheDocument()
  })

  test('shows correct feedback on right flag', async () => {
    mockPost.mockResolvedValueOnce({ correct: true, pointsEarned: 300 })
    render(<FlagInput endpoint="/api/challenges/slug/flag" initialSolved={false} />)
    fireEvent.change(screen.getByPlaceholderText(/progctf\{/i), { target: { value: 'progctf{test_flag}' } })
    fireEvent.click(screen.getByRole('button', { name: /submit flag/i }))
    await waitFor(() => expect(screen.getByText(/flag captured/i)).toBeInTheDocument())
  })

  test('shows incorrect feedback on wrong flag', async () => {
    mockPost.mockResolvedValueOnce({ correct: false, pointsEarned: 0 })
    render(<FlagInput endpoint="/api/challenges/slug/flag" initialSolved={false} />)
    fireEvent.change(screen.getByPlaceholderText(/progctf\{/i), { target: { value: 'progctf{wrong}' } })
    fireEvent.click(screen.getByRole('button', { name: /submit flag/i }))
    await waitFor(() => expect(screen.getByText(/incorrect/i)).toBeInTheDocument())
  })

  test('disables input after correct flag submission', async () => {
    mockPost.mockResolvedValueOnce({ correct: true, pointsEarned: 300 })
    render(<FlagInput endpoint="/api/challenges/slug/flag" initialSolved={false} />)
    fireEvent.change(screen.getByPlaceholderText(/progctf\{/i), { target: { value: 'progctf{test_flag}' } })
    fireEvent.click(screen.getByRole('button', { name: /submit flag/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeDisabled())
  })

  test('renders solved state when initialSolved is true', () => {
    render(<FlagInput endpoint="/api/challenges/slug/flag" initialSolved={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByText(/flag captured/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/FlagInput.test.tsx
```
Expected: FAIL — `FlagInput` not found.

- [ ] **Step 3: Write `FlagInput.tsx`**

```tsx
import { useState } from 'react'
import { api } from '../../lib/api'
import type { SubmitResponse } from '../../lib/types'

interface Props {
  endpoint: string
  initialSolved: boolean
}

type Status = 'idle' | 'loading' | 'correct' | 'incorrect'

export default function FlagInput({ endpoint, initialSolved }: Props) {
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState<Status>(initialSolved ? 'correct' : 'idle')
  const [shake, setShake] = useState(false)

  const solved = status === 'correct'

  async function handleSubmit() {
    if (solved || !flag.trim()) return
    setStatus('loading')
    try {
      const res = await api.post<SubmitResponse>(endpoint, { flag: flag.trim() })
      if (res.correct) {
        setStatus('correct')
      } else {
        setStatus('incorrect')
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={flag}
          onChange={e => { setFlag(e.target.value); if (status === 'incorrect') setStatus('idle') }}
          disabled={solved || status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="progctf{...}"
          className={`flex-1 bg-navy-950 border rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors disabled:opacity-60 ${
            solved
              ? 'border-success/50 text-success'
              : status === 'incorrect'
              ? 'border-danger/50 text-white'
              : 'border-amber/40 text-amber focus:border-amber'
          }`}
        />
        {!solved && (
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || !flag.trim()}
            className="px-5 py-2 bg-amber text-navy-950 font-bold text-sm rounded hover:bg-amber/90 disabled:opacity-40 transition-colors"
          >
            {status === 'loading' ? '…' : 'Submit Flag'}
          </button>
        )}
      </div>
      {status === 'correct' && (
        <p className="text-success text-xs font-semibold">🏴‍☠️ Flag captured!</p>
      )}
      {status === 'incorrect' && (
        <p className="text-danger text-xs">✗ Incorrect flag, keep digging.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/FlagInput.test.tsx
```
Expected: 5 tests PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```
Expected: All 15 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/FlagInput.tsx frontend/src/__tests__/FlagInput.test.tsx
git commit -m "feat: add FlagInput with amber styling and correct/incorrect state (TDD)"
```

---

## Task 12: ChallengePage

**Files:**
- Modify: `frontend/src/pages/ChallengePage.tsx`

- [ ] **Step 1: Write `ChallengePage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { ChallengeDetail } from '../lib/types'
import DifficultyBadge from '../components/ui/DifficultyBadge'
import QuestionBlock from '../components/ui/QuestionBlock'
import FlagInput from '../components/ui/FlagInput'

export default function ChallengePage() {
  const { category, slug } = useParams<{ category: string; slug: string }>()
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!category || !slug) return
    Promise.all([
      api.get<ChallengeDetail>(`/api/categories/${category}/challenges/${slug}`),
      api.get<{ name: string }>(`/api/categories/${category}`),
    ])
      .then(([ch, cat]) => { setChallenge(ch); setCategoryName(cat.name) })
      .catch(() => setError(true))
  }, [category, slug])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load this challenge.</p>
        <Link to={`/challenges/${category}`} className="text-amber hover:underline text-sm">
          ← Back to {categoryName || 'category'}
        </Link>
      </div>
    )
  }

  if (!challenge) {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Left column — embed */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-navy-700 px-8 py-8 gap-4">
        <p className="text-steel text-xs">
          <Link to="/challenges" className="hover:text-white transition-colors">Challenges</Link>
          {' › '}
          <Link to={`/challenges/${category}`} className="hover:text-white transition-colors">
            {categoryName}
          </Link>
          {' › '}
          <span className="text-white">{challenge.title}</span>
        </p>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{challenge.title}</h1>
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <span className="text-amber font-mono text-sm">{challenge.points} pts</span>
            {challenge.flagSolved && (
              <span className="text-success text-xs">🏴‍☠️ Completed</span>
            )}
          </div>
        </div>

        {/* Downloads */}
        {challenge.downloadUrls.length > 0 && (
          <div>
            <p className="text-steel text-xs mb-2 uppercase tracking-wide">Challenge Files</p>
            <div className="flex flex-col gap-1">
              {challenge.downloadUrls.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber text-sm hover:underline"
                >
                  ↓ {url.split('/').at(-1)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Embed */}
        {challenge.embedUrl && (
          <iframe
            src={challenge.embedUrl}
            className="flex-1 w-full rounded border border-navy-700 bg-navy-950 min-h-[400px]"
            title={challenge.title}
          />
        )}
      </div>

      {/* Right column — questions */}
      <div className="w-96 shrink-0 flex flex-col overflow-y-auto px-6 py-8 gap-6">
        <h2 className="text-steel text-xs uppercase tracking-widest border-b border-navy-700 pb-3">
          Questions
        </h2>

        {challenge.questions.map((q, i) => (
          <QuestionBlock
            key={q.id}
            id={q.id}
            text={`Q${i + 1} · ${q.text}`}
            endpoint={`/api/categories/${category}/challenges/${slug}/questions/${q.id}`}
            initialSolved={q.solved}
            initialPoints={q.pointsEarned}
          />
        ))}

        <div className="border-t border-navy-700 pt-6">
          <p className="text-steel text-xs uppercase tracking-widest mb-3">🏴‍☠️ Flag</p>
          <FlagInput
            endpoint={`/api/categories/${category}/challenges/${slug}/flag`}
            initialSolved={challenge.flagSolved}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ChallengePage.tsx
git commit -m "feat: add two-column ChallengePage with embed and questions panel"
```

---

## Task 13: BountiesPage

**Files:**
- Modify: `frontend/src/pages/BountiesPage.tsx`

- [ ] **Step 1: Write `BountiesPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { BountyEntry } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

export default function BountiesPage() {
  const { crewRank } = useAuth()
  const [entries, setEntries] = useState<BountyEntry[]>([])
  const [error, setError] = useState(false)

  const fetchBounties = useCallback(() => {
    api.get<BountyEntry[]>('/api/bounties')
      .then(setEntries)
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    fetchBounties()
    const id = setInterval(fetchBounties, 30_000)
    return () => clearInterval(id)
  }, [fetchBounties])

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Bounties</h1>
      <p className="text-steel text-sm mb-8">
        Crew rankings · refreshes every 30 seconds
      </p>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-steel py-12">
          <p>The seas are rough — couldn't load bounties.</p>
          <button
            onClick={() => { setError(false); fetchBounties() }}
            className="px-4 py-2 border border-navy-700 rounded text-sm hover:text-white transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-steel text-xs uppercase tracking-wide border-b border-navy-700">
              <th className="text-left pb-3 w-12">Rank</th>
              <th className="text-left pb-3">Crew</th>
              <th className="text-right pb-3">Solves</th>
              <th className="text-right pb-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isYours = crewRank?.crewName === entry.crewName
              return (
                <tr
                  key={entry.rank}
                  className={`border-b border-navy-700/50 ${isYours ? 'bg-amber/5' : ''}`}
                >
                  <td className="py-3 font-mono text-steel">
                    {entry.rank <= 3
                      ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                      : `#${entry.rank}`}
                  </td>
                  <td className="py-3">
                    <span className={isYours ? 'text-amber font-semibold' : 'text-white'}>
                      {entry.crewName}
                    </span>
                    {isYours && <span className="ml-2 text-xs text-steel">(you)</span>}
                  </td>
                  <td className="py-3 text-right text-steel font-mono">{entry.solveCount}</td>
                  <td className="py-3 text-right text-amber font-mono font-semibold">
                    {entry.totalPoints.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/BountiesPage.tsx
git commit -m "feat: add BountiesPage leaderboard with 30-second poll"
```

---

## Task 14: CrewPage

**Files:**
- Modify: `frontend/src/pages/CrewPage.tsx`

- [ ] **Step 1: Write `CrewPage.tsx`**

```tsx
import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Crew } from '../lib/types'

type View = 'loading' | 'no-crew' | 'crew' | 'error'

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew | null>(null)
  const [view, setView] = useState<View>('loading')
  const [crewName, setCrewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get<Crew | null>('/api/crew')
      .then(res => { setCrew(res); setView(res ? 'crew' : 'no-crew') })
      .catch(() => setView('error'))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await api.post<Crew>('/api/crew', { name: crewName })
      setCrew(res)
      setView('crew')
    } catch {
      setFormError('Could not create crew. Name may already be taken.')
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await api.post<Crew>('/api/crew/join', { inviteCode })
      setCrew(res)
      setView('crew')
    } catch {
      setFormError('Invalid invite code.')
    }
  }

  async function handleLeave() {
    if (!confirm('Leave your crew?')) return
    try {
      await api.post('/api/crew/leave', {})
      setCrew(null)
      setView('no-crew')
    } catch {
      setFormError('Could not leave crew.')
    }
  }

  if (view === 'loading') {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  if (view === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center text-steel text-sm">
        The seas are rough — couldn't load crew info.
      </div>
    )
  }

  if (view === 'no-crew') {
    return (
      <div className="max-w-md mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-white">Crew</h1>
        <p className="text-steel text-sm -mt-6">You're sailing solo. Create or join a crew.</p>

        {formError && <p className="text-danger text-xs">{formError}</p>}

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <h2 className="text-white font-semibold">Create a Crew</h2>
          <input
            type="text"
            required
            value={crewName}
            onChange={e => setCrewName(e.target.value)}
            placeholder="Crew name"
            className="bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
          <button
            type="submit"
            className="py-2 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
          >
            Create Crew
          </button>
        </form>

        <div className="border-t border-navy-700 pt-6">
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <h2 className="text-white font-semibold">Join a Crew</h2>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Invite code"
              className="bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel font-mono"
            />
            <button
              type="submit"
              className="py-2 border border-steel text-steel rounded hover:text-white hover:border-white transition-colors"
            >
              Join Crew
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{crew!.name}</h1>
          <p className="text-steel text-xs mt-1">
            Invite code:{' '}
            <span className="font-mono text-amber">{crew!.inviteCode}</span>
          </p>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs text-steel hover:text-danger transition-colors"
        >
          Leave crew
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-steel text-xs uppercase tracking-wide border-b border-navy-700">
            <th className="text-left pb-3">Member</th>
            <th className="text-right pb-3">Points</th>
          </tr>
        </thead>
        <tbody>
          {crew!.members.map(m => (
            <tr key={m.id} className="border-b border-navy-700/50">
              <td className="py-3 text-white">{m.username}</td>
              <td className="py-3 text-right text-amber font-mono">{m.points.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/CrewPage.tsx
git commit -m "feat: add CrewPage with create, join, leave, and member list"
```

---

## Task 15: DashboardPage + ProfilePage

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Write `DashboardPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { DashboardStats } from '../lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/api/me/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">
        Welcome back, {user?.username}
      </h1>
      <p className="text-steel text-sm mb-8">Ready to plunder some flags?</p>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <p className="text-steel text-xs uppercase tracking-wide mb-1">Total Points</p>
              <p className="text-amber font-mono text-3xl font-bold">
                {stats.totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <p className="text-steel text-xs uppercase tracking-wide mb-1">Challenges Solved</p>
              <p className="text-white font-mono text-3xl font-bold">
                {stats.solvedChallenges}
                <span className="text-steel text-lg">/{stats.totalChallenges}</span>
              </p>
            </div>
          </div>

          {stats.recentSolves.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Recent Solves</h2>
              <div className="flex flex-col gap-2">
                {stats.recentSolves.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-navy-900 border border-navy-700 rounded px-4 py-3"
                  >
                    <div>
                      <p className="text-white text-sm">{s.challengeTitle}</p>
                      <p className="text-steel text-xs">{s.category}</p>
                    </div>
                    <span className="text-amber font-mono text-sm">+{s.pointsEarned} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <Link
          to="/challenges"
          className="inline-block px-6 py-3 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
        >
          View Challenges →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `ProfilePage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { ProfileStats } from '../lib/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileStats | null>(null)

  useEffect(() => {
    api.get<ProfileStats>('/api/me/profile').then(setProfile).catch(() => {})
  }, [])

  if (!profile) {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">{profile.username}</h1>
      {profile.crewName && (
        <p className="text-steel text-sm mb-8">
          Crew: <span className="text-amber">{profile.crewName}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <p className="text-steel text-xs uppercase tracking-wide mb-1">Total Points</p>
          <p className="text-amber font-mono text-3xl font-bold">
            {profile.totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <p className="text-steel text-xs uppercase tracking-wide mb-1">Challenges Solved</p>
          <p className="text-white font-mono text-3xl font-bold">
            {profile.solvedChallenges}
            <span className="text-steel text-lg">/{profile.totalChallenges}</span>
          </p>
        </div>
      </div>

      {profile.recentSolves.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-4">Solve History</h2>
          <div className="flex flex-col gap-2">
            {profile.recentSolves.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-navy-900 border border-navy-700 rounded px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm">{s.challengeTitle}</p>
                  <p className="text-steel text-xs">{s.category} · {new Date(s.solvedAt).toLocaleDateString()}</p>
                </div>
                <span className="text-amber font-mono text-sm">+{s.pointsEarned} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/ProfilePage.tsx
git commit -m "feat: add DashboardPage and ProfilePage"
```

---

## Task 16: SolveToast + NotFoundPage

**Files:**
- Create: `frontend/src/components/ui/SolveToast.tsx`
- Modify: `frontend/src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Write `SolveToast.tsx`**

```tsx
import { useEffect, useState } from 'react'

interface Props {
  message: string
  onDismiss: () => void
}

export default function SolveToast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, 3000)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-navy-900 border border-success/40 rounded-lg px-5 py-3 shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-success text-lg">🏴‍☠️</span>
      <p className="text-white text-sm">{message}</p>
    </div>
  )
}
```

Usage in `QuestionBlock` and `FlagInput` (optional enhancement — mount `SolveToast` from `ChallengePage` by passing an `onSolve` callback prop to `QuestionBlock`/`FlagInput` if desired. The components already show inline feedback, so `SolveToast` is additive.)

- [ ] **Step 2: Write `NotFoundPage.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 60%, #0d3070 100%)' }}
    >
      <div className="text-8xl mb-6 select-none">🌊</div>
      <h1 className="font-mono font-black italic text-4xl mb-2">
        <span className="text-white">404</span>
      </h1>
      <p className="text-steel mb-8">These waters don't appear on any map.</p>
      <Link
        to="/challenges"
        className="px-6 py-2.5 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
      >
        Back to Challenges
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Run the full test suite one final time**

```bash
npx vitest run
```
Expected: All 15 tests PASS.

- [ ] **Step 4: Final commit**

```bash
git add frontend/src/components/ui/SolveToast.tsx frontend/src/pages/NotFoundPage.tsx
git commit -m "feat: add SolveToast notification and 404 page"
```

---

## Manual QA Checklist

Before going live, walk through each item manually with the dev server pointed at a real backend:

- [ ] Register a new account → lands on dashboard
- [ ] Login with existing account → lands on dashboard
- [ ] Visit `/challenges` while logged out → redirects to `/login`
- [ ] Create a crew → crew name appears in TopNav badge
- [ ] Join a crew via invite code
- [ ] Leave a crew
- [ ] Navigate to a category → see challenge cards
- [ ] Open a challenge → two-column layout renders, embed loads
- [ ] Submit a correct guiding question answer → green feedback, input disabled
- [ ] Submit a wrong answer → red feedback, shake animation, input stays enabled
- [ ] Submit the correct flag → "Flag captured!" shown
- [ ] Visit `/bounties` → leaderboard loads, auto-refreshes every 30s
- [ ] Let session expire (delete token from localStorage, reload) → redirects to `/login`
- [ ] Visit `/this-doesnt-exist` → themed 404 page
- [ ] Verify layout is usable on mobile (375px wide)
