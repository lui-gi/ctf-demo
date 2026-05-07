import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { DashboardStats } from '../lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/api/me/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">
        Welcome back, {user?.username}
      </h1>
      <p className="text-steel text-sm mb-8">Ready to plunder some flags?</p>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <p className="text-steel text-xs uppercase tracking-wide mb-1">Total Points</p>
              <p className="text-amber font-mono text-3xl font-bold">
                {stats.totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <p className="text-steel text-xs uppercase tracking-wide mb-1">Challenges Solved</p>
              <p className="text-white font-mono text-3xl font-bold">
                {stats.solvedChallenges}
                <span className="text-steel text-lg">/{stats.totalChallenges}</span>
              </p>
            </div>
          </div>

          {stats.recentSolves.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Recent Solves</h2>
              <div className="flex flex-col gap-2">
                {stats.recentSolves.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-navy-900 border border-navy-700 rounded px-4 py-3"
                  >
                    <div>
                      <p className="text-white text-sm">{s.challengeTitle}</p>
                      <p className="text-steel text-xs">{s.category}</p>
                    </div>
                    <span className="text-amber font-mono text-sm">+{s.pointsEarned} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <Link
          to="/challenges"
          className="inline-block px-6 py-3 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
        >
          View Challenges →
        </Link>
      </div>
    </div>
  )
}
