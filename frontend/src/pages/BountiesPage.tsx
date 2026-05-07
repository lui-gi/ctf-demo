import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { BountyEntry } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

export default function BountiesPage() {
  const { crewRank } = useAuth()
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

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-10">
      <div className="mb-8">
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
              {entries.map(entry => {
                const isYours = crewRank?.crewName === entry.crewName
                return (
                  <tr
                    key={entry.rank}
                    className={`border-b border-steel/5 transition-colors ${isYours ? 'bg-teal/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-5 py-3 font-mono text-steel">
                      {entry.rank <= 3
                        ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                        : `#${entry.rank}`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={isYours ? 'text-teal font-semibold' : 'text-white'}>
                        {entry.crewName}
                      </span>
                      {isYours && <span className="ml-2 text-xs text-steel">(you)</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-steel font-mono">{entry.solveCount}</td>
                    <td className="px-5 py-3 text-right text-amber font-mono font-semibold">
                      {entry.totalPoints.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
