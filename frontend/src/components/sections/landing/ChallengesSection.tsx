import { useEffect, useRef, useState } from 'react'
import { CHALLENGES, type Difficulty } from './data'
import s from './ChallengesSection.module.css'

const DIFFICULTY_STYLE: Record<Difficulty, { label: string; ink: string; soft: string }> = {
  easy:   { label: 'Easy',   ink: '#2e6b3a', soft: 'rgba(46, 107, 58, 0.18)' },
  medium: { label: 'Medium', ink: '#b27210', soft: 'rgba(178, 114, 16, 0.20)' },
  hard:   { label: 'Hard',   ink: '#a8302a', soft: 'rgba(168, 48, 42, 0.18)' },
  mixed:  { label: 'Mixed',  ink: '#5e3a8a', soft: 'rgba(94, 58, 138, 0.18)' },
}

function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const cfg = DIFFICULTY_STYLE[difficulty]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginTop: 8,
        padding: '2px 10px',
        background: cfg.soft,
        border: `1.5px solid ${cfg.ink}`,
        borderRadius: 999,
        color: cfg.ink,
        fontFamily: 'var(--font-poster, "IM Fell English SC", serif)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        alignSelf: 'flex-start',
      }}
    >
      {cfg.label}
    </span>
  )
}

/* ─── ChallengesSection ────────────────────────────────────────
   Swordsman-themed grid of 8 challenge categories (7 + 1 sponsored).
   Class names `challenge-card`, `challenge-card--sponsored`, and
   `challenge-card__icon[--sponsored]` are preserved as global class
   names because LandingPage.test.tsx selects them. */
export function ChallengesSection() {
  /* Trigger the slash-line draw + the per-card clip-path reveal
     once the section first enters view. Only fires once. */
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      })
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={s.section}>
      <div className="swirl-backdrop" aria-hidden />
      <div style={{ maxWidth: 'var(--container-wide, 1100px)', margin: '0 auto', position: 'relative' }}>
        {/* Edgeslash — green slash line that draws left-to-right
            ahead of the heading. */}
        {revealed && <span className="fx-sword-line" aria-hidden />}
        <h2 className={`gsap-reveal h-poster ${s.heading}`}>Challenges</h2>
        <p className={`gsap-reveal font-poster ${s.intro}`}>
          Seven challenge categories plus a sponsored track, dozens of challenges, and difficulty
          tiers from gentle to brutal. Pick a category that intrigues you and follow it down until
          something breaks loose.
        </p>
        <div className={s.grid}>
          {CHALLENGES.map(({ name, flavor, Icon, sponsored, difficulty }, i) => {
            return (
            <div
              key={name}
              className={[
                sponsored ? 'challenge-card challenge-card--sponsored' : 'challenge-card',
                'fx-sword-shimmer-host',
                /* Slash-clip reveal — staggered per index. */
                revealed ? 'fx-sword-slash-in' : '',
              ].join(' ')}
              aria-label={sponsored ? `${name} (Sponsored)` : undefined}
              style={{ animationDelay: revealed ? `${i * 0.06}s` : undefined }}
            >
              <span className="stamp-corner stamp-corner--tl" />
              <span className="stamp-corner stamp-corner--tr" />
              <span className="stamp-corner stamp-corner--bl" />
              <span className="stamp-corner stamp-corner--br" />

              {sponsored && (
                <span aria-hidden="true" className={s.sponsoredBadge}>
                  Sponsored
                </span>
              )}
              <div className={sponsored ? 'challenge-card__icon challenge-card__icon--sponsored' : 'challenge-card__icon'}>
                <Icon size={26} strokeWidth={1.5} />
              </div>
              <div className={`font-poster ${s.cardName}`}>{name}</div>
              <DifficultyPill difficulty={difficulty} />
              <div className={`font-poster ${s.cardFlavor}`}>{flavor}</div>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
