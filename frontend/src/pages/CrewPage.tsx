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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">Crew</h1>
          <p className="text-steel text-sm">You're sailing solo. Create or join a crew.</p>
        </div>

        {formError && <p className="text-danger text-xs">{formError}</p>}

        <div className="bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <h2 className="text-white font-semibold mb-1">Create a Crew</h2>
            <input
              type="text"
              required
              value={crewName}
              onChange={e => setCrewName(e.target.value)}
              placeholder="Crew name"
              className="bg-[#040d1a] border border-steel/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal/50 transition-colors"
            />
            <button
              type="submit"
              className="py-2 bg-teal text-navy-950 font-bold rounded-lg hover:bg-teal/90 transition-colors shadow-[0_0_20px_rgba(62,207,190,0.25)]"
            >
              Create Crew
            </button>
          </form>
        </div>

        <div className="bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <h2 className="text-white font-semibold mb-1">Join a Crew</h2>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Invite code"
              className="bg-[#040d1a] border border-steel/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal/50 transition-colors font-mono"
            />
            <button
              type="submit"
              className="py-2 border border-teal/30 text-teal rounded-lg hover:bg-teal/10 hover:border-teal/60 transition-all duration-300"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">
            {crew!.name}
          </h1>
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

      <div className="bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-steel/70 text-xs uppercase tracking-widest border-b border-steel/10">
              <th className="text-left px-5 py-4">Member</th>
              <th className="text-right px-5 py-4">Points</th>
            </tr>
          </thead>
          <tbody>
            {crew!.members.map(m => (
              <tr key={m.id} className="border-b border-steel/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-white">{m.username}</td>
                <td className="px-5 py-3 text-right text-amber font-mono">{m.points.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
