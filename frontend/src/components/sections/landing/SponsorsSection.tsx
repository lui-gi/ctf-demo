import { TIERS } from './data'
import { ScrambleText } from '../../ui/ScrambleText'
import s from './SponsorsSection.module.css'

/* ScrambleText still used on the section heading below. */

/* ─── SponsorsSection ───────────────────────────────────────────
   Cook-themed sponsor tier grid. Each card uses .fx-sizzle for the
   on-hover warm glow + lift, plus the new Flamekick treatment: a
   heat-haze SVG turbulence overlay on the card edge and 3-5
   randomized flame tips flickering up from the bottom edge. The
   flame particles are only mounted while the card is hovered, so
   they don't burn CPU when idle. */
export function SponsorsSection() {
  return (
    <section className={s.section}>
      <div style={{ maxWidth: 'var(--container-wide, 1100px)', margin: '0 auto' }}>
        <h2 className={`gsap-reveal h-poster ${s.heading}`}>
          <ScrambleText text="Potential Sponsors" duration={620} />
        </h2>
        <p className={`gsap-reveal font-poster ${s.intro}`}>
          These are the tiers we are offering to companies currently in conversation. None of them
          are confirmed yet. Think of this as the shape of the deal, not the roster, and reach out
          if your team would like a place on the manifest.
        </p>
        <div className={s.grid}>
          {TIERS.map((t, i) => (
            <TierCard key={t.name} tier={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TierCard({
  tier,
  index,
}: {
  tier: typeof TIERS[number]
  index: number
}) {
  return (
    <div className={`${s.card} tier-card`} data-light-on-dark="false">
      <span className={s.order} aria-hidden>{String(index + 1).padStart(2, '0')} / 03</span>
      <div className={s.icon}>
        <tier.Icon size={36} strokeWidth={1.4} />
      </div>
      <div className={`h-poster ${s.tierName}`}>{tier.name}</div>
      <div className={`font-poster ${s.tierPitch}`}>{tier.pitch}</div>
      <p className={`font-poster ${s.tierCopy}`}>{tier.copy}</p>
    </div>
  )
}
