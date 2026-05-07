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
      className="group block bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-teal/30 hover:shadow-[0_4px_32px_rgba(62,207,190,0.07)] transition-all duration-300"
    >
      <div className="relative aspect-video bg-[#040d1a] flex items-center justify-center overflow-hidden">
        <span className="text-6xl">{category.icon}</span>
        <img
          src={`/categories/${category.slug}.png`}
          alt=""
          onError={e => e.currentTarget.classList.add('hidden')}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="text-white font-bold text-lg leading-snug mb-0.5 group-hover:text-teal transition-colors duration-300">
          {category.name}
        </h3>
        <p className="text-steel text-xs uppercase tracking-widest mb-4">
          {category.typeName}
        </p>
        <p className="text-steel text-xs mb-2">
          {category.solvedChallenges} / {category.totalChallenges} solved
        </p>
        <div className="w-full h-1.5 bg-steel/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
