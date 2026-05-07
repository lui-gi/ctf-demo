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
