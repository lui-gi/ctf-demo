import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Category } from '../lib/types'
import CategoryCard from '../components/ui/CategoryCard'
import { CompassRose } from '../components/ui/PirateMotifs'

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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 ink-soft">
        <p className="font-poster">The seas are rough — couldn't load challenges.</p>
        <button
          onClick={() => { setError(false); api.get<Category[]>('/api/categories').then(setCategories).catch(() => setError(true)) }}
          className="btn-ink"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10">
      <div className="mb-8 flex items-end gap-4">
        <span style={{ color: '#5a3a1a' }} className="animate-compass">
          <CompassRose size={36} strokeWidth={1.3} />
        </span>
        <div>
          <h1 className="h-poster mb-1" style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            Challenges
          </h1>
          <p className="ink-soft text-sm font-poster" style={{ letterSpacing: '0.06em' }}>
            Select a category to begin your hunt.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  )
}
