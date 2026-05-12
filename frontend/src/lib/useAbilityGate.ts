/* ─── useAbilityGate ──────────────────────────────────────────────
   Returns whether an ability effect should currently be running.
   The effect runs ONLY when the host element is intersecting the
   viewport AND the user hasn't opted out of motion. This keeps
   off-screen sections from burning CPU on stale animations.

   Also exposes `isMobile` (viewport < 500px) and `prefersReduced`
   so per-section components can halve particle counts / collapse
   to a fade. */

import { useEffect, useRef, useState } from 'react'

interface Gate {
  ref: React.RefObject<HTMLDivElement>
  /** Element is currently within (or near) the viewport. */
  visible: boolean
  /** User has prefers-reduced-motion: reduce set. */
  prefersReduced: boolean
  /** Viewport is narrow enough to halve particle counts. */
  isMobile: boolean
}

export function useAbilityGate(): Gate {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  /* Reduced motion */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mql.matches)
    const handle = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mql.addEventListener('change', handle)
    return () => mql.removeEventListener('change', handle)
  }, [])

  /* Mobile viewport (also halves particle counts on touch devices). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      const narrow = window.innerWidth < 500
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(narrow || touch)
    }
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  /* Visibility — IntersectionObserver, 100px rootMargin so the
     animation kicks in slightly before the section actually scrolls
     into view (no jank). */
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => setVisible(e.isIntersecting)),
      { rootMargin: '100px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible, prefersReduced, isMobile }
}
