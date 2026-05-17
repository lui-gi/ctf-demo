import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Coins } from '../../ui/PirateMotifs'
import { ClickSpark } from '../../ui/AbilityPrims'
import { ScrambleText } from '../../ui/ScrambleText'
import { useAbilityGate } from '../../../lib/useAbilityGate'

interface Spark {
  id: number
  x: number
  y: number
}

/* ─── FinalCTA ────────────────────────────────────────────────
   Shipwright-themed close-out section.

   Ironbuild ability:
   - On first scroll-in, a wax-seal "CLEARED TO SAIL" stamp drops
     in next to the heading, rotated and slightly off-axis like a
     real ink stamp. One-shot, never re-triggers.
   - Any button press inside the section spawns a 4-pointed spark at
     the click point. Sparks self-cull after their keyframe ends. */
export function FinalCTA() {
  const { ref: gateRef, visible, prefersReduced } = useAbilityGate()
  const [assembled, setAssembled] = useState(false)
  const assembleFiredRef = useRef(false)
  const [sparks, setSparks] = useState<Spark[]>([])
  const sparkIdRef = useRef(0)

  useEffect(() => {
    if (!visible || assembleFiredRef.current) return
    assembleFiredRef.current = true
    setAssembled(true)
  }, [visible])

  const handleSectionClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced) return
    /* Only fire on button-like targets so spurious clicks don't spam. */
    const target = e.target as HTMLElement
    if (!target.closest('a, button')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++sparkIdRef.current
    setSparks(prev => [...prev, { id, x, y }])
    window.setTimeout(() => {
      setSparks(prev => prev.filter(s => s.id !== id))
    }, 550)
  }, [prefersReduced])

  return (
    <section
      ref={gateRef as React.RefObject<HTMLElement>}
      onClick={handleSectionClick}
      style={{
        /* Bottom padding extended so the full Davy Jones ship is visible
           below the CTA buttons with breathing room. */
        padding: '110px 24px 420px',
        background: 'radial-gradient(60% 80% at 50% 30%, rgba(201, 150, 42, 0.20) 0%, transparent 70%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 'var(--container-narrow, 720px)', margin: '0 auto', position: 'relative', zIndex: 3 }}>
        {/* Ironbuild — wax-seal "Cleared to Sail" stamp drops in
            beside the heading on first scroll into view. */}
        {assembled && !prefersReduced && (
          <span
            aria-hidden
            className="animate-stamp"
            style={{
              position: 'absolute',
              top: 0,
              right: 'max(8%, 12px)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <span className="wax-stamp" style={{ width: 86, height: 86, fontSize: 9 }}>
              Cleared<br />to&nbsp;Sail
            </span>
          </span>
        )}

        {/* Click sparks — spawned at click point. */}
        {sparks.map(sp => (
          <span
            key={sp.id}
            className="fx-ship-spark"
            style={{ left: sp.x, top: sp.y }}
            aria-hidden
          >
            <ClickSpark size={20} />
          </span>
        ))}

        <h2 className="gsap-reveal h-poster" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.6rem)', fontWeight: 900, marginBottom: 14, color: '#fbf6dc', textShadow: '0 2px 4px rgba(0,0,0,0.65), 0 0 22px rgba(140,220,240,0.18)' }}>
          <ScrambleText text="Ready to Sail?" duration={580} />
        </h2>
        <p className="gsap-reveal font-poster" style={{ fontSize: 21.5, fontWeight: 500, color: '#e0eef2', maxWidth: 540, margin: '0 auto 38px', lineHeight: 1.75, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          Registration is free and the manifest is open. Bring a crew, pick a category, and find
          out what you can crack open in eight hours.
        </p>
        <div
          className="gsap-reveal"
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 18,
            justifyContent: 'center',
          }}
        >
          <Link to="/register" className="btn-stamp">
            Board the Ship <Anchor size={16} strokeWidth={1.6} />
          </Link>
          <Link to="/sponsor" className="btn-ink">
            Sponsor or get involved <Coins size={16} strokeWidth={1.5} />
          </Link>
        </div>

      </div>

      {/* Davy Jones — cursed deep-sea menace. Sits flush with the bottom
          of the section with a dark green glow radiating outward and
          concentrating into the bottom edge. */}
      <div className="davy-glow-bed" aria-hidden />
      <img
        src="/assets/davyjonesship.png"
        alt=""
        aria-hidden
        className="davy-ship"
      />
    </section>
  )
}
