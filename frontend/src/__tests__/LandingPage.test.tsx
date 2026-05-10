// frontend/src/__tests__/LandingPage.test.tsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    crewRank: null,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  })),
}))

// Both mocks are required: LandingPage.tsx imports gsap via two paths —
// `import gsap from 'gsap'` and `import { ScrollTrigger } from 'gsap/ScrollTrigger'`.
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
    fromTo: vi.fn(),
    utils: { toArray: vi.fn(() => []) },
  },
  ScrollTrigger: { getAll: vi.fn(() => []) },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { getAll: vi.fn(() => []) },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage — Patron\'s Plunder card', () => {
  test('renders the Patron\'s Plunder card name', () => {
    renderPage()
    expect(screen.getByText("Patron's Plunder")).toBeInTheDocument()
  })

  test('renders the Sponsored badge', () => {
    renderPage()
    expect(screen.getByText('Sponsored')).toBeInTheDocument()
  })

  test('renders eight challenge cards total', () => {
    const { container } = renderPage()
    const cards = container.querySelectorAll('.challenge-card')
    expect(cards).toHaveLength(8)
  })

  test('Patron\'s Plunder card has the sponsored modifier class', () => {
    const { container } = renderPage()
    const cards = container.querySelectorAll('.challenge-card')
    expect(cards[7]).toHaveClass('challenge-card--sponsored')
  })
})
