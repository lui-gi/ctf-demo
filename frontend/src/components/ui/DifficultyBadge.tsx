interface Props {
  difficulty: 'easy' | 'medium' | 'hard'
}

const config = {
  easy:   { label: 'Easy',   className: 'bg-success/20 text-success border-success/30' },
  medium: { label: 'Medium', className: 'bg-amber/20 text-amber border-amber/30' },
  hard:   { label: 'Hard',   className: 'bg-danger/20 text-danger border-danger/30' },
}

export default function DifficultyBadge({ difficulty }: Props) {
  const { label, className } = config[difficulty]
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${className}`}>
      {label}
    </span>
  )
}
