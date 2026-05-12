import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { DashboardStats } from '../lib/types'
import { CompassRose } from '../components/ui/PirateMotifs'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/api/me/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-10">
      <div className="mb-8 flex items-end gap-4">
        <span style={{ color: '#5a3a1a' }} className="animate-compass">
          <CompassRose size={42} strokeWidth={1.3} />
        </span>
        <div>
          <h1 className="h-poster mb-1" style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            Welcome back, {user?.username}
          </h1>
          <p className="ink-soft text-sm font-poster" style={{ letterSpacing: '0.06em' }}>
            Ready to plunder some flags?
          </p>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="parchment-card p-5 group transition-all">
              <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
              <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
              <p className="text-xs uppercase tracking-wider mb-2 ink-soft font-poster">Total Bounty</p>
              <p className="font-mono text-3xl font-bold" style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace' }}>
                {stats.totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="parchment-card p-5 transition-all">
              <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
              <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
              <p className="text-xs uppercase tracking-wider mb-2 ink-soft font-poster">Question Completion</p>
              <p className="font-mono text-3xl font-bold" style={{ color: '#2a1a08', fontFamily: '"Special Elite", monospace' }}>
                {(stats.totalQuestions ?? 0) === 0 ? '0' : Math.round(((stats.solvedQuestions ?? 0) / stats.totalQuestions) * 100)}%
              </p>
              <p className="text-xs font-mono mt-1 ink-soft" style={{ fontFamily: '"Special Elite", monospace' }}>
                {stats.solvedQuestions ?? 0} / {stats.totalQuestions ?? 0}
              </p>
            </div>
          </div>

          {(stats.categoryProgress?.length ?? 0) > 0 && (
            <div className="parchment-card p-5 mb-6 relative">
              <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
              <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 ink-soft font-poster">
                Category Breakdown
              </h2>
              <div className="flex flex-col gap-3">
                {stats.categoryProgress.map(cat => {
                  const pct = cat.totalQuestions === 0 ? 0 : Math.round((cat.solvedQuestions / cat.totalQuestions) * 100)
                  return (
                    <div key={cat.slug}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 text-sm font-poster" style={{ color: '#2a1a08' }}>
                          <span>{cat.icon}</span>
                          {cat.name}
                        </span>
                        <span className="text-xs ink-soft font-mono" style={{ fontFamily: '"Special Elite", monospace' }}>
                          {cat.solvedQuestions} / {cat.totalQuestions}
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(90,58,26,0.18)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8a2a1f, #c9962a)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stats.recentSolves.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 ink-soft font-poster">
                Recent Solves
              </h2>
              <div className="flex flex-col gap-2">
                {stats.recentSolves.map((s, i) => (
                  <div key={i} className="parchment-card px-4 py-3 flex items-center justify-between transition-all">
                    <div>
                      <p className="text-sm font-poster" style={{ color: '#2a1a08' }}>{s.challengeTitle}</p>
                      <p className="text-xs ink-soft">{s.category}</p>
                    </div>
                    <span
                      className="text-sm font-semibold font-mono"
                      style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace' }}
                    >
                      +{s.pointsEarned} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <Link to="/challenges" className="btn-stamp">
          View Challenges →
        </Link>
      </div>
    </div>
  )
}
