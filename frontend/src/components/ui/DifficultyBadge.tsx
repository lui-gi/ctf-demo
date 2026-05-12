interface Props {
  difficulty: 'easy' | 'medium' | 'hard'
}

const config = {
  easy:   {
    label: 'Easy',
    style: { background: 'rgba(61,107,58,0.18)', color: '#2e5a2c',  borderColor: 'rgba(61,107,58,0.55)' },
  },
  medium: {
    label: 'Medium',
    style: { background: 'rgba(201,150,42,0.20)', color: '#7a5a10', borderColor: 'rgba(201,150,42,0.65)' },
  },
  hard:   {
    label: 'Hard',
    style: { background: 'rgba(138,42,31,0.18)', color: '#8a2a1f',  borderColor: 'rgba(138,42,31,0.55)' },
  },
}

export default function DifficultyBadge({ difficulty }: Props) {
  const { label, style } = config[difficulty]
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-sm border font-poster"
      style={{ ...style, letterSpacing: '0.14em', textTransform: 'uppercase' }}
    >
      {label}
    </span>
  )
}
