import { useEffect, useState, useRef } from 'react'

/* ─── useScrollRotation ───────────────────────────────────────
   Returns a rotation angle (degrees) that increments as the user
   scrolls. Throttled with requestAnimationFrame. Useful for a
   nav compass that visually points "down" into the page as you
   descend. Resets to 0 when the user is at the top.

   `pixelsPerTurn` controls how fast the dial spins — default 1200
   means one full rotation per 1200px of scroll. */
export function useScrollRotation(pixelsPerTurn = 1200): number {
  const [deg, setDeg] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDeg(0)
      return
    }

    const tick = () => {
      rafRef.current = 0
      const y = window.scrollY
      setDeg((y / pixelsPerTurn) * 360)
    }
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [pixelsPerTurn])

  return deg
}
