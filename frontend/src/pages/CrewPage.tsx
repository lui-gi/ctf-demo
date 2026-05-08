import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Crew, CrewPreview } from '../lib/types'

type View = 'loading' | 'no-crew' | 'crew' | 'error'
type Tab = 'my-crew' | 'all-crews'

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-teal text-navy-950 shadow-[0_0_12px_rgba(62,207,190,0.3)]'
          : 'text-steel hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew | null>(null)
  const [view, setView] = useState<View>('loading')
  const [crewName, setCrewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [formError, setFormError] = useState('')
  const [tab, setTab] = useState<Tab>('my-crew')
  const [allCrews, setAllCrews] = useState<CrewPreview[]>([])
  const [myCrewId, setMyCrewId] = useState<string | null>(null)
  const [crewsLoading, setCrewsLoading] = useState(false)

  useEffect(() => {
    api.get<Crew | null>('/api/crew')
      .then(res => { setCrew(res); setView(res ? 'crew' : 'no-crew') })
      .catch(() => setView('error'))
  }, [])

  useEffect(() => {
    if (tab !== 'all-crews' || allCrews.length > 0) return
    setCrewsLoading(true)
    api.get<{ crews: CrewPreview[]; myCrewId: string | null }>('/api/crews')
      .then(r => { setAllCrews(r.crews); setMyCrewId(r.myCrewId) })
      .finally(() => setCrewsLoading(false))
  }, [tab])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await api.post<Crew>('/api/crew', { name: crewName })
      setCrew(res)
      setView('crew')
      setAllCrews([])
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
      setAllCrews([])
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
      setAllCrews([])
    } catch {
      setFormError('Could not leave crew.')
    }
  }

  const tabBar = (
    <div className="flex gap-1 bg-[#060f1e]/80 border border-steel/10 rounded-xl p-1 mb-8">
      <TabButton active={tab === 'my-crew'} onClick={() => setTab('my-crew')}>My Crew</TabButton>
      <TabButton active={tab === 'all-crews'} onClick={() => setTab('all-crews')}>All Crews</TabButton>
    </div>
  )

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

  return (
    <div className={`mx-auto w-full px-6 py-10 ${tab === 'all-crews' ? 'max-w-4xl' : 'max-w-2xl'}`}>
      {tabBar}

      {tab === 'my-crew' && view === 'no-crew' && (
        <div className="max-w-md mx-auto flex flex-col gap-8">
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
      )}

      {tab === 'my-crew' && view === 'crew' && (
        <>
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
        </>
      )}

      {tab === 'all-crews' && (
        <>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-6">All Crews</h1>
          {crewsLoading ? (
            <p className="text-steel text-sm text-center py-16">Loading…</p>
          ) : allCrews.length === 0 ? (
            <p className="text-steel text-sm text-center py-16">No crews yet — be the first!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCrews.map(c => {
                const isMine = c.id === myCrewId
                return (
                  <div
                    key={c.id}
                    className={`bg-[#060f1e]/80 backdrop-blur-sm rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] border transition-all ${
                      isMine
                        ? 'border-teal/50 shadow-[0_0_20px_rgba(62,207,190,0.1)]'
                        : 'border-steel/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white font-semibold text-sm truncate">{c.name}</span>
                      {isMine && (
                        <span className="shrink-0 text-[10px] font-bold text-navy-950 bg-teal px-1.5 py-0.5 rounded">YOU</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {c.members.map(username => (
                        <span key={username} className="text-steel text-xs">{username}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
