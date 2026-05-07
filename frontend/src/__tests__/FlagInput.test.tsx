import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockPost = vi.hoisted(() => vi.fn())
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
