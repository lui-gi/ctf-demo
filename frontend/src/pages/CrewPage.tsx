import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Crew } from '../lib/types'

type View = 'loading' | 'no-crew' | 'crew' | 'error'

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew | null>(null)
  const [view, setView] = useState<View>('loading')
  const [crewName, setCrewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get<Crew | null>('/api/crew')
      .then(res => { setCrew(res); setView(res ? 'crew' : 'no-crew') })
      .catch(() => setView('error'))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await api.post<Crew>('/api/crew', { name: crewName })
      setCrew(res)
      setView('crew')
    } catch {
      setFormError('Could not create crew. Name may already be taken.')
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await api.post<Crew>('/api/crew/join', { inviteCode })
      setCrew(res)
      setView('crew')
    } catch {
      setFormError('Invalid invite code.')
    }
  }

  async function handleLeave() {
    if (!confirm('Leave your crew?')) return
    try {
      await api.post('/api/crew/leave', {})
      setCrew(null)
      setView('no-crew')
    } catch {
      setFormError('Could not leave crew.')
    }
  }

  if (view === 'loading') {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  if (view === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center text-steel text-sm">
        The seas are rough — couldn't load crew info.
      </div>
    )
  }

  if (view === 'no-crew') {
    return (
      <div className="max-w-md mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-white">Crew</h1>
        <p className="text-steel text-sm -mt-6">You're sailing solo. Create or join a crew.</p>

        {formError && <p className="text-danger text-xs">{formError}</p>}

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <h2 className="text-white font-semibold">Create a Crew</h2>
          <input
            type="text"
            required
            value={crewName}
            onChange={e => setCrewName(e.target.value)}
            placeholder="Crew name"
            className="bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
          <button
            type="submit"
            className="py-2 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
          >
            Create Crew
          </button>
        </form>

        <div className="border-t border-navy-700 pt-6">
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <h2 className="text-white font-semibold">Join a Crew</h2>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Invite code"
              className="bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel font-mono"
            />
            <button
              type="submit"
              className="py-2 border border-steel text-steel rounded hover:text-white hover:border-white transition-colors"
            >
              Join Crew
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{crew!.name}</h1>
          <p className="text-steel text-xs mt-1">
            Invite code:{' '}
            <span className="font-mono text-amber">{crew!.inviteCode}</span>
          </p>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs text-steel hover:text-danger transition-colors"
        >
          Leave crew
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-steel text-xs uppercase tracking-wide border-b border-navy-700">
            <th className="text-left pb-3">Member</th>
            <th className="text-right pb-3">Points</th>
          </tr>
        </thead>
        <tbody>
          {crew!.members.map(m => (
            <tr key={m.id} className="border-b border-navy-700/50">
              <td className="py-3 text-white">{m.username}</td>
              <td className="py-3 text-right text-amber font-mono">{m.points.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
