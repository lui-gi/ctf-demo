import { useState, useRef, useEffect } from 'react'
import { CountUp } from '../../ui/CountUp'
import { Crosshair } from '../../ui/AbilityPrims'
import { ScrambleText } from '../../ui/ScrambleText'
import {
  CompassRose,
  XSpot,
  JollyRoger,
  Cutlasses,
} from '../../ui/PirateMotifs'
import { useAbilityGate } from '../../../lib/useAbilityGate'
import s from './AboutSection.module.css'

/* ─── AboutSection ─────────────────────────────────────────────
   Reframed as a captain's log entry rising up from the dark water:
   parchment card with four short beats (what it is / what you'll do
   / why it's fun / who it's for), each with a pirate-themed icon.
   A single sniper-style projectile streak crosses the section the
   first time it enters view (kept from the original treatment).

   Stats row below the log keeps its CountUp + Crosshair reticle. */

const BEATS = [
  {
    Icon: CompassRose,
    title: 'What it is',
    copy:
      'A live cybersecurity hunt. Each challenge hides a short string called a "flag." Find it, submit it, score points.',
  },
  {
    Icon: XSpot,
    title: "What you'll do",
    copy:
      'Crack web exploits, decode ciphers, reverse binaries, dig through forensics images, and trace network logs.',
  },
  {
    Icon: JollyRoger,
    title: 'Why it\'s fun',
    copy:
      'Eight hours of "gotcha" moments. Every flag is a tiny puzzle solved and a small piece of the unknown made known.',
  },
  {
    Icon: Cutlasses,
    title: 'Who it\'s for',
    copy:
      'Beginners and sharks alike. Easy challenges come with hints; the hard tier is built to humble the seasoned. Mentors are on the floor.',
  },
]

export function AboutSection() {
  const { ref: gateRef, visible, prefersReduced } = useAbilityGate()
  const [projectileFired, setProjectileFired] = useState(false)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!visible || firedRef.current || prefersReduced) return
    firedRef.current = true
    setProjectileFired(true)
    const id = window.setTimeout(() => setProjectileFired(false), 600)
    return () => window.clearTimeout(id)
  }, [visible, prefersReduced])

  return (
    <section
      ref={gateRef as React.RefObject<HTMLElement>}
      id="about"
      className={s.section}
    >
      {projectileFired && <span className="fx-sniper-projectile" aria-hidden />}

      <div className={s.inner}>
        <h2 className={`gsap-reveal h-poster ${s.heading}`}>
          <ScrambleText text="What is a CTF?" duration={620} />
        </h2>

        {/* Bounty agreement — torn-edge parchment, no clean rectangle.
            Reads as a pinned-up pirate notice rather than a UI card.
            Wrapper holds both the clipped parchment AND the wax seal
            so the seal can hang off the torn bottom edge (clip-path
            on .bounty would otherwise cut the seal off). */}
        <div className={`gsap-reveal ${s.bountyWrap}`}>
          <article
            className={s.bounty}
            aria-label="Bounty agreement: what is a CTF?"
            data-light-on-dark="false"
          >
            <div className={s.bountyHeader}>
              <span className={s.bountyMark}>☠</span>
              <span className={s.bountyTitle}>Articles</span>
              <span className={s.bountyMark}>☠</span>
            </div>
            <div className={s.bountyKicker}>Parley Agreement</div>
            <p className={s.bountyEpigraph}>
              &ldquo;Think of it like being a pirate. You look for clues to find potential treasures.&rdquo;
            </p>

            <ul className={s.beats}>
              {BEATS.map(({ Icon, title, copy }) => (
                <li key={title} className={`log-beat ${s.beat}`}>
                  <span className={s.beatIcon} aria-hidden>
                    <Icon size={28} strokeWidth={1.5} />
                  </span>
                  <div className={s.beatBody}>
                    <h3 className={s.beatTitle}>{title}</h3>
                    <p className={s.beatCopy}>{copy}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className={s.bountyFooter}>
              Runs <strong>8 hours straight</strong>. One sitting, one venue, one chest.
            </p>
          </article>

          {/* Wax seal sits in the WRAPPER, not the clipped article, so it
              can hang off the torn bottom edge unimpeded. */}
          <span className={s.bountySeal} aria-hidden>
            <span className={s.bountySealInner}>PROG · CTF</span>
          </span>
        </div>

        <div className="ctf-stats" style={{ display: 'flex', gap: 40, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center' }}>
          {([
            ['8 hr', 'Live event'],
            ['30+', 'Types of questions'],
            ['6', 'Categories'],
            ['4+', 'Per crew'],
            ['3', 'Difficulty tiers'],
          ] as const).map(([val, label]) => (
            <StatWithReticle key={label} value={val} label={label} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── StatWithReticle ──────────────────────────────────────────
   Single stat block. A crosshair reticle SVG draws around the
   number while the count-up runs, then fades so it lingers but
   doesn't fight the value for attention. */
function StatWithReticle({ value, label }: { value: string; label: string }) {
  const [arrived, setArrived] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDrawing(true)
      return
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setDrawing(true)
          obs.disconnect()
        }
      })
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`ctf-stat ${s.stat}`}>
      {drawing && !arrived && (
        <span
          className="fx-sniper-reticle"
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, calc(-50% - 12px))',
            color: 'var(--role-sniper-ink, #c4b34a)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <Crosshair size={84} strokeWidth={1.5} />
        </span>
      )}

      <div className={s.statValue}>
        <CountUp template={value} onArrived={() => setArrived(true)} />
      </div>
      <div className={s.statLabel}>{label}</div>
    </div>
  )
}
