import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Challenge } from '../lib/types'
import ChallengeCard from '../components/ui/ChallengeCard'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!category) return
    api.get<{ name: string; challenges: Challenge[] }>(`/api/categories/${category}`)
      .then(res => { setCategoryName(res.name); setChallenges(res.challenges) })
      .catch(() => setError(true))
  }, [category])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 ink-soft">
        <p className="font-poster">The seas are rough — couldn't load this category.</p>
        <Link to="/challenges" className="text-sm font-poster hover:underline" style={{ color: '#8a2a1f' }}>
          ← Back to Challenges
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <Link
        to="/challenges"
        className="font-poster font-bold hover:underline mb-4 inline-block"
        style={{ fontSize: '0.95rem', letterSpacing: '0.06em', color: '#5a3a1a' }}
      >
        ← Back to Challenges
      </Link>
      <h1 className="h-poster mb-8" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{categoryName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(ch => (
          <ChallengeCard key={ch.slug} challenge={ch} categorySlug={category!} />
        ))}
      </div>
    </div>
  )
}
