import { useEffect, useRef, useState } from 'react'

/* ─── CountUp ────────────────────────────────────────────────
   Animates a numeric value from 0 to target over `duration` ms
   when first scrolled into view. Preserves any non-digit prefix
   or suffix in `template` (e.g. "8 hr", "30+") so the visual
   doesn't lose its character.

   Detects:
   - a leading number ("8 hr" → animates 8, suffix " hr")
   - a trailing "+" ("30+" → animates 30, suffix "+")
   - pure digits ("6" → animates 6, no suffix)

   Falls back to the template string verbatim if no number is
   found, or if the user prefers reduced motion.

   Notes on the bug this guards against:
   - The parent passes `onArrived` as an inline arrow function, so
     its identity changes on every parent re-render. We hold it in
     a ref instead of putting it in the effect's deps, so the effect
     only runs when `template` / `duration` actually change.
   - We never reset `display` back to "0" once the count-up has
     started — earlier versions did that on every re-run, which
     made the value flash back to 0 after scrolling away and back. */
export function CountUp({
  template,
  duration = 900,
  onArrived,
}: {
  template: string
  duration?: number
  onArrived?: () => void
}) {
  const elRef = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(template)
  const startedRef = useRef(false)
  const onArrivedRef = useRef(onArrived)

  /* Keep the latest onArrived callback in a ref so the main effect
     doesn't need to re-run when the parent passes a new arrow. */
  useEffect(() => {
    onArrivedRef.current = onArrived
  })

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const match = template.match(/^(\d+)(.*)$/)
    if (!match || reduced) {
      setDisplay(template)
      startedRef.current = true
      onArrivedRef.current?.()
      return
    }
    const target = Number(match[1])
    const suffix = match[2]

    const start = (): void => {
      if (startedRef.current) return
      startedRef.current = true
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        const val = Math.round(eased * target)
        setDisplay(`${val}${suffix}`)
        if (t < 1) requestAnimationFrame(tick)
        else onArrivedRef.current?.()
      }
      requestAnimationFrame(tick)
    }

    /* If we've already finished animating once, don't touch
       display — just exit. This is the key guard against the
       "scroll back up, value resets to 0" bug. */
    if (startedRef.current) return

    if (typeof IntersectionObserver === 'undefined') {
      start()
      return
    }

    /* Synchronous viewport check at mount — if the element is
       already on screen (common on tall viewports / reloads in
       the middle of a page), kick off the animation immediately. */
    const rect = el.getBoundingClientRect()
    const inView =
      rect.top < window.innerHeight &&
      rect.bottom > 0
    if (inView) {
      start()
      return
    }

    /* Otherwise, show 0 until scroll brings the element into view.
       Only set this if we haven't started yet (startedRef checked
       above) so re-mounts after completion don't wipe the value. */
    setDisplay(`0${suffix}`)
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          start()
          obs.disconnect()
        }
      })
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [template, duration])

  return <span ref={elRef}>{display}</span>
}
