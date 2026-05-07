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
      <h1 className="text-2xl font-bold text-white mb-1">{profile.username}</h1>
      {profile.crewName && (
        <p className="text-steel text-sm mb-8">
          Crew: <span className="text-amber">{profile.crewName}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <p className="text-steel text-xs uppercase tracking-wide mb-1">Total Points</p>
          <p className="text-amber font-mono text-3xl font-bold">
            {profile.totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <p className="text-steel text-xs uppercase tracking-wide mb-1">Challenges Solved</p>
          <p className="text-white font-mono text-3xl font-bold">
            {profile.solvedChallenges}
            <span className="text-steel text-lg">/{profile.totalChallenges}</span>
          </p>
        </div>
      </div>

      {profile.recentSolves.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-4">Solve History</h2>
          <div className="flex flex-col gap-2">
            {profile.recentSolves.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-navy-900 border border-navy-700 rounded px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm">{s.challengeTitle}</p>
                  <p className="text-steel text-xs">{s.category} · {new Date(s.solvedAt).toLocaleDateString()}</p>
                </div>
                <span className="text-amber font-mono text-sm">+{s.pointsEarned} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
