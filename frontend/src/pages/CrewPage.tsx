import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Crew, CrewPreview } from '../lib/types'
import { SectionEyebrow } from '../components/ui/SectionRole'
import { RoleMusician } from '../components/ui/PirateMotifs'
import { Waveform } from '../components/ui/AbilityPrims'
import { LogPose } from '../components/ui/LogPose'

type View = 'loading' | 'no-crew' | 'crew' | 'error'
type Tab = 'my-crew' | 'all-crews'

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-4 rounded-sm font-poster text-sm transition-all duration-200"
      style={{
        background: active ? '#8a2a1f' : 'transparent',
        color: active ? '#f5e8c8' : '#4a3318',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
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
    <div
      className="flex gap-1 p-1 mb-8 rounded-sm"
      style={{
        background: 'rgba(90,58,26,0.10)',
        border: '1.5px solid #c9a96a',
      }}
    >
      <TabButton active={tab === 'my-crew'}   onClick={() => setTab('my-crew')}>My Crew</TabButton>
      <TabButton active={tab === 'all-crews'} onClick={() => setTab('all-crews')}>All Crews</TabButton>
    </div>
  )

  if (view === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LogPose label="Charting course" />
      </div>
    )
  }

  if (view === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center text-sm font-poster ink-soft">
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
            <SectionEyebrow
              role="musician"
              label="A song needs a crew"
              icon={<RoleMusician size={16} strokeWidth={1.8} />}
            />
            <h1 className="h-poster mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Crew</h1>
            <p className="ink-soft text-sm font-poster" style={{ letterSpacing: '0.06em' }}>
              You're sailing solo. Create or join a crew.
            </p>
          </div>

          {formError && <p className="text-xs" style={{ color: '#8a2a1f' }}>{formError}</p>}

          <div className="parchment-card p-6 relative">
            <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
            <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <h2 className="h-poster mb-1" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Found a Crew</h2>
              <input
                type="text"
                required
                value={crewName}
                onChange={e => setCrewName(e.target.value)}
                placeholder="Crew name"
                className="field-paper"
              />
              <button type="submit" className="btn-stamp">Create Crew</button>
            </form>
          </div>

          <div className="parchment-card p-6 relative">
            <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
            <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <h2 className="h-poster mb-1" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Join a Crew</h2>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Invite code"
                className="field-paper"
                style={{ fontFamily: '"Special Elite", monospace' }}
              />
              <button type="submit" className="btn-ink">Join Crew</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'my-crew' && view === 'crew' && (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="h-poster mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {crew!.name}
              </h1>
              <p className="text-xs mt-1 ink-soft font-poster">
                Invite code:{' '}
                <span
                  className="font-mono"
                  style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace', fontWeight: 700 }}
                >
                  {crew!.inviteCode}
                </span>
              </p>
            </div>
            <button
              onClick={handleLeave}
              className="text-xs font-poster transition-colors hover:underline"
              style={{ color: '#4a3318', letterSpacing: '0.08em' }}
            >
              Leave crew
            </button>
          </div>

          <div className="parchment-card overflow-hidden relative">
            <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
            <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs uppercase tracking-widest font-poster ink-soft"
                  style={{ borderBottom: '1.5px solid #c9a96a' }}
                >
                  <th className="text-left px-5 py-4">Member</th>
                  <th className="text-right px-5 py-4">Bounty</th>
                </tr>
              </thead>
              <tbody>
                {crew!.members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(90,58,26,0.15)' }}>
                    <td className="px-5 py-3 font-poster" style={{ color: '#2a1a08' }}>{m.username}</td>
                    <td
                      className="px-5 py-3 text-right font-mono font-bold"
                      style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace' }}
                    >
                      {m.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'all-crews' && (
        <>
          <h1 className="h-poster" style={{ fontSize: '2rem', fontWeight: 800 }}>All Crews</h1>
          {/* Echotone — heading underline animates left-to-right on mount. */}
          <span className="fx-music-underline" aria-hidden style={{ marginBottom: 24 }} />
          {crewsLoading ? (
            <div className="text-center py-16"><LogPose label="Charting course" /></div>
          ) : allCrews.length === 0 ? (
            <p className="text-sm text-center py-16 ink-soft font-poster">No crews yet — be the first!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCrews.map(c => {
                const isMine = c.id === myCrewId
                return (
                  <div
                    key={c.id}
                    className="parchment-card fx-bob fx-music-host p-5 relative overflow-hidden transition-all"
                    style={{ borderColor: isMine ? '#8a2a1f' : '#c9a96a' }}
                  >
                    <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
                    <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />

                    {/* Echotone — waveform along the bottom edge,
                        pulses on hover. */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 14, right: 14, bottom: 8,
                        opacity: 0.55,
                        pointerEvents: 'none',
                      }}
                    >
                      <Waveform bars={isMine ? 16 : 12} height={14} />
                    </span>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-poster font-bold text-sm truncate" style={{ color: '#2a1a08' }}>
                        {c.name}
                      </span>
                      {isMine && (
                        <span
                          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ background: '#8a2a1f', color: '#f5e8c8', letterSpacing: '0.12em' }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {c.members.map(username => (
                        <span key={username} className="text-xs ink-soft font-poster">{username}</span>
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
