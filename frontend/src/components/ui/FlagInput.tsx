import { useState } from 'react'
import { api } from '../../lib/api'
import type { SubmitResponse } from '../../lib/types'

interface Props {
  endpoint: string
  initialSolved: boolean
  initialPoints?: number
}

type Status = 'idle' | 'loading' | 'correct' | 'incorrect'

export default function FlagInput({ endpoint, initialSolved, initialPoints = 0 }: Props) {
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState<Status>(initialSolved ? 'correct' : 'idle')
  const [points, setPoints] = useState(initialSolved ? initialPoints : 0)
  const [shake, setShake] = useState(false)

  const solved = status === 'correct'

  async function handleSubmit() {
    if (solved || !flag.trim()) return
    setStatus('loading')
    try {
      const res = await api.post<SubmitResponse>(endpoint, { flag: flag.trim() })
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
  const inputColor = solved
    ? '#1a4d1a'
    : '#8a2a1f'
  const inputBg = solved ? 'rgba(80, 200, 80, 0.18)' : undefined

  return (
    <div className={`flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
      {/* Terminal-prompt header — subtle cyber flavour above the
          input. Reads like the user is at a shell about to submit. */}
      <div
        aria-hidden
        className="font-mono"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono, "Special Elite", monospace)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft, #4a3318)',
        }}
      >
        submit&nbsp;flag
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={flag}
          onChange={e => { setFlag(e.target.value); if (status === 'incorrect') setStatus('idle') }}
          disabled={solved || status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="progctf{...}"
          className="field-paper flex-1"
          style={{ borderColor, color: inputColor, background: inputBg, boxShadow: solved ? 'inset 0 1px 3px rgba(42, 122, 42, 0.2), 0 3px 0 -1px #2a7a2a' : undefined }}
        />
        {!solved && (
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || !flag.trim()}
            className="btn-stamp"
          >
            {status === 'loading' ? '…' : 'Submit Flag'}
          </button>
        )}
      </div>
      {status === 'correct' && (
        <p className="text-base font-poster font-semibold" style={{ color: '#3d6b3a', letterSpacing: '0.1em' }}>
          🏴‍☠️ Flag captured — {points} pts
        </p>
      )}
      {status === 'incorrect' && (
        <p className="text-base font-poster font-semibold" style={{ color: '#8a2a1f', letterSpacing: '0.08em' }}>
          ✗ Incorrect flag, keep digging.
        </p>
      )}
    </div>
  )
}
