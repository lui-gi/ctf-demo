import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockPost = vi.hoisted(() => vi.fn())
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
