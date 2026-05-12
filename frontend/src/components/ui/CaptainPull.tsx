import { useEffect, useRef, type ReactNode } from 'react'

/* ─── Captain — Elastic Reach proximity pull ──────────────────────
   Wraps any element. When the cursor is within ~80px, the element
   translates toward the cursor by up to 6-8px on each axis using
   an elastic ease via CSS (.fx-cap-pull). Detaches cleanly when
   the cursor leaves the threshold.

   Lightweight — single document-level mousemove listener per
   instance, throttled with requestAnimationFrame. Disabled on
   touch/mobile/reduced-motion. */

const MAX_PULL = 7      // pixels
const RADIUS   = 80     // pixels around the element where pull kicks in

export function CaptainPull({
  children,
  as: As = 'span',
  className = '',
  style,
}: {
  children: ReactNode
  /* Render as this element. Default span — change to div if you
     need block layout. */
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    /* Bail entirely on touch or reduced-motion. */
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (touch || reduced) return

    let rafId = 0
    let pending: { x: number; y: number } | null = null

    const apply = () => {
      rafId = 0
      if (!pending || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = pending.x - cx
      const dy = pending.y - cy
      const dist = Math.hypot(dx, dy)
      if (dist > RADIUS) {
        ref.current.style.setProperty('--pull-x', '0px')
        ref.current.style.setProperty('--pull-y', '0px')
        return
      }
      const k = (1 - dist / RADIUS) * MAX_PULL
      const ux = (dx / dist) * k
      const uy = (dy / dist) * k
      ref.current.style.setProperty('--pull-x', `${ux.toFixed(2)}px`)
      ref.current.style.setProperty('--pull-y', `${uy.toFixed(2)}px`)
    }

    const handler = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY }
      if (!rafId) rafId = requestAnimationFrame(apply)
    }

    document.addEventListener('mousemove', handler, { passive: true })
    return () => {
      document.removeEventListener('mousemove', handler)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // @ts-expect-error — polymorphic element ref
  return <As ref={ref} className={`fx-cap-pull ${className}`} style={style}>{children}</As>
}
