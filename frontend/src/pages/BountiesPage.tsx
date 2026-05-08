import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { BountyEntry } from '../lib/types'
import WantedPoster from '../components/ui/WantedPoster'

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">Bounties</h1>
        <p className="text-steel text-sm">Crew rankings · refreshes every 30 seconds</p>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-steel py-12">
          <p>The seas are rough — couldn't load bounties.</p>
          <button
            onClick={() => { setError(false); fetchBounties() }}
            className="px-4 py-2 border border-steel/20 rounded-lg text-sm hover:border-teal/40 hover:text-white transition-all duration-300"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Wanted posters — top 3 */}
          {top3.length > 0 && (
            <div className="mb-14">
              <p className="text-center text-steel/50 text-xs uppercase tracking-[0.4em] mb-8">Most Wanted</p>
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-10 w-full">
                {/* 2nd place — left column on desktop, 2nd row on mobile */}
                <div className="flex justify-center order-2 md:order-1">
                  {top3[1]
                    ? <WantedPoster entry={top3[1]} size="md" />
                    : <div className="w-52" />}
                </div>
                {/* 1st place — center column on desktop, 1st row on mobile */}
                <div className="flex justify-center order-1 md:order-2">
                  {top3[0] && <WantedPoster entry={top3[0]} size="lg" />}
                </div>
                {/* 3rd place — right column on desktop, 3rd row on mobile */}
                <div className="flex justify-center order-3">
                  {top3[2]
                    ? <WantedPoster entry={top3[2]} size="sm" />
                    : <div className="w-44" />}
                </div>
              </div>
            </div>
          )}

          {/* Full rankings — rank 4+ */}
          {rest.length > 0 && (
            <div>
              <p className="text-steel/50 text-xs uppercase tracking-[0.4em] mb-4">Full Rankings</p>
              <div className="bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-steel/70 text-xs uppercase tracking-widest border-b border-steel/10">
                      <th className="text-left px-5 py-4 w-12">Rank</th>
                      <th className="text-left px-5 py-4">Crew</th>
                      <th className="text-right px-5 py-4">Solves</th>
                      <th className="text-right px-5 py-4">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map(entry => (
                      <tr
                        key={entry.crewId}
                        className={`border-b border-steel/5 transition-colors ${entry.isCurrentCrew ? 'bg-teal/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="px-5 py-3 font-mono text-steel">#{entry.rank}</td>
                        <td className="px-5 py-3">
                          <span className={entry.isCurrentCrew ? 'text-teal font-semibold' : 'text-white'}>
                            {entry.crewName}
                          </span>
                          {entry.isCurrentCrew && <span className="ml-2 text-xs text-steel">(you)</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-steel font-mono">{entry.solveCount}</td>
                        <td className="px-5 py-3 text-right text-amber font-mono font-semibold">
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
