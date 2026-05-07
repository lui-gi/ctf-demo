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

  return (
    <div className={`flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={flag}
          onChange={e => { setFlag(e.target.value); if (status === 'incorrect') setStatus('idle') }}
          disabled={solved || status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="progctf{...}"
          className={`flex-1 bg-navy-950 border rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors disabled:opacity-60 ${
            solved
              ? 'border-success/50 text-success'
              : status === 'incorrect'
              ? 'border-danger/50 text-white'
              : 'border-amber/40 text-amber focus:border-amber'
          }`}
        />
        {!solved && (
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || !flag.trim()}
            className="px-5 py-2 bg-amber text-navy-950 font-bold text-sm rounded hover:bg-amber/90 disabled:opacity-40 transition-colors"
          >
            {status === 'loading' ? '…' : 'Submit Flag'}
          </button>
        )}
      </div>
      {status === 'correct' && (
        <p className="text-success text-xs font-semibold">🏴‍☠️ Flag captured!</p>
      )}
      {status === 'incorrect' && (
        <p className="text-danger text-xs">✗ Incorrect flag, keep digging.</p>
      )}
    </div>
  )
}
