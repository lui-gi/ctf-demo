import { useState, useRef, useEffect } from 'react'
import { CountUp } from '../../ui/CountUp'
import { Crosshair } from '../../ui/AbilityPrims'
import { useAbilityGate } from '../../../lib/useAbilityGate'

/* ─── AboutSection ─────────────────────────────────────────────
   Sniper-themed "What is a CTF?" explainer + stat row. Each stat
   number counts up on scroll-in, with a generic crosshair reticle
   drawing around it during the count. A single faint projectile
   streak crosses the section background the first time it reveals. */
export function AboutSection() {
  const { ref: gateRef, visible, prefersReduced } = useAbilityGate()
  const [projectileFired, setProjectileFired] = useState(false)
  const firedRef = useRef(false)

  /* Fire the projectile streak once, when the section first enters
     view. Sniper one-shot only, no idle motion. */
  useEffect(() => {
    if (!visible || firedRef.current || prefersReduced) return
    firedRef.current = true
    setProjectileFired(true)
    /* Drop the projectile DOM node after its keyframe finishes. */
    const id = window.setTimeout(() => setProjectileFired(false), 600)
    return () => window.clearTimeout(id)
  }, [visible, prefersReduced])

  return (
    <section
      ref={gateRef as React.RefObject<HTMLElement>}
      id="about"
      style={{ padding: '110px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {projectileFired && (
        <span className="fx-sniper-projectile" aria-hidden />
      )}

      <div style={{ maxWidth: 'var(--container-base, 960px)', margin: '0 auto', position: 'relative' }}>
        <h2 className="gsap-reveal h-poster" style={{ fontSize: 'var(--type-h2, clamp(1.9rem, 4.2vw, 3rem))', fontWeight: 900, marginBottom: 28 }}>
          What is a CTF?
        </h2>
        <p className="ctf-copy font-poster" style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink, #2a1a08)', maxWidth: 720, marginBottom: 22 }}>
          A Capture the Flag is a hands-on cybersecurity competition where crews hunt for hidden
          flags by solving challenges across web exploitation, cryptography, reverse engineering,
          forensics, and binary exploitation. Each flag is a short string buried inside a problem.
          Find it, submit it, score points.
        </p>
        <p className="ctf-copy font-poster" style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink, #2a1a08)', maxWidth: 720 }}>
          ProgCTF runs for{' '}
          <span style={{ color: 'var(--role-captain-ink, #8a2a1f)', fontWeight: 700 }}>8 hours straight</span>.
          One sitting, one venue, one chest. Easy challenges come with hints baked in, the harder
          tier exists to humble even the seasoned crowd, and mentors are on the floor if you stall
          out. Beginners welcome, sharks welcome.
        </p>

        <div className="ctf-stats" style={{ display: 'flex', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
          {([['8 hr', 'Live event'], ['30+', 'Challenges'], ['6', 'Categories'], ['4+', 'Per crew'], ['3', 'Difficulty tiers']] as const).map(([val, label]) => (
            <StatWithReticle key={label} value={val} label={label} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── StatWithReticle ──────────────────────────────────────────
   Single stat block. A crosshair reticle SVG draws around the
   number while the count-up runs, then fades to ~0.4 opacity so
   it lingers but doesn't fight the value for attention. */
function StatWithReticle({ value, label }: { value: string; label: string }) {
  const [arrived, setArrived] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /* Trigger the reticle draw when the stat enters view (same
     threshold as CountUp, so the two animations are synced). */
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
    <div ref={ref} className="ctf-stat" style={{ position: 'relative' }}>
      {/* Reticle overlay — only mounted while the count-up runs. */}
      {drawing && !arrived && (
        <span
          className="fx-sniper-reticle"
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, calc(-50% - 12px))',
            color: 'var(--role-sniper-ink, #6b5d1a)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <Crosshair size={84} strokeWidth={1.5} />
        </span>
      )}

      <div
        style={{
          fontSize: '2.6rem',
          fontWeight: 900,
          color: 'var(--ink, #2a1a08)',
          lineHeight: 1,
          fontFamily: 'var(--font-mono, "Special Elite", monospace)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <CountUp template={value} onArrived={() => setArrived(true)} />
      </div>
      <div
        className="font-poster"
        style={{
          fontSize: 11,
          color: '#6b3a18',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginTop: 6,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {label}
      </div>
    </div>
  )
}
