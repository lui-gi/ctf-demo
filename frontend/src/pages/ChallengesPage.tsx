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
          className="px-4 py-2 border border-steel/20 rounded-lg text-sm hover:border-teal/40 hover:text-white transition-all duration-300"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">Challenges</h1>
        <p className="text-steel text-sm">Select a category to begin your hunt.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  )
}
