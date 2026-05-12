import type { CrewRank } from '../../lib/types'

interface Props {
  crewRank: CrewRank | null
}

export default function CrewBadge({ crewRank }: Props) {
  if (!crewRank) return null
  return (
    <span
      className="text-xs font-poster"
      style={{ color: '#4a3318', letterSpacing: '0.06em' }}
    >
      Crew: <span style={{ color: '#2a1a08', fontWeight: 700 }}>{crewRank.crewName}</span>
      {' '}·{' '}
      <span style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace', fontWeight: 700 }}>
        #{crewRank.rank}
      </span>
    </span>
  )
}
