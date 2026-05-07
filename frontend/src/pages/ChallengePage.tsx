import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { ChallengeDetail } from '../lib/types'
import DifficultyBadge from '../components/ui/DifficultyBadge'
import QuestionBlock from '../components/ui/QuestionBlock'
import FlagInput from '../components/ui/FlagInput'

export default function ChallengePage() {
  const { category, slug } = useParams<{ category: string; slug: string }>()
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!category || !slug) return
    Promise.all([
      api.get<ChallengeDetail>(`/api/categories/${category}/challenges/${slug}`),
      api.get<{ name: string }>(`/api/categories/${category}`),
    ])
      .then(([ch, cat]) => { setChallenge(ch); setCategoryName(cat.name) })
      .catch(() => setError(true))
  }, [category, slug])

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-steel">
        <p>The seas are rough — couldn't load this challenge.</p>
        <Link to={`/challenges/${category}`} className="text-amber hover:underline text-sm">
          ← Back to {categoryName || 'category'}
        </Link>
      </div>
    )
  }

  if (!challenge) {
    return <div className="flex-1 flex items-center justify-center text-steel text-sm">Loading…</div>
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Left column — embed */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-navy-700 px-8 py-8 gap-4">
        <p className="text-steel text-xs">
          <Link to="/challenges" className="hover:text-white transition-colors">Challenges</Link>
          {' › '}
          <Link to={`/challenges/${category}`} className="hover:text-white transition-colors">
            {categoryName}
          </Link>
          {' › '}
          <span className="text-white">{challenge.title}</span>
        </p>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{challenge.title}</h1>
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <span className="text-amber font-mono text-sm">{challenge.points} pts</span>
            {challenge.flagSolved && (
              <span className="text-success text-xs">🏴‍☠️ Completed</span>
            )}
          </div>
        </div>

        {challenge.downloadUrls.length > 0 && (
          <div>
            <p className="text-steel text-xs mb-2 uppercase tracking-wide">Challenge Files</p>
            <div className="flex flex-col gap-1">
              {challenge.downloadUrls.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber text-sm hover:underline"
                >
                  ↓ {url.split('/').at(-1)}
                </a>
              ))}
            </div>
          </div>
        )}

        {challenge.embedUrl && (
          <iframe
            src={challenge.embedUrl}
            className="flex-1 w-full rounded border border-navy-700 bg-navy-950 min-h-[400px]"
            title={challenge.title}
          />
        )}
      </div>

      {/* Right column — questions */}
      <div className="w-96 shrink-0 flex flex-col overflow-y-auto px-6 py-8 gap-6">
        <h2 className="text-steel text-xs uppercase tracking-widest border-b border-navy-700 pb-3">
          Questions
        </h2>

        {challenge.questions.map((q, i) => (
          <QuestionBlock
            key={q.id}
            id={q.id}
            text={`Q${i + 1} · ${q.text}`}
            endpoint={`/api/categories/${category}/challenges/${slug}/questions/${q.id}`}
            initialSolved={q.solved}
            initialPoints={q.pointsEarned}
          />
        ))}

        <div className="border-t border-navy-700 pt-6">
          <p className="text-steel text-xs uppercase tracking-widest mb-3">🏴‍☠️ Flag</p>
          <FlagInput
            endpoint={`/api/categories/${category}/challenges/${slug}/flag`}
            initialSolved={challenge.flagSolved}
          />
        </div>
      </div>
    </div>
  )
}
