import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import SponsorPage from './SponsorPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <SponsorPage />
    </MemoryRouter>
  )
}

describe('SponsorPage', () => {
  it('renders the page heading', () => {
    renderPage()
    expect(screen.getByText('Support the Mission')).toBeInTheDocument()
  })

  it('renders the Sponsor card title and why label', () => {
    renderPage()
    expect(screen.getByText('Sponsor')).toBeInTheDocument()
    expect(screen.getByText('Why Sponsor?')).toBeInTheDocument()
  })

  it('renders the Get Involved card title and why label', () => {
    renderPage()
    expect(screen.getByText('Get Involved')).toBeInTheDocument()
    expect(screen.getByText('Why Get Involved?')).toBeInTheDocument()
  })

  it('renders all three sponsor bullets', () => {
    renderPage()
    expect(screen.getByText('Logo on site, challenges & prize announcements')).toBeInTheDocument()
    expect(screen.getByText('Visibility with hundreds of cybersecurity students')).toBeInTheDocument()
    expect(screen.getByText('Support open, community-run security education')).toBeInTheDocument()
  })

  it('renders all three get involved bullets', () => {
    renderPage()
    expect(screen.getByText('Help organize the competition')).toBeInTheDocument()
    expect(screen.getByText('Join a crew of passionate students')).toBeInTheDocument()
    expect(screen.getByText('Oversee and guide competitors')).toBeInTheDocument()
  })

  it('renders Become a Sponsor CTA as an external link', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /become a sponsor/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('docs.google.com'))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders Get Involved CTA as an external link', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /get involved/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('docs.google.com'))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the home link', () => {
    renderPage()
    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
