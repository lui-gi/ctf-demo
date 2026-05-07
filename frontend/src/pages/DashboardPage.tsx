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
    <div className="max-w-5xl mx-auto w-full px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">
          Welcome back, {user?.username}
        </h1>
        <p className="text-steel text-sm">Ready to plunder some flags?</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="group bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-teal/30 hover:shadow-[0_4px_32px_rgba(62,207,190,0.07)] transition-all duration-300">
              <p className="text-steel text-xs uppercase tracking-wider mb-2">Total Points</p>
              <p className="text-amber font-mono text-3xl font-bold group-hover:drop-shadow-[0_0_14px_rgba(62,207,190,0.65)] transition-all duration-300">
                {stats.totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="group bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-teal/30 hover:shadow-[0_4px_32px_rgba(62,207,190,0.07)] transition-all duration-300">
              <p className="text-steel text-xs uppercase tracking-wider mb-2">Challenges Solved</p>
              <p className="text-white font-mono text-3xl font-bold group-hover:drop-shadow-[0_0_14px_rgba(62,207,190,0.65)] transition-all duration-300">
                {stats.solvedChallenges}
                <span className="text-steel text-lg">/{stats.totalChallenges}</span>
              </p>
            </div>
          </div>

          {stats.recentSolves.length > 0 && (
            <div>
              <h2 className="text-steel/70 text-xs font-semibold uppercase tracking-widest mb-4">Recent Solves</h2>
              <div className="flex flex-col gap-2">
                {stats.recentSolves.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl px-4 py-3 hover:border-teal/20 hover:shadow-[0_2px_16px_rgba(62,207,190,0.05)] transition-all duration-300"
                  >
                    <div>
                      <p className="text-white text-sm">{s.challengeTitle}</p>
                      <p className="text-steel text-xs">{s.category}</p>
                    </div>
                    <span className="text-amber font-mono text-sm font-semibold">+{s.pointsEarned} pts</span>
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
          className="inline-block px-6 py-3 bg-teal text-navy-950 font-bold rounded-lg hover:bg-teal/90 transition-colors shadow-[0_0_20px_rgba(62,207,190,0.25)]"
        >
          View Challenges →
        </Link>
      </div>
    </div>
  )
}
