import { useEffect } from 'react'

const FLAG_KEY = 'progctf:hero-awakened'

/* ─── HeroAwaken ──────────────────────────────────────────────
   On first visit per browser tab, briefly intensify the sun and
   add one extra-hard ship rock. Uses sessionStorage so the moment
   plays once per tab. Targets the sun + ship by selector and
   layers `.fx-awaken-sun` / `.fx-awaken-rock` for the duration of
   each animation; removes them so subsequent visual state is the
   normal idle motion. */
export function HeroAwaken() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(FLAG_KEY)) return
    } catch {
      /* session storage may be unavailable (private mode, etc.) — skip */
      return
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      try { sessionStorage.setItem(FLAG_KEY, '1') } catch {}
      return
    }

    /* Wait a tick so the hero DOM is mounted. */
    const raf = requestAnimationFrame(() => {
      const sun = document.querySelector<HTMLElement>('[aria-hidden] .sun-rays')?.parentElement
        ?? document.querySelector<HTMLElement>('.animate-compass')
      const ship = document.querySelector<HTMLElement>(
        '[class*="shipRide"], .ship-ride',
      )
      if (sun) {
        sun.classList.add('fx-awaken-sun')
        window.setTimeout(() => sun.classList.remove('fx-awaken-sun'), 500)
      }
      if (ship) {
        ship.classList.add('fx-awaken-rock')
        window.setTimeout(() => ship.classList.remove('fx-awaken-rock'), 700)
      }
      try { sessionStorage.setItem(FLAG_KEY, '1') } catch {}
    })

    return () => cancelAnimationFrame(raf)
  }, [])

  return null
}
