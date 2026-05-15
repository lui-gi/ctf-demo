import { useState } from 'react'
import { api } from '../../lib/api'
import type { Hint, SubmitResponse } from '../../lib/types'

interface Props {
  id: string
  text: string
  endpoint: string
  initialSolved: boolean
  initialPoints: number
  hints: Hint[]
}

type Status = 'idle' | 'loading' | 'correct' | 'incorrect'

export default function QuestionBlock({ id, text, endpoint, initialSolved, initialPoints, hints: initialHints }: Props) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>(initialSolved ? 'correct' : 'idle')
  const [points, setPoints] = useState(initialPoints)
  const [shake, setShake] = useState(false)
  const [hints, setHints] = useState<Hint[]>(initialHints)
  const [revealingHint, setRevealingHint] = useState<string | null>(null)
  const [confirmingHint, setConfirmingHint] = useState<string | null>(null)

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

  async function handleRevealHint(hintId: string) {
    setRevealingHint(hintId)
    try {
      const res = await api.post<{ text: string }>(`/api/hints/${hintId}/reveal`, {})
      setHints(prev => prev.map(h => h.id === hintId ? { ...h, text: res.text } : h))
    } catch { /* ignore */ } finally {
      setRevealingHint(null)
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

      {!solved && hints.length > 0 && (
        <div className="flex flex-col gap-2">
          {hints.map((hint, i) => (
            hint.text !== null ? (
              <div
                key={hint.id}
                className="flex flex-col gap-3 p-4 rounded"
                style={{ background: '#fdf6e3', border: '2px solid #8a2a1f' }}
              >
                <p className="text-lg font-poster font-semibold" style={{ letterSpacing: '0.02em', color: '#3a2410', lineHeight: '1.5' }}>
                  <span className="font-bold">💡 Hint {hints.length > 1 ? i + 1 : ''}:</span> {hint.text}
                </p>
              </div>
            ) : confirmingHint === hint.id ? (
              <div
                key={hint.id}
                className="flex flex-col gap-3 p-4 rounded"
                style={{ background: '#fdf6e3', border: '2px solid #8a2a1f' }}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-poster font-semibold" style={{ letterSpacing: '0.02em', color: '#5a1a10' }}>
                    ⚠ Use a hint?
                  </p>
                  <p className="text-lg font-poster font-semibold" style={{ letterSpacing: '0.02em', color: '#3a2410', lineHeight: '1.5' }}>
                    Revealing this hint will permanently deduct <strong>25%</strong> from the maximum points you can earn for this question.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmingHint(null); handleRevealHint(hint.id) }}
                    disabled={!!revealingHint}
                    className="text-sm font-poster font-bold px-4 py-1.5 rounded"
                    style={{ background: '#8a2a1f', color: '#f3e2b6', cursor: revealingHint ? 'default' : 'pointer' }}
                  >
                    {revealingHint === hint.id ? '…' : 'Yes, reveal hint'}
                  </button>
                  <button
                    onClick={() => setConfirmingHint(null)}
                    className="text-sm font-poster px-4 py-1.5 rounded"
                    style={{ background: 'transparent', border: '1.5px solid #a3823d', color: '#5a3a1a', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={hint.id}
                onClick={() => setConfirmingHint(hint.id)}
                className="btn-ink self-start"
                style={{ background: '#8a2a1f', color: '#f3e2b6' }}
              >
                💡 Get Hint{hints.length > 1 ? ` ${i + 1}` : ''}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}
