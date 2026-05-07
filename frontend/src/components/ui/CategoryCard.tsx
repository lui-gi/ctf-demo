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
      className="group block bg-navy-900 border border-navy-700 rounded-lg p-5 hover:border-steel transition-colors"
    >
      <div className="text-4xl mb-3">{category.icon}</div>
      <h3 className="text-white font-semibold mb-1 group-hover:text-steel transition-colors">
        {category.name}
      </h3>
      <p className="text-steel text-xs mb-3">
        {category.solvedChallenges} / {category.totalChallenges} solved
      </p>
      <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  )
}
