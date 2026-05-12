import { useEffect, useRef, useState } from 'react'

/* ─── ScrollProgressBar ───────────────────────────────────────
   Fixed 3px bar at the top of the viewport. Width tracks scroll
   percentage. Background tints to the role accent of whichever
   section is currently nearest the top of the viewport.

   The bar is opt-out: if the user prefers reduced motion, we
   render a static neutral bar with no tint transitions. */

const SECTION_TINTS: { selector: string; tint: string }[] = [
  /* Order matters — sections checked top-down. */
  { selector: '[id="about"]',                  tint: 'var(--role-sniper-ink, #6b5d1a)' },
  { selector: '.tier-card',                    tint: 'var(--role-cook-ink, #c4541d)' },
  { selector: '.challenge-card',               tint: 'var(--role-swordsman-ink, #2e6b3a)' },
  { selector: '.prize-amount',                 tint: 'var(--role-treasurer-ink, #b27210)' },
  { selector: '.countdown-cell',               tint: 'var(--role-navigator-ink, #1f5f87)' },
  { selector: 'header, nav, [class*="navLogin"]', tint: 'var(--role-captain-ink, #a8302a)' },
]

export function ScrollProgressBar() {
  const [pct, setPct] = useState(0)
  const [tint, setTint] = useState('var(--role-captain-ink, #a8302a)')
  const rafRef = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const compute = () => {
      rafRef.current = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max))
      setPct(ratio * 100)

      if (reduced) return

      /* Pick the tint based on whichever decorated section is
         crossing the top 35% of the viewport. We walk the list in
         order and take the FIRST whose nearest element is within
         the window. */
      const probeY = window.innerHeight * 0.35
      for (const { selector, tint: t } of SECTION_TINTS) {
        const elements = document.querySelectorAll<HTMLElement>(selector)
        for (const el of elements) {
          const r = el.getBoundingClientRect()
          if (r.top <= probeY && r.bottom >= probeY) {
            setTint(t)
            return
          }
        }
      }
    }

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="fx-scroll-progress"
      style={{
        ['--scroll-pct'  as string]: `${pct.toFixed(2)}%`,
        ['--scroll-tint' as string]: tint,
      }}
      aria-hidden
    />
  )
}
