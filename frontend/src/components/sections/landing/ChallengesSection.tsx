import { useEffect, useRef, useState } from 'react'
import { CHALLENGES } from './data'
import { ScrambleText } from '../../ui/ScrambleText'
import { ChallengeDossier } from './ChallengeDossier'
import s from './ChallengesSection.module.css'

type Challenge = (typeof CHALLENGES)[number]

/* Per-card decrypt stagger. Card `i` starts resolving at
   AUTO_REVEAL_BASE_MS + i * CARD_STAGGER_MS so the grid decrypts in
   a left-to-right cascade as it slides in. */
const CARD_STAGGER_MS = 110
const AUTO_REVEAL_BASE_MS = 320

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
  /* Which bounty's dossier is open. null = closed. */
  const [openDossier, setOpenDossier] = useState<Challenge | null>(null)
  /* Track which bounties have been hovered at least once. Once
     revealed, the card stays in its decrypted state forever (text
     color + glow). */
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set())
  const markRevealed = (name: string) => {
    setRevealedCards((prev) => {
      if (prev.has(name)) return prev
      const next = new Set(prev)
      next.add(name)
      return next
    })
  }
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

  /* Once the section is in view, auto-decrypt every card on a stagger
     that matches the per-card slash-in reveal. We flip each card's
     data-revealed flag in lockstep with its ScrambleText delay so the
     terminal-green ciphertext fades to ink ink as it resolves. */
  useEffect(() => {
    if (!revealed) return
    const timers = CHALLENGES.map((c, i) =>
      window.setTimeout(() => markRevealed(c.name), i * CARD_STAGGER_MS + AUTO_REVEAL_BASE_MS),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [revealed])

  return (
    <section ref={sectionRef} className={s.section}>
      <div className="swirl-backdrop" aria-hidden />
      <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative' }}>
        {/* Edgeslash — green slash line that draws left-to-right
            ahead of the heading. */}
        {revealed && <span className="fx-sword-line" aria-hidden />}
        <h2 className={`gsap-reveal h-poster ${s.heading}`}>
          <ScrambleText text="Bounty" duration={560} />
        </h2>
        <p className={`gsap-reveal font-poster ${s.intro}`}>
          Seven bounty categories plus a sponsored track, with dozens of leads to chase. Pick a
          category that intrigues you and follow it down until something breaks loose.
        </p>
        <div className={s.grid}>
          {CHALLENGES.map((challenge, i) => {
            const { name, flavor, Icon, sponsored } = challenge
            const revealDelay = i * CARD_STAGGER_MS + AUTO_REVEAL_BASE_MS
            return (
            <button
              key={name}
              type="button"
              onClick={() => setOpenDossier(challenge)}
              onMouseEnter={() => markRevealed(name)}
              onFocus={() => markRevealed(name)}
              data-revealed={revealedCards.has(name) || undefined}
              className={[
                sponsored ? 'challenge-card challenge-card--sponsored' : 'challenge-card',
                'fx-sword-shimmer-host',
                /* Any descendant <ScrambleText> fires when the card
                   itself is entered (not just the text inside). */
                'fx-scramble-host',
                /* Slash-clip reveal — staggered per index. */
                revealed ? 'fx-sword-slash-in' : '',
                s.cardButton,
              ].join(' ')}
              aria-label={sponsored ? `${name} (Sponsored). Open dossier.` : `Open dossier for ${name}`}
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
              {/* Encrypted by default; hover the card to decrypt name
                  AND flavor. Click to open the full dossier. */}
              <div className={`font-poster ${s.cardName}`}>
                <ScrambleText
                  text={name}
                  duration={600}
                  glyphs="0123456789ABCDEF%/=+!?<>"
                  revealOnHover
                  autoReveal
                  autoRevealDelay={revealDelay}
                />
              </div>
              <div className={`font-poster ${s.cardFlavor}`}>
                <ScrambleText
                  text={flavor}
                  duration={950}
                  glyphs="0123456789ABCDEFabcdef%/=+!?<>{}[]"
                  revealOnHover
                  autoReveal
                  autoRevealDelay={revealDelay + 140}
                />
              </div>
              <span className={s.cardOpenHint} aria-hidden>Click to open</span>
            </button>
            )
          })}
        </div>

        <ChallengeDossier
          challenge={openDossier}
          onClose={() => setOpenDossier(null)}
        />
      </div>
    </section>
  )
}
