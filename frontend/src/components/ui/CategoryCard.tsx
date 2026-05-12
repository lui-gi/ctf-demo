import { Link } from 'react-router-dom'
import type { Category } from '../../lib/types'

interface Props {
  category: Category
}

export default function CategoryCard({ category }: Props) {
  const pct = category.totalChallenges === 0
    ? 0
    : Math.round((category.solvedChallenges / category.totalChallenges) * 100)

  return (
    <Link
      to={`/challenges/${category.slug}`}
      className="group relative block parchment-card overflow-hidden transition-all"
      style={{ borderColor: '#5a3a1a' }}
    >
      <span className="stamp-corner stamp-corner--tl" />
      <span className="stamp-corner stamp-corner--tr" />
      <span className="stamp-corner stamp-corner--bl" />
      <span className="stamp-corner stamp-corner--br" />

      <div
        className="relative aspect-video flex items-center justify-center overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, #f5e6b8 0%, #d4b865 70%, #b89745 100%)',
          borderBottom: '1.5px solid #5a3a1a',
        }}
      >
        <span className="text-6xl" style={{ filter: 'drop-shadow(0 2px 0 rgba(60,30,5,0.18))' }}>
          {category.icon}
        </span>
        <img
          src={`/categories/${category.slug}.png`}
          alt=""
          onError={e => e.currentTarget.classList.add('hidden')}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'sepia(0.55) contrast(0.92)' }}
        />
      </div>

      <div className="p-5">
        <h3
          className="font-poster font-bold text-lg leading-snug mb-0.5 transition-colors"
          style={{ color: '#2a1a08', letterSpacing: '0.04em' }}
        >
          {category.name}
        </h3>
        <p className="font-poster text-sm mb-4 ink-soft" style={{ letterSpacing: '0.04em' }}>
          {category.typeName}
        </p>
        <p className="text-xs mb-2 ink-soft font-mono" style={{ fontFamily: '"Special Elite", monospace' }}>
          {category.solvedChallenges} / {category.totalChallenges} solved
        </p>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(90,58,26,0.18)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8a2a1f, #c9962a)' }}
          />
        </div>
      </div>
    </Link>
  )
}
