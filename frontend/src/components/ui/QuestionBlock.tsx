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

  const borderColor = solved
    ? '#2a7a2a'
    : status === 'incorrect'
    ? '#8a2a1f'
    : '#a3823d'
  const inputColor = solved ? '#1a4d1a' : '#2a1a08'
  const inputBg = solved ? 'rgba(80, 200, 80, 0.18)' : undefined

  return (
    <div className={`flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
      <label htmlFor={id} className="text-lg font-poster font-semibold" style={{ letterSpacing: '0.02em', color: '#2a1a08' }}>
        {text}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={solved ? '✓ Answered' : answer}
          onChange={e => { setAnswer(e.target.value); if (status === 'incorrect') setStatus('idle') }}
          disabled={solved || status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Your answer…"
          className="field-paper flex-1"
          style={{ borderColor, color: inputColor, background: inputBg, boxShadow: solved ? 'inset 0 1px 3px rgba(42, 122, 42, 0.2), 0 3px 0 -1px #2a7a2a' : undefined }}
        />
        {!solved && (
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || !answer.trim()}
            className="btn-ink"
          >
            {status === 'loading' ? '…' : 'Submit'}
          </button>
        )}
      </div>
      {status === 'correct' && (
        <p className="text-base font-poster font-semibold" style={{ color: '#3d6b3a' }}>
          ✓ Correct — {points} pts
        </p>
      )}
      {status === 'incorrect' && (
        <p className="text-base font-poster font-semibold" style={{ color: '#8a2a1f' }}>
          ✗ Incorrect, try again.
        </p>
      )}
    </div>
  )
}
