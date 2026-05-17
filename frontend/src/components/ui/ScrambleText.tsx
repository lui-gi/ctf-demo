import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'

/* ─── ScrambleText ────────────────────────────────────────────────
   GSAP-driven cipher-decryption hover.

   Two modes:

   - Default (`revealOnHover={false}`): renders the real `text`,
     scrambles briefly on hover, then decrypts back to the real
     text.

   - `revealOnHover={true}`: renders an ENCRYPTED placeholder by
     default (random hex/symbol glyphs that look like ciphertext).
     On hover, decrypts char-by-char to the real `text` and stays
     decrypted. On mouseleave, re-encrypts back to the placeholder.

   Listens for mouseenter / mouseleave on BOTH the element itself
   AND on the nearest `.fx-scramble-host` ancestor — wrap a card in
   that class and every descendant ScrambleText fires together
   when the whole card is hovered.

   Implementation uses a GSAP tween of a proxy `progress` value;
   the rendered DOM is updated via `textContent` inside an
   `onUpdate` callback. This bypasses React's state machine
   entirely, so there are no stale-closure or "didn't fire" bugs
   from rapid hover. Respects prefers-reduced-motion. */

interface ScrambleTextProps {
  text: string
  duration?: number
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
  glyphs?: string
  triggerOnFocus?: boolean
  revealOnHover?: boolean
  /* Decrypt automatically the first time the element scrolls into
     view (IntersectionObserver), instead of waiting for hover. */
  autoReveal?: boolean
  /* ms to wait after entering view before the decrypt fires — used
     to stagger a grid of cards. */
  autoRevealDelay?: number
}

const DEFAULT_GLYPHS = '!@#$%&*+=<>?/\\{}∆ΣΩπ01ABCDEFabcdef'

function encryptedPlaceholder(text: string, glyphs: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 9301 + text.charCodeAt(i) + 49297) % 233280
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      out += ch
      continue
    }
    h = (h * 9301 + 49297) % 233280
    out += glyphs[Math.floor((h / 233280) * glyphs.length)]
  }
  return out
}

export function ScrambleText({
  text,
  duration = 240,
  as: Tag = 'span',
  className,
  style,
  glyphs = DEFAULT_GLYPHS,
  triggerOnFocus = false,
  revealOnHover = false,
  autoReveal = false,
  autoRevealDelay = 0,
}: ScrambleTextProps) {
  const encrypted = useMemo(
    () => encryptedPlaceholder(text, glyphs),
    [text, glyphs],
  )
  const elRef = useRef<HTMLElement | null>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  /* All event-handler logic and animation lives in one useEffect so
     event listeners always see the freshest props via closure. The
     effect re-runs when relevant inputs change. */
  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    /* Set the initial visible text. Anything that decrypts later
       (on hover OR on scroll-into-view) starts as ciphertext. */
    const startsEncrypted = revealOnHover || autoReveal
    el.textContent = startsEncrypted ? encrypted : text

    const runTo = (target: string, useGlyphPool: boolean) => {
      if (!elRef.current) return
      tweenRef.current?.kill()
      if (reduced) {
        elRef.current.textContent = target
        return
      }
      const proxy = { p: 0 }
      tweenRef.current = gsap.to(proxy, {
        p: 1,
        duration: duration / 1000,
        ease: 'power2.out',
        onUpdate: () => {
          if (!elRef.current) return
          const p = proxy.p
          const resolved = Math.floor(p * target.length)
          let next = ''
          for (let i = 0; i < target.length; i++) {
            const ch = target[i]
            if (i < resolved || ch === ' ' || ch === '\n' || ch === '\t') {
              next += ch
            } else if (useGlyphPool) {
              next += glyphs[Math.floor(Math.random() * glyphs.length)]
            } else {
              next += encrypted[i] ?? ch
            }
          }
          elRef.current.textContent = next
        },
        onComplete: () => {
          if (elRef.current) elRef.current.textContent = target
        },
      })
    }

    /* Once a bounty is decrypted, it STAYS decrypted — no re-encrypt
     on mouseleave. For the default (non-revealOnHover) mode, leave is
     a no-op too since the text is already in its final state. */
    const handleEnter = () => runTo(text, true)
    const handleLeave = () => {}

    /* Local listener: hover the element directly. */
    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)
    if (triggerOnFocus) {
      el.addEventListener('focus', handleEnter)
      el.addEventListener('blur', handleLeave)
    }

    /* Host listener: hover the closest `.fx-scramble-host` ancestor
       (the whole card) and fire on every descendant ScrambleText. */
    const host = el.closest<HTMLElement>('.fx-scramble-host')
    if (host && host !== el) {
      host.addEventListener('mouseenter', handleEnter)
      host.addEventListener('mouseleave', handleLeave)
    }

    /* Scroll-into-view auto-decrypt. Fires once, staggered by
       `autoRevealDelay`, then disconnects. Hover still works after. */
    let revealTimer: ReturnType<typeof setTimeout> | undefined
    let observer: IntersectionObserver | undefined
    if (autoReveal) {
      if (reduced || typeof IntersectionObserver === 'undefined') {
        if (elRef.current) elRef.current.textContent = text
      } else {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                observer?.disconnect()
                revealTimer = setTimeout(() => runTo(text, true), autoRevealDelay)
              }
            })
          },
          { threshold: 0.35 },
        )
        observer.observe(el)
      }
    }

    return () => {
      if (revealTimer) clearTimeout(revealTimer)
      observer?.disconnect()
      tweenRef.current?.kill()
      tweenRef.current = null
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
      if (triggerOnFocus) {
        el.removeEventListener('focus', handleEnter)
        el.removeEventListener('blur', handleLeave)
      }
      if (host && host !== el) {
        host.removeEventListener('mouseenter', handleEnter)
        host.removeEventListener('mouseleave', handleLeave)
      }
    }
  }, [text, encrypted, duration, glyphs, revealOnHover, triggerOnFocus, autoReveal, autoRevealDelay])

  return (
    <Tag
      ref={((node: Element | null) => { elRef.current = node as HTMLElement | null }) as never}
      className={className}
      style={{
        /* Force monospace so encrypted glyphs and real letters share
           the same width — no layout jitter as chars swap. */
        fontFamily: revealOnHover
          ? 'var(--font-mono, "Special Elite", ui-monospace, monospace)'
          : undefined,
        ...style,
      }}
    >
      {/* Initial render — useEffect immediately overwrites textContent. */}
      {revealOnHover ? encrypted : text}
    </Tag>
  )
}
