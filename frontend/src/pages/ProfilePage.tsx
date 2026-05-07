import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { ProfileStats } from '../lib/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileStats | null>(null)

  useEffect(() => {
    api.get<ProfileStats>('/api/me/profile').then(setProfile).catch(() => {})
  }, [])

  if (!profile) {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">
          {profile.username}
        </h1>
        {profile.crewName && (
          <p className="text-steel text-sm">
            Crew: <span className="text-amber">{profile.crewName}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="group bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-teal/30 hover:shadow-[0_4px_32px_rgba(62,207,190,0.07)] transition-all duration-300">
          <p className="text-steel text-xs uppercase tracking-wider mb-2">Total Points</p>
          <p className="text-amber font-mono text-3xl font-bold group-hover:drop-shadow-[0_0_14px_rgba(62,207,190,0.65)] transition-all duration-300">
            {profile.totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="group bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-teal/30 hover:shadow-[0_4px_32px_rgba(62,207,190,0.07)] transition-all duration-300">
          <p className="text-steel text-xs uppercase tracking-wider mb-2">Challenges Solved</p>
          <p className="text-white font-mono text-3xl font-bold group-hover:drop-shadow-[0_0_14px_rgba(62,207,190,0.65)] transition-all duration-300">
            {profile.solvedChallenges}
            <span className="text-steel text-lg">/{profile.totalChallenges}</span>
          </p>
        </div>
      </div>

      {profile.recentSolves.length > 0 && (
        <div>
          <h2 className="text-steel/70 text-xs font-semibold uppercase tracking-widest mb-4">Solve History</h2>
          <div className="flex flex-col gap-2">
            {profile.recentSolves.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl px-4 py-3 hover:border-teal/20 hover:shadow-[0_2px_16px_rgba(62,207,190,0.05)] transition-all duration-300"
              >
                <div>
                  <p className="text-white text-sm">{s.challengeTitle}</p>
                  <p className="text-steel text-xs">{s.category} · {new Date(s.solvedAt).toLocaleDateString()}</p>
                </div>
                <span className="text-amber font-mono text-sm font-semibold">+{s.pointsEarned} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
