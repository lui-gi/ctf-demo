import { Link } from 'react-router-dom'
import type { Challenge } from '../../lib/types'
import DifficultyBadge from './DifficultyBadge'

interface Props {
  challenge: Challenge
  categorySlug: string
}

export default function ChallengeCard({ challenge, categorySlug }: Props) {
  return (
    <Link
      to={`/challenges/${categorySlug}/${challenge.slug}`}
      className="relative block parchment-card p-4 transition-all"
      style={{
        opacity: challenge.solved ? 0.78 : 1,
        borderColor: challenge.solved ? '#3d6b3a' : '#c9a96a',
      }}
    >
      <span className="stamp-corner stamp-corner--tl" />
      <span className="stamp-corner stamp-corner--tr" />
      <span className="stamp-corner stamp-corner--bl" />
      <span className="stamp-corner stamp-corner--br" />

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className="font-poster font-bold text-sm"
          style={{ color: challenge.solved ? '#2e5a2c' : '#2a1a08', letterSpacing: '0.03em' }}
        >
          {challenge.solved && <span className="mr-1">✓</span>}
          {challenge.title}
        </h3>
        <span
          className="text-xs shrink-0 font-mono"
          style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace', fontWeight: 700 }}
        >
          {challenge.points} pts
        </span>
      </div>
      <DifficultyBadge difficulty={challenge.difficulty} />
    </Link>
  )
}
