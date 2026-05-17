import { useEffect, useRef } from 'react'
import s from './ChallengeDossier.module.css'
import type { CHALLENGES } from './data'

type Challenge = (typeof CHALLENGES)[number]

interface ChallengeDossierProps {
  challenge: Challenge | null
  onClose: () => void
}

/* ─── ChallengeDossier ────────────────────────────────────────────
   Modal that opens when a bounty card is clicked. Reads like an
   unfolded dossier: heavy parchment panel with a red "OPENED" wax
   seal, the bounty's icon + title + flavor, a longer "Mission
   Brief" paragraph, and a sample-tasks list. Backdrop click + ESC
   close. Body scroll is locked while open. */
export function ChallengeDossier({ challenge, onClose }: ChallengeDossierProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  /* Close on ESC + scroll lock while open. */
  useEffect(() => {
    if (!challenge) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [challenge, onClose])

  if (!challenge) return null

  const { name, flavor, details, examples, Icon, sponsored } = challenge

  return (
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
    >
      <article
        className={s.panel}
        onClick={(e) => e.stopPropagation()}
        data-light-on-dark="false"
      >
        <button
          ref={closeBtnRef}
          className={s.close}
          onClick={onClose}
          aria-label="Close dossier"
        >
          ×
        </button>

        <header className={s.header}>
          <div className={s.icon} aria-hidden>
            <Icon size={42} strokeWidth={1.4} />
          </div>
          <div className={s.headerText}>
            <div className={s.kicker}>
              {sponsored ? 'Sponsored Bounty' : 'Bounty Dossier'}
            </div>
            <h2 id="dossier-title" className={s.title}>{name}</h2>
          </div>
        </header>

        <p className={s.flavor}>{flavor}</p>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Mission Brief</h3>
          <p className={s.body}>{details}</p>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Example Hunts</h3>
          <ul className={s.examples}>
            {examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </section>

        {/* Red wax seal, "OPENED" — sits half off the bottom edge. */}
        <span className={s.seal} aria-hidden>
          <span className={s.sealInner}>Opened</span>
        </span>
      </article>
    </div>
  )
}
