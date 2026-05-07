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
      className={`block bg-navy-900 border rounded-lg p-4 hover:border-steel transition-colors ${
        challenge.solved ? 'border-success/40 opacity-70' : 'border-navy-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`font-semibold text-sm ${challenge.solved ? 'text-success' : 'text-white'}`}>
          {challenge.solved && <span className="mr-1">✓</span>}
          {challenge.title}
        </h3>
        <span className="text-amber font-mono text-xs shrink-0">{challenge.points} pts</span>
      </div>
      <DifficultyBadge difficulty={challenge.difficulty} />
    </Link>
  )
}
