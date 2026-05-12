import { useEffect, useRef } from 'react'

/* ─── CursorTrail ─────────────────────────────────────────────
   Drops faint accent-coloured dots behind the cursor. Mounted at
   the app root. Off on touch devices and when prefers-reduced-motion
   is set. */

const SECTION_TINTS: { selector: string; tint: string }[] = [
  { selector: '[id="about"]',                  tint: 'var(--role-sniper-ink, #6b5d1a)' },
  { selector: '.tier-card',                    tint: 'var(--role-cook-ink, #c4541d)' },
  { selector: '.challenge-card',               tint: 'var(--role-swordsman-ink, #2e6b3a)' },
  { selector: '.prize-amount',                 tint: 'var(--role-treasurer-ink, #b27210)' },
  { selector: '.countdown-cell',               tint: 'var(--role-navigator-ink, #1f5f87)' },
]

function currentTint(): string {
  const probeY = window.innerHeight * 0.35
  for (const { selector, tint } of SECTION_TINTS) {
    const elements = document.querySelectorAll<HTMLElement>(selector)
    for (const el of elements) {
      const r = el.getBoundingClientRect()
      if (r.top <= probeY && r.bottom >= probeY) return tint
    }
  }
  return 'var(--role-captain-ink, #a8302a)'
}

export function CursorTrail() {
  const lastSpawnRef = useRef(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return

    const handler = (e: MouseEvent) => {
      const now = performance.now()
      /* ~60fps throttle so we don't spawn 300 dots/sec on a fast move. */
      if (now - lastSpawnRef.current < 16) return
      lastSpawnRef.current = now

      const dot = document.createElement('span')
      dot.className = 'fx-cursor-trail-dot'
      dot.style.left = `${e.clientX}px`
      dot.style.top  = `${e.clientY}px`
      dot.style.background = currentTint()
      document.body.appendChild(dot)
      window.setTimeout(() => dot.remove(), 600)
    }

    document.addEventListener('mousemove', handler, { passive: true })
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return null
}
