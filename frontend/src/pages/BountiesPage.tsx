import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { BountyEntry } from '../lib/types'
import WantedPoster from '../components/ui/WantedPoster'
import { SectionEyebrow } from '../components/ui/SectionRole'
import { RoleArchaeologist } from '../components/ui/PirateMotifs'

export default function BountiesPage() {
  const [entries, setEntries] = useState<BountyEntry[]>([])
  const [error, setError] = useState(false)

  const fetchBounties = useCallback(() => {
    api.get<BountyEntry[]>('/api/bounties')
      .then(setEntries)
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    fetchBounties()
    const id = setInterval(fetchBounties, 30_000)
    return () => clearInterval(id)
  }, [fetchBounties])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-10">
      <div className="mb-10">
        <SectionEyebrow
          role="archaeologist"
          label="Records of the deep"
          icon={<RoleArchaeologist size={16} strokeWidth={1.8} />}
        />
        <h1 className="h-poster mb-1" style={{ fontSize: '2.2rem', fontWeight: 800 }}>
          Bounties
        </h1>
        <p className="ink-soft text-sm font-poster" style={{ letterSpacing: '0.06em' }}>
          Crew rankings · refreshes every 30 seconds
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 ink-soft py-12">
          <p className="font-poster">The seas are rough — couldn't load bounties.</p>
          <button onClick={() => { setError(false); fetchBounties() }} className="btn-ink">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Wanted posters — top 3 */}
          {top3.length > 0 && (
            <div className="mb-14">
              <p
                className="text-center text-xs uppercase mb-8 font-poster"
                style={{ letterSpacing: '0.4em', color: '#6b3a18' }}
              >
                Most Wanted
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-10 w-full">
                <div className="flex justify-center order-2 md:order-1">
                  {top3[1]
                    ? <WantedPoster entry={top3[1]} size="md" />
                    : <div className="w-52" />}
                </div>
                <div className="flex justify-center order-1 md:order-2">
                  {top3[0] && <WantedPoster entry={top3[0]} size="lg" />}
                </div>
                <div className="flex justify-center order-3">
                  {top3[2]
                    ? <WantedPoster entry={top3[2]} size="sm" />
                    : <div className="w-44" />}
                </div>
              </div>
            </div>
          )}

          {/* Full rankings */}
          {rest.length > 0 && (
            <div>
              <p
                className="text-xs uppercase mb-4 font-poster"
                style={{ letterSpacing: '0.4em', color: '#6b3a18' }}
              >
                Full Rankings
              </p>
              <div className="parchment-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-xs uppercase tracking-widest font-poster ink-soft"
                      style={{ borderBottom: '1.5px solid #c9a96a' }}
                    >
                      <th className="text-left px-5 py-4 w-12">Rank</th>
                      <th className="text-left px-5 py-4">Crew</th>
                      <th className="text-right px-5 py-4">Solves</th>
                      <th className="text-right px-5 py-4">Bounty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map(entry => (
                      <tr
                        key={entry.crewId}
                        className="transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(90,58,26,0.15)',
                          background: entry.isCurrentCrew ? 'rgba(138,42,31,0.10)' : 'transparent',
                        }}
                      >
                        <td className="px-5 py-3 font-mono ink-soft" style={{ fontFamily: '"Special Elite", monospace' }}>
                          #{entry.rank}
                        </td>
                        <td className="px-5 py-3 font-poster">
                          <span style={{
                            color: entry.isCurrentCrew ? '#8a2a1f' : '#2a1a08',
                            fontWeight: entry.isCurrentCrew ? 700 : 500,
                          }}>
                            {entry.crewName}
                          </span>
                          {entry.isCurrentCrew && (
                            <span className="ml-2 text-xs ink-soft">(you)</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right ink-soft font-mono" style={{ fontFamily: '"Special Elite", monospace' }}>
                          {entry.solveCount}
                        </td>
                        <td
                          className="px-5 py-3 text-right font-mono font-bold"
                          style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace' }}
                        >
                          {entry.totalPoints.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
