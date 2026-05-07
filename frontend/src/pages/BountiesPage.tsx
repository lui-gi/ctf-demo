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
      <h1 className="text-2xl font-bold text-white mb-2">Bounties</h1>
      <p className="text-steel text-sm mb-8">
        Crew rankings · refreshes every 30 seconds
      </p>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-steel py-12">
          <p>The seas are rough — couldn't load bounties.</p>
          <button
            onClick={() => { setError(false); fetchBounties() }}
            className="px-4 py-2 border border-navy-700 rounded text-sm hover:text-white transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-steel text-xs uppercase tracking-wide border-b border-navy-700">
              <th className="text-left pb-3 w-12">Rank</th>
              <th className="text-left pb-3">Crew</th>
              <th className="text-right pb-3">Solves</th>
              <th className="text-right pb-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isYours = crewRank?.crewName === entry.crewName
              return (
                <tr
                  key={entry.rank}
                  className={`border-b border-navy-700/50 ${isYours ? 'bg-amber/5' : ''}`}
                >
                  <td className="py-3 font-mono text-steel">
                    {entry.rank <= 3
                      ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                      : `#${entry.rank}`}
                  </td>
                  <td className="py-3">
                    <span className={isYours ? 'text-amber font-semibold' : 'text-white'}>
                      {entry.crewName}
                    </span>
                    {isYours && <span className="ml-2 text-xs text-steel">(you)</span>}
                  </td>
                  <td className="py-3 text-right text-steel font-mono">{entry.solveCount}</td>
                  <td className="py-3 text-right text-amber font-mono font-semibold">
                    {entry.totalPoints.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
