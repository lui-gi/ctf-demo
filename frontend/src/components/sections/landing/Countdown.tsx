import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Cloud as AbilityCloud } from '../../ui/AbilityPrims'
import { useAbilityGate } from '../../../lib/useAbilityGate'
import { diffParts, pad, type Parts } from './data'
import s from './Countdown.module.css'

/* ─── Countdown ──────────────────────────────────────────────────
   Navigator-themed section. The seconds digit ticks at 1Hz while
   the section is on-screen (we pause the interval when off-screen
   via IntersectionObserver). Each tick triggers a one-shot GSAP
   scale + colour pulse on the seconds digit, plus a 60ms lightning
   flash overlay on the seconds cell (Stormcall ability). Drifting
   cloud SVGs and on-hover wind streaks complete the storm effect. */
export function Countdown() {
  const { ref: gateRef, visible, prefersReduced, isMobile } = useAbilityGate()
  const [t, setT] = useState<Parts>(() => diffParts(Date.now()))
  const secondsRef = useRef<HTMLDivElement>(null)

  /* Pause the seconds ticker when off-screen to save CPU. */
  useEffect(() => {
    if (!visible) return
    const id = window.setInterval(() => setT(diffParts(Date.now())), 1000)
    return () => window.clearInterval(id)
  }, [visible])

  /* Per-tick scale + colour pulse on the seconds digit. */
  useEffect(() => {
    if (!secondsRef.current) return
    gsap.fromTo(
      secondsRef.current,
      { scale: 1.06, color: '#8a2a1f' },
      { scale: 1, color: '#2a1a08', duration: 0.45, ease: 'power3.out' },
    )
  }, [t.seconds])

  const cells = [
    { label: 'Days',    value: pad(t.days)    },
    { label: 'Hours',   value: pad(t.hours)   },
    { label: 'Minutes', value: pad(t.minutes) },
    { label: 'Seconds', value: pad(t.seconds) },
  ]

  /* Particle counts halved on small viewports / touch. */
  const cloudCount = isMobile ? 2 : 4
  const windCount  = isMobile ? 2 : 4
  const renderStormFX = visible && !prefersReduced

  return (
    <section
      ref={gateRef as React.RefObject<HTMLElement>}
      aria-label="Countdown to event day"
      style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}
    >
      <div className="swirl-backdrop" aria-hidden />

      {/* Stormcall — drifting clouds behind the digits. */}
      {renderStormFX && Array.from({ length: cloudCount }).map((_, i) => {
        const top  = 18 + (i * 73) % 60
        const size = 80 + (i * 41) % 60
        return (
          <span
            key={`cloud-${i}`}
            className="fx-nav-cloud"
            style={{
              top: `${top}%`,
              left: `${(i * 27) % 100 - 15}%`,
              width: size * 2,
              animationDuration: `${28 + (i * 11) % 18}s`,
              animationDelay: `${-(i * 4) % 28}s`,
            }}
          >
            <AbilityCloud size={size} strokeWidth={1.2} />
          </span>
        )
      })}

      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <h2 className="gsap-reveal h-poster" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)', fontWeight: 900, marginTop: 22 }}>
          Time Until ProgCTF
        </h2>
        <p className="gsap-reveal ink-soft font-poster" style={{ marginTop: 14, fontSize: 15 }}>
          The voyage begins{' '}
          <span style={{ color: 'var(--role-captain-ink, #8a2a1f)', fontWeight: 700 }}>November 7, 2026</span>.
        </p>

        {t.done ? (
          <p className="h-poster" style={{ marginTop: 56, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'var(--status-ok, #3d6b3a)', fontWeight: 800 }}>
            ProgCTF is live. Hoist the colors.
          </p>
        ) : (
          <ol className={s.grid}>
            {cells.map((c, i) => (
              <li key={c.label} className={`countdown-cell ${s.cell} ${i === 3 ? s.live : ''}`}>
                <span className={`${s.tick} ${s.tickTl}`} />
                <span className={`${s.tick} ${s.tickTr}`} />
                <span className={`${s.tick} ${s.tickBl}`} />
                <span className={`${s.tick} ${s.tickBr}`} />
                <span className={s.midline} aria-hidden />

                {/* Lightning flash — re-mounts on every seconds tick so
                    the keyframe replays from frame 0. */}
                {renderStormFX && i === 3 && (
                  <span key={`flash-${t.seconds}`} className="fx-nav-flash" aria-hidden />
                )}

                {/* Wind streaks — drift on hover only. */}
                {renderStormFX && i === 3 && Array.from({ length: windCount }).map((_, wi) => (
                  <span
                    key={`wind-${wi}`}
                    className="fx-nav-wind"
                    aria-hidden
                    style={{
                      top: `${20 + wi * 18}%`,
                      width: `${60 + (wi * 17) % 40}px`,
                      animationDuration: `${1.6 + (wi * 0.3)}s`,
                      animationDelay: `${-wi * 0.7}s`,
                    }}
                  />
                ))}

                <div ref={i === 3 ? secondsRef : undefined} className={s.value}>{c.value}</div>
                <div className={s.label}>{c.label}</div>
                {i === 3 && <span className={s.liveDot} aria-hidden />}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
