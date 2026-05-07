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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load this category.</p>
        <Link to="/challenges" className="text-amber hover:underline text-sm">← Back to Challenges</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <p className="text-steel text-xs mb-4">
        <Link to="/challenges" className="hover:text-white transition-colors">Challenges</Link>
        {' '}›{' '}
        <span className="text-white">{categoryName}</span>
      </p>
      <h1 className="text-2xl font-bold text-white mb-8">{categoryName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(ch => (
          <ChallengeCard key={ch.slug} challenge={ch} categorySlug={category!} />
        ))}
      </div>
    </div>
  )
}
