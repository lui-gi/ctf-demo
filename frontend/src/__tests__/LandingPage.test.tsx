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
  })),
}))

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
    renderPage()
    const cards = document.querySelectorAll('.challenge-card')
    expect(cards).toHaveLength(8)
  })
})
