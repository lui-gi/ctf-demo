import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { ChallengeDetail } from '../lib/types'
import DifficultyBadge from '../components/ui/DifficultyBadge'
import QuestionBlock from '../components/ui/QuestionBlock'
import FlagInput from '../components/ui/FlagInput'
import { LogPose } from '../components/ui/LogPose'

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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 ink-soft">
        <p className="font-poster">The seas are rough — couldn't load this challenge.</p>
        <Link to={`/challenges/${category}`} className="text-sm font-poster hover:underline" style={{ color: '#8a2a1f' }}>
          ← Back to {categoryName || 'category'}
        </Link>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LogPose label="Charting course" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Left column — embed */}
      <div
        className="flex-1 flex flex-col overflow-y-auto px-8 py-8 gap-4"
        style={{ borderRight: '2px solid #5a3a1a' }}
      >
        <Link
          to={`/challenges/${category}`}
          className="font-poster font-bold hover:underline"
          style={{ fontSize: '0.95rem', letterSpacing: '0.06em', color: '#5a3a1a' }}
        >
          ← Back to {categoryName}
        </Link>

        <div>
          <h1 className="h-poster mb-2" style={{ fontSize: '1.7rem', fontWeight: 800 }}>{challenge.title}</h1>
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <span
              className="text-sm font-mono font-bold"
              style={{ color: '#8a2a1f', fontFamily: '"Special Elite", monospace' }}
            >
              {challenge.points} pts
            </span>
            {challenge.flagSolved && (
              <span className="text-xs font-poster" style={{ color: '#3d6b3a' }}>🏴‍☠️ Completed</span>
            )}
          </div>
        </div>

        {challenge.description && (() => {
          const breakIdx = challenge.description.indexOf('\n\n')
          const intro = breakIdx !== -1 ? challenge.description.slice(0, breakIdx) : challenge.description
          const data  = breakIdx !== -1 ? challenge.description.slice(breakIdx + 2) : null
          return (
            <div className="flex flex-col gap-3">
              <p className="text-xl font-poster font-semibold leading-relaxed" style={{ color: '#2a1a08' }}>{intro}</p>
              {data && (
                <pre
                  className="text-sm leading-relaxed rounded p-4 overflow-x-auto"
                  style={{
                    background: '#1e120a',
                    color: '#d4b483',
                    border: '2px solid #5a3a1a',
                    fontFamily: '"Courier New", Courier, monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >{data}</pre>
              )}
            </div>
          )
        })()}

        {challenge.downloadUrls.length > 0 && (
          <div>
            <p className="text-xs mb-2 uppercase tracking-wide font-poster ink-soft">Challenge Files</p>
            <div className="flex flex-col gap-1">
              {challenge.downloadUrls.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline font-poster"
                  style={{ color: '#8a2a1f' }}
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
            className="flex-1 w-full min-h-[400px] rounded"
            style={{ border: '2px solid #5a3a1a', background: '#f3e2b6' }}
            title={challenge.title}
          />
        )}
      </div>

      {/* Right column — questions */}
      <div className="w-96 shrink-0 flex flex-col overflow-y-auto px-6 py-8 gap-6">
        <h2
          className="text-sm uppercase tracking-widest pb-3 font-poster font-bold"
          style={{ borderBottom: '1.5px solid #c9a96a', color: '#3a2410' }}
        >
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

        <div className="pt-6" style={{ borderTop: '1.5px solid #c9a96a' }}>
          <p className="text-sm uppercase tracking-widest mb-3 font-poster font-bold" style={{ color: '#3a2410' }}>🏴‍☠️ Flag</p>
          <FlagInput
            endpoint={`/api/categories/${category}/challenges/${slug}/flag`}
            initialSolved={challenge.flagSolved}
            initialPoints={challenge.points}
          />
        </div>
      </div>
    </div>
  )
}
