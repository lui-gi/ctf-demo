import { useState } from 'react'
import { TIERS } from './data'
import { Flame } from '../../ui/AbilityPrims'
import { useAbilityGate } from '../../../lib/useAbilityGate'
import s from './SponsorsSection.module.css'

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
        <h2 className={`gsap-reveal h-poster ${s.heading}`}>Potential Sponsors</h2>
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
  const { isMobile, prefersReduced } = useAbilityGate()
  const [hover, setHover] = useState(false)
  const flameCount = isMobile ? 3 : 5
  const renderFlames = hover && !prefersReduced

  return (
    <div
      className={`${s.card} tier-card fx-sizzle fx-cook-host`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <span className={s.order} aria-hidden>{String(index + 1).padStart(2, '0')} / 03</span>

      {/* Heat-haze overlay on the card edge — opacity gated via :hover
          inside abilities.css so it's a pure CSS transition. */}
      <span className="fx-cook-haze" aria-hidden />

      {/* Flamekick particles — mounted only while hovered. */}
      {renderFlames && Array.from({ length: flameCount }).map((_, fi) => (
        <span
          key={`flame-${fi}`}
          className="fx-cook-flame"
          aria-hidden
          style={{
            left: `${15 + (fi * 19) % 70}%`,
            ['--fx' as string]: `${((fi * 7) % 14) - 7}px`,
            ['--fdur' as string]: `${1.2 + ((fi * 13) % 6) * 0.1}s`,
            animationDelay: `${(fi * 0.13) % 0.6}s`,
          }}
        >
          <Flame size={18} />
        </span>
      ))}

      <div className={s.icon}>
        <tier.Icon size={36} strokeWidth={1.4} />
      </div>
      <div className={`h-poster ${s.tierName}`}>{tier.name}</div>
      <div className={`font-poster ${s.tierPitch}`}>{tier.pitch}</div>
      <p className={`font-poster ${s.tierCopy}`}>{tier.copy}</p>
    </div>
  )
}
