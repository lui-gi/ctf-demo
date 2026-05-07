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
