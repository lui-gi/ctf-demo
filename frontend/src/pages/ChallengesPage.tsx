import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Category } from '../lib/types'
import CategoryCard from '../components/ui/CategoryCard'

export default function ChallengesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load challenges.</p>
        <button
          onClick={() => { setError(false); api.get<Category[]>('/api/categories').then(setCategories).catch(() => setError(true)) }}
          className="px-4 py-2 border border-navy-700 rounded text-sm hover:text-white transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Challenges</h1>
      <p className="text-steel text-sm mb-8">Select a category to begin your hunt.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  )
}
