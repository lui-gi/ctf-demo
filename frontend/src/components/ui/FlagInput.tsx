import { useState } from 'react'
import { api } from '../../lib/api'
import type { SubmitResponse } from '../../lib/types'

interface Props {
  endpoint: string
  initialSolved: boolean
}

type Status = 'idle' | 'loading' | 'correct' | 'incorrect'

export default function FlagInput({ endpoint, initialSolved }: Props) {
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState<Status>(initialSolved ? 'correct' : 'idle')
  const [shake, setShake] = useState(false)

  const solved = status === 'correct'

  async function handleSubmit() {
    if (solved || !flag.trim()) return
    setStatus('loading')
    try {
      const res = await api.post<SubmitResponse>(endpoint, { flag: flag.trim() })
      if (res.correct) {
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
    ? '#3d6b3a'
    : status === 'incorrect'
    ? '#8a2a1f'
    : '#a3823d'
  const inputColor = solved
    ? '#2e5a2c'
    : '#8a2a1f'

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
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft, #4a3318)',
        }}
      >
        <span style={{ color: 'var(--cyber-cursor, #2e6b3a)', fontWeight: 700 }}>$</span>
        submit&nbsp;flag
        <span className="cyber-caret" />
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
          style={{ borderColor, color: inputColor }}
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
        <p className="text-xs font-poster font-semibold" style={{ color: '#3d6b3a', letterSpacing: '0.1em' }}>
          🏴‍☠️ Flag captured!
        </p>
      )}
      {status === 'incorrect' && (
        <p className="text-xs font-poster" style={{ color: '#8a2a1f', letterSpacing: '0.08em' }}>
          ✗ Incorrect flag, keep digging.
        </p>
      )}
    </div>
  )
}
