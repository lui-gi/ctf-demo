import type { CrewRank } from '../../lib/types'

interface Props {
  crewRank: CrewRank | null
}

export default function CrewBadge({ crewRank }: Props) {
  if (!crewRank) return null
  return (
    <span className="text-steel text-xs font-bold">
      Crew: <span className="text-white font-semibold">{crewRank.crewName}</span>
      {' '}·{' '}
      <span className="text-amber font-mono">#{crewRank.rank}</span>
    </span>
  )
}
