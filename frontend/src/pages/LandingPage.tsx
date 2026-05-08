import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Inline SVG icons (no external library) ────────────────────────
   Small, single-stroke, currentColor so callers can re-tint. Chosen
   to live in the existing teal/steel/amber palette without adding
   anything new. */

interface IconProps { size?: number; strokeWidth?: number; className?: string }
const ICON_DEFAULTS = (size = 22, sw = 1.5): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
})
const Compass = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
  </svg>
)
const Anchor = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v15" />
    <path d="M5 12h14" />
    <path d="M5 12c0 5 3 8 7 8s7-3 7-8" />
  </svg>
)
const ShipWheel = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="3" x2="12" y2="9" />
    <line x1="12" y1="15" x2="12" y2="21" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="21" y2="12" />
    <line x1="5.6" y1="5.6" x2="9.9" y2="9.9" />
    <line x1="14.1" y1="14.1" x2="18.4" y2="18.4" />
    <line x1="18.4" y1="5.6" x2="14.1" y2="9.9" />
    <line x1="9.9" y1="14.1" x2="5.6" y2="18.4" />
  </svg>
)
const Swords = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <polyline points="14.5,17.5 3,6 3,3 6,3 17.5,14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5,6.5 18,3 21,3 21,6 17.5,9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </svg>
)
const Coins = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M16.71 13.88l.7.71-2.82 2.82" />
  </svg>
)
const Skull = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <path d="M8 20v2h8v-2" />
    <path d="M12.5 17l-.5-1-.5 1h1z" />
    <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
  </svg>
)
const Flag = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <path d="M4 22V4" />
    <path d="M4 4h12l-2 4 2 4H4" />
  </svg>
)
const Globe = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z" />
  </svg>
)
const Lock = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1" />
  </svg>
)
const Cog = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
const Magnifier = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <line x1="16" y1="16" x2="21" y2="21" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
)
const Bug = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <rect x="8" y="6" width="8" height="14" rx="4" />
    <path d="M12 6V4" />
    <path d="M9 4l-1-2" />
    <path d="M15 4l1-2" />
    <path d="M5 11h3" />
    <path d="M16 11h3" />
    <path d="M5 18h3" />
    <path d="M16 18h3" />
    <path d="M5 14h3" />
    <path d="M16 14h3" />
  </svg>
)
const Spyglass = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <circle cx="9" cy="15" r="5" />
    <path d="M14 11l7-7" />
    <path d="M17 4h4v4" />
    <circle cx="9" cy="15" r="2" />
  </svg>
)
const Scroll = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M21 19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2" />
    <path d="M8 9h8" />
    <path d="M8 13h8" />
  </svg>
)
const Map = ({ size, strokeWidth, className }: IconProps) => (
  <svg {...ICON_DEFAULTS(size, strokeWidth)} className={className} aria-hidden>
    <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)

/* ─── Constants ──────────────────────────────────────────────────── */

// Cutscene timing.
//   0 ─────────── 5500   sky / sun / moon / ship / CTF cross-fade
//   5500 ────── 6300   "Encrypted Treasures" sign spawns in (letter-spacing intake)
//   6300 ────── 7800   sign "unlocks" → gold pop + coin arcs burst from the sign
//   7800              scroll unlocks
const CUTSCENE_MS = 5500
const SIGN_DELAY = 5500
const SIGN_MS = 800
const UNLOCK_DELAY = 6300
const LOCK_MS = 7800

const STARS: [number, number, number][] = [
  [4, 8, 3], [7, 22, 2], [3, 38, 2], [6, 55, 3], [2, 70, 2], [9, 85, 3],
  [14, 93, 2], [11, 45, 2], [18, 30, 3], [16, 65, 2], [22, 78, 2], [5, 95, 3],
  [25, 15, 2], [20, 50, 2], [8, 42, 3], [13, 73, 2], [19, 88, 2], [24, 33, 3],
  [10, 60, 2], [15, 48, 2], [28, 20, 3], [26, 82, 2], [12, 10, 2], [21, 40, 3],
  [17, 57, 2], [23, 67, 2], [6, 77, 3], [29, 5, 2],
]

const CHALLENGES = [
  { name: 'Web Exploitation', flavor: 'Find the cracks in the hull. Bypass auth, abuse logic, and chain bugs into a full takeover.', Icon: Globe },
  { name: 'Cryptography',     flavor: 'Crack ancient codes and modern ciphers. The math is unforgiving, but the loot is sweeter for it.', Icon: Lock },
  { name: 'Reverse Engineering', flavor: 'Tear apart the binary, follow the strings, and figure out what the program is really doing.', Icon: Cog },
  { name: 'Forensics',        flavor: 'Dig through packet dumps, disk images, and memory captures. The evidence is in there somewhere.', Icon: Magnifier },
  { name: 'Binary Exploitation', flavor: 'Smash the stack, hijack the heap, and turn a buggy program into a shell of its former self.', Icon: Bug },
  { name: 'OSINT and Misc.',  flavor: 'Scout the open web, follow the breadcrumbs, and catch what no map will show you.', Icon: Spyglass },
]

const TIERS = [
  {
    name: 'Captain Tier',
    pitch: 'Top of the rigging.',
    copy: 'Your name carries the ship. Logo on the main banner, opening keynote, naming rights on a featured challenge category, and a dedicated booth at the live event for recruiting.',
    Icon: ShipWheel,
    accent: '#ffd76a',
  },
  {
    name: 'Anchor Tier',
    pitch: 'Steady weight, deep reach.',
    copy: 'Logo placement across the event site and stage screens, branded swag in every welcome pack, a recruiting table at finals, and shoutouts across our social channels in the lead-up.',
    Icon: Anchor,
    accent: '#5fffae',
  },
  {
    name: 'Crew Tier',
    pitch: 'Aboard the manifest.',
    copy: 'A confirmed spot on the sponsor manifest, logo on the official site, an invitation to mingle with finalists at the closing ceremony, and a social mention in our recap reel after the event.',
    Icon: Swords,
    accent: '#8ab4e8',
  },
]

const EVENT_AT = new Date('2026-11-07T00:00:00').getTime()

/* ─── Countdown ──────────────────────────────────────────────────── */

interface Parts { days: number; hours: number; minutes: number; seconds: number; done: boolean }

function diffParts(now: number): Parts {
  const ms = EVENT_AT - now
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  }
}

const pad = (n: number) => n.toString().padStart(2, '0')

function Countdown() {
  const [t, setT] = useState<Parts>(() => diffParts(Date.now()))
  const secondsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => setT(diffParts(Date.now())), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Subtle pulse on the seconds digit each tick — sells "live" without
  // distracting from the countdown itself.
  useEffect(() => {
    if (!secondsRef.current) return
    gsap.fromTo(
      secondsRef.current,
      { scale: 1.06, color: '#ffe9a8' },
      { scale: 1, color: '#fff7d4', duration: 0.45, ease: 'power3.out' }
    )
  }, [t.seconds])

  const cells = [
    { label: 'Days', value: pad(t.days) },
    { label: 'Hours', value: pad(t.hours) },
    { label: 'Minutes', value: pad(t.minutes) },
    { label: 'Seconds', value: pad(t.seconds) },
  ]

  return (
    <section
      aria-label="Countdown to event day"
      style={{ padding: '120px 24px', background: '#020820', position: 'relative', overflow: 'hidden' }}
    >
      {/* faint horizon glow at top */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: '0 0 auto 0', height: 80,
          background: 'linear-gradient(180deg, rgba(0,255,136,0.07) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div className="gsap-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, color: 'rgba(255,215,0,0.8)' }}>
          <Compass size={16} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase' }}>
            Set Sail In
          </span>
          <Compass size={16} />
        </div>
        <h2 className="gsap-reveal" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)', fontWeight: 900, color: '#fff', marginTop: 22, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          Time Until ProgCTF
        </h2>
        <p className="gsap-reveal" style={{ marginTop: 14, fontSize: 15, color: '#8ab4e8' }}>
          The voyage begins{' '}
          <span style={{ color: '#ffd76a', fontWeight: 700 }}>November 7, 2026</span>.
        </p>

        {t.done ? (
          <p style={{ marginTop: 56, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#3ecfbe', fontWeight: 800 }}>
            ProgCTF is live. Hoist the colors.
          </p>
        ) : (
          <ol className="countdown-grid">
            {cells.map((c, i) => (
              <li key={c.label} className={`countdown-cell ${i === 3 ? 'countdown-cell--live' : ''}`}>
                <span className="cc-tick cc-tick--tl" />
                <span className="cc-tick cc-tick--tr" />
                <span className="cc-tick cc-tick--bl" />
                <span className="cc-tick cc-tick--br" />
                <span className="cc-midline" aria-hidden />
                <div
                  ref={i === 3 ? secondsRef : undefined}
                  className="cc-value"
                >
                  {c.value}
                </div>
                <div className="cc-label">{c.label}</div>
                {i === 3 && <span className="cc-live" aria-hidden />}
              </li>
            ))}
          </ol>
        )}
      </div>
      <style>{`
        .countdown-grid {
          margin-top: 64px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          list-style: none;
          padding: 0;
        }
        @media (min-width: 720px) {
          .countdown-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 22px;
          }
        }
        .countdown-cell {
          position: relative;
          padding: 44px 14px 30px;
          background:
            linear-gradient(180deg, rgba(255,215,0,0.025) 0%, rgba(0,0,0,0.55) 100%),
            #050a18;
          border: 1px solid rgba(255, 215, 0, 0.14);
          border-radius: 2px;
          box-shadow:
            inset 0 1px 0 rgba(255,215,0,0.08),
            0 30px 80px -40px rgba(0,0,0,0.9);
        }
        .cc-midline {
          position: absolute;
          left: 12%; right: 12%;
          top: 50%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.22), transparent);
          pointer-events: none;
        }
        .cc-value {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-weight: 700;
          font-size: clamp(3.4rem, 9vw, 6.4rem);
          line-height: 0.95;
          color: #fff7d4;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
          text-shadow:
            0 0 18px rgba(255, 215, 0, 0.32),
            0 0 44px rgba(0, 255, 136, 0.10);
          will-change: transform, color;
        }
        .cc-label {
          margin-top: 22px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10.5px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgba(255, 215, 0, 0.66);
        }
        /* gold corner ticks */
        .cc-tick {
          position: absolute;
          width: 12px; height: 12px;
          border-color: rgba(255, 215, 0, 0.55);
          border-style: solid;
          border-width: 0;
          pointer-events: none;
        }
        .cc-tick--tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
        .cc-tick--tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
        .cc-tick--bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
        .cc-tick--br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
        /* live pulse dot on seconds card */
        .countdown-cell--live { border-color: rgba(0, 255, 136, 0.28); }
        .cc-live {
          position: absolute;
          top: 14px; right: 14px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #5fffae;
          box-shadow: 0 0 10px 2px rgba(95, 255, 174, 0.7);
          animation: cc-live-pulse 1.4s ease-in-out infinite;
        }
        @keyframes cc-live-pulse {
          0%, 100% { opacity: 0.45; transform: scale(0.85); }
          50%      { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </section>
  )
}

/* ─── Section divider ────────────────────────────────────────────── */

function SectionDivider() {
  return <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(62,207,190,0.25), transparent)' }} />
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function LandingPage() {
  const scrollToAbout = () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })

  // Lock scroll while the cutscene + sparkle play. Ref guard makes the
  // effect a no-op on dev double-mount so we don't keep re-locking.
  const lockedRef = useRef(false)
  useEffect(() => {
    if (lockedRef.current) return
    lockedRef.current = true
    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const id = window.setTimeout(() => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }, LOCK_MS)
    return () => {
      window.clearTimeout(id)
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  // ─── GSAP scroll entrances (everything below the hero) ──────────
  // Each section's heading + intro paragraphs reveal up-and-fade as
  // they cross 85% of the viewport. Card grids reveal with a stagger.
  // The hero cutscene is intentionally kept on its own pure-CSS
  // timeline; GSAP only kicks in once the user starts scrolling.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const reveal = (selector: string, cfg: gsap.TweenVars = {}) => {
        gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            ...cfg,
          })
        })
      }

      // Headings, eyebrows, supporting paragraphs.
      reveal('.gsap-reveal')

      // Card grids — same trigger as the section but staggered children.
      const stagger = (selector: string, opts: gsap.TweenVars = {}) => {
        const els = gsap.utils.toArray<HTMLElement>(selector)
        if (!els.length) return
        gsap.from(els, {
          opacity: 0,
          y: 36,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: els[0], start: 'top 88%', once: true },
          ...opts,
        })
      }
      stagger('.countdown-cell')
      stagger('.ctf-stat', { y: 18, duration: 0.6, stagger: 0.06 })
      stagger('.challenge-card')
      stagger('.tier-card', { y: 44, duration: 0.85, stagger: 0.12 })

      // Prize amount: scale-up + glow grow as it enters viewport.
      const prize = document.querySelector<HTMLElement>('.prize-amount')
      if (prize) {
        gsap.from(prize, {
          opacity: 0,
          scale: 0.86,
          y: 24,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: prize, start: 'top 82%', once: true },
        })
      }
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 18%, #070f3a 40%, #0c1f6a 58%, #0a1a58 75%, #050d38 90%, #030820 100%)' }}
      >
        {/* Stars (existing night sky element) */}
        <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 1 }}>
          {STARS.map(([top, left, size], i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: 0.25 + (i % 5) * 0.12,
              }}
            />
          ))}
        </div>

        {/* Moon — animates from low-right with an arc into top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 2,
            top: '5%',
            left: '11%',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
            boxShadow: '0 0 50px 28px rgba(255,248,215,0.22), 0 0 110px 60px rgba(200,225,255,0.10)',
            opacity: 0,
            transform: 'scale(0.6)',
            animation: `cs-moonArc ${CUTSCENE_MS}ms cubic-bezier(0.33, 0.66, 0.45, 1) forwards`,
          }}
        />

        {/* Clouds (existing) */}
        <img
          src="/assets/clouds.png"
          alt=""
          className="absolute pointer-events-none select-none w-full"
          style={{ zIndex: 2, top: 0, left: 0, opacity: 0.22, mixBlendMode: 'screen' }}
        />

        {/* Mid-ground hills (existing night silhouette) */}
        <svg
          className="absolute pointer-events-none w-full"
          style={{ zIndex: 3, bottom: '18%', left: 0 }}
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 200 Q180 65 400 115 Q620 165 830 78 Q1030 0 1240 72 Q1360 118 1440 88 L1440 200 Z" fill="#0b1a58" opacity="0.50" />
          <path d="M0 200 Q230 108 460 148 Q680 188 890 118 Q1090 55 1295 122 Q1390 158 1440 138 L1440 200 Z" fill="#0d2070" opacity="0.60" />
        </svg>

        {/* Water surface (existing) */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 3,
            bottom: 0, left: 0, right: 0,
            height: '22%',
            background: 'linear-gradient(180deg, transparent 0%, #05102a 25%, #040d22 60%, #030918 100%)',
          }}
        />

        {/* Moonlight streak (existing) */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 3,
            bottom: '3%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '160px',
            height: '140px',
            background: 'radial-gradient(ellipse at 50% 10%, rgba(255,250,205,0.12) 0%, rgba(255,250,205,0.05) 50%, transparent 100%)',
            filter: 'blur(14px)',
          }}
        />

        {/* ── CUTSCENE: day sky overlay ───────────────────────────────
            Sunset-tinged gradient; opacity decay holds at dusk so the
            night reveals in two stages instead of a smooth wash. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            background:
              'linear-gradient(180deg, #7ec8ff 0%, #a9d8ff 24%, #ffd2a3 50%, #ff9d5e 60%, #1f7aa6 70%, #0e4d77 88%, #c89253 100%)',
            animation: `cs-dayFade ${CUTSCENE_MS}ms cubic-bezier(0.4, 0.0, 0.4, 1) forwards`,
          }}
          aria-hidden
        />

        {/* ── CUTSCENE: warm tint overlay ─────────────────────────────
            Orange/pink wash that fades in at sunset and out at dusk so
            the transition reads as golden hour, not a hard fade. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            background:
              'radial-gradient(80% 60% at 18% 75%, rgba(255,140,80,0.55) 0%, rgba(255,90,120,0.28) 35%, rgba(255,90,120,0) 70%), linear-gradient(180deg, rgba(255,160,80,0) 0%, rgba(255,140,80,0.18) 60%, rgba(180,40,80,0.22) 100%)',
            mixBlendMode: 'screen',
            opacity: 0,
            animation: `cs-warmTint ${CUTSCENE_MS}ms ease-in-out forwards`,
          }}
          aria-hidden
        />

        {/* ── CUTSCENE: sun ───────────────────────────────────────────
            Arcs DOWN-LEFT from upper-right into the lower-left horizon,
            fading as it descends. Sunset, not a swap. */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 5,
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 38% 36%, #fff8e1 0%, #ffd97a 38%, #ff9c3a 75%, rgba(255,140,40,0) 100%)',
            boxShadow:
              '0 0 80px 28px rgba(255,200,90,0.5), 0 0 160px 60px rgba(255,170,80,0.22)',
            top: '18%',
            left: '78%',
            animation: `cs-sunArc ${CUTSCENE_MS}ms cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards`,
          }}
          aria-hidden
        />

        {/* Nav (existing) */}
        <nav className="relative flex items-center justify-end gap-4 px-10 py-4" style={{ zIndex: 10 }}>
          <Link to="/login" className="text-steel text-sm px-4 py-1.5 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm px-4 py-1.5 bg-teal text-black font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
        </nav>

        {/* Content column */}
        <div className="relative flex-1 flex flex-col items-center justify-between pb-16 px-4" style={{ zIndex: 10 }}>
          {/* Wordmark */}
          <div className="flex flex-col items-center text-center pt-2 cs-wordmark-wrap">
            <h1
              className="font-mono font-black italic tracking-wide leading-none mb-3 cs-wordmark"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
            >
              <span className="text-white">prog</span>
              <span
                className="text-teal cs-ctf"
                style={{
                  textShadow: '0 0 24px rgba(62,207,190,0.80), 0 0 55px rgba(62,207,190,0.45), 0 0 100px rgba(62,207,190,0.20)',
                  opacity: 0,
                  display: 'inline-block',
                  animation: `cs-ctfReveal ${CUTSCENE_MS}ms ease-out forwards`,
                }}
              >
                ctf
              </span>
            </h1>

            {/* Encrypted Treasure sign — sits hidden through the
                cutscene + the gold unlock, then spawns in once the
                coins have settled. */}
            <div className="cs-sign relative">
              <p
                className="font-bold text-xs tracking-[0.4em] uppercase cs-sign-text"
                style={{
                  opacity: 0,
                  color: '#d8ffe9',
                  textShadow:
                    '0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)',
                  animation: `cs-signSpawn ${SIGN_MS}ms cubic-bezier(0.16, 0.84, 0.44, 1) ${SIGN_DELAY}ms forwards`,
                }}
              >
                Encrypted Treasures
              </p>
              {/* Treasure unlock pop — fires AFTER the sign has
                  finished settling, so it reads as the sign itself
                  cracking open. */}
              <span
                className="cs-unlock"
                aria-hidden
                style={{ animationDelay: `${UNLOCK_DELAY}ms` }}
              />
              {/* Gold coins — fan out from sign centre on parabolic
                  arcs (rise then settle), gated to the same delay so
                  they spill from the sign once it's in place. */}
              <div className="cs-coin-field" aria-hidden>
                {COINS.map((c, i) => (
                  <span
                    key={i}
                    className="cs-coin"
                    style={{
                      width: c.size,
                      height: c.size,
                      animationDelay: `${UNLOCK_DELAY + c.delay}ms`,
                      // @ts-expect-error CSS custom props
                      '--dx': `${c.dx}px`,
                      '--peak-y': `${c.peakY}px`,
                      '--end-y': `${c.endY}px`,
                      '--spin': `${c.spin}deg`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ship */}
          <div
            style={{
              opacity: 0,
              animation: `cs-shipReveal ${CUTSCENE_MS}ms ease-out forwards`,
            }}
          >
            <div
              style={{
                width: 'clamp(280px, 30vw, 460px)',
                animation: 'shipFloat 7s ease-in-out infinite',
                filter: 'drop-shadow(0 0 44px rgba(62,207,190,0.55)) drop-shadow(0 30px 40px rgba(0,0,0,0.75))',
                transform: 'rotate(15deg)',
              }}
            >
              <img
                src="/assets/progctf-ship-removebg-preview.png"
                alt=""
                className="w-full h-auto pointer-events-none select-none"
              />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={scrollToAbout}
            aria-label="Scroll to about section"
            className="text-white text-4xl hover:opacity-70 transition-opacity"
            style={{
              textShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4)',
              opacity: 0,
              animation: `cs-cueReveal ${CUTSCENE_MS}ms ease-out forwards`,
            }}
          >
            <span aria-hidden="true">↓</span>
          </button>
        </div>

        <style>{`
          @keyframes shipFloat {
            0%, 100% { transform: rotate(15deg) translateY(0px); }
            50%       { transform: rotate(15deg) translateY(-12px); }
          }

          /* ── Cutscene timeline (5500ms total) ────────────────────────
             Phase 1 — sunset (0%–45%):
               Sun arcs down-left, day overlay holds bright with warm
               cast. Day stays at near-full opacity until ~35%.
             Phase 2 — dusk hold (45%–62%):
               Day overlay drops to ~0.55 and HOLDS. Warm tint at peak.
               Night composition (stars, hills, water) starts to peek.
             Phase 3 — full night (62%–100%):
               Day overlay drains to 0; warm tint fades; stars + moon
               climb to full brightness; ship + CTF + green sign reveal.
             Phase 4 — sparkle (5500–7000ms):
               Gold particles around the Encrypted Treasure sign. */

          @keyframes cs-dayFade {
            0%   { opacity: 1; }
            30%  { opacity: 0.98; }
            45%  { opacity: 0.78; }
            55%  { opacity: 0.55; }
            68%  { opacity: 0.55; }   /* dusk hold */
            100% { opacity: 0; }
          }
          @keyframes cs-warmTint {
            0%   { opacity: 0; }
            22%  { opacity: 0.15; }
            42%  { opacity: 0.95; }   /* sunset peak */
            58%  { opacity: 0.7; }    /* dusk fade */
            80%  { opacity: 0.15; }
            100% { opacity: 0; }
          }
          @keyframes cs-sunArc {
            0%   { top: 18%; left: 78%; opacity: 1; }
            22%  { top: 28%; left: 60%; opacity: 0.95; }
            45%  { top: 50%; left: 38%; opacity: 0.78; }
            65%  { top: 68%; left: 22%; opacity: 0.4; }
            82%  { top: 80%; left: 12%; opacity: 0.12; }
            100% { top: 86%; left: 4%;  opacity: 0; }
          }
          @keyframes cs-moonArc {
            0%   { top: 95%; left: 78%; opacity: 0; transform: scale(0.6); }
            38%  { top: 95%; left: 78%; opacity: 0; transform: scale(0.6); }
            55%  { top: 78%; left: 62%; opacity: 0.18; transform: scale(0.78); }
            72%  { top: 42%; left: 40%; opacity: 0.55; transform: scale(0.92); }
            88%  { top: 14%; left: 18%; opacity: 0.92; transform: scale(0.99); }
            100% { top: 5%;  left: 11%; opacity: 1;    transform: scale(1); }
          }
          @keyframes cs-shipReveal {
            0%   { opacity: 0; }
            65%  { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes cs-ctfReveal {
            0%   { opacity: 0; }
            62%  { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes cs-cueReveal {
            0%   { opacity: 0; transform: translateY(8px); }
            70%  { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          /* ── PROGCTF hover ────────────────────────────────────────
             On hover, both words drop their fill and reveal only a
             ghost-green outline so the wordmark reads as carved /
             hollow. Smooth transitions on color + stroke + shadow. */
          .cs-wordmark {
            cursor: pointer;
            transition: filter 0.4s ease;
          }
          .cs-wordmark .text-white,
          .cs-wordmark .cs-ctf {
            -webkit-text-stroke: 0px transparent;
            transition:
              color 0.4s ease,
              text-shadow 0.4s ease,
              -webkit-text-stroke 0.4s ease;
          }
          .cs-wordmark:hover {
            filter: drop-shadow(0 0 16px rgba(0, 255, 136, 0.4));
          }
          .cs-wordmark:hover .text-white,
          .cs-wordmark:hover .cs-ctf {
            color: transparent !important;
            text-shadow: none !important;
            -webkit-text-stroke: 1.4px #00ff88;
          }

          /* ── Treasure unlock (post-cutscene) ──────────────────────
             A quick radial bloom seals the cutscene, then a tight
             cluster of gold coins fans outward in parabolic arcs. */
          .cs-sign { position: relative; }

          .cs-unlock {
            position: absolute;
            top: 50%; left: 50%;
            width: 6px; height: 6px;
            border-radius: 50%;
            background: radial-gradient(circle, #fff8c2 0%, #ffd76a 30%, rgba(255,170,0,0) 70%);
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.4);
            animation: cs-unlock 700ms cubic-bezier(0.18, 0.78, 0.32, 1) forwards;
            pointer-events: none;
          }
          /* Bright pop, then dissolve fast — sells the "chest opens"
             beat without lingering. */
          @keyframes cs-unlock {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
            22%  { opacity: 1; transform: translate(-50%, -50%) scale(14); }
            55%  { opacity: 0.45; transform: translate(-50%, -50%) scale(26); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(34); }
          }

          .cs-coin-field {
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
            pointer-events: none;
          }
          /* Each coin lives at the field's anchor (sign centre) and
             travels along a parabola defined by --dx (horizontal end),
             --peak-y (highest point, negative) and --end-y (settled
             y, positive). --spin gives a subtle tumble. */
          .cs-coin {
            position: absolute;
            top: 0; left: 0;
            margin-top: -50%;
            margin-left: -50%;
            border-radius: 50%;
            background:
              radial-gradient(circle at 38% 36%, #fff8c2 0%, #ffd76a 35%, #c8961a 75%, #7a4f00 100%);
            box-shadow:
              0 0 12px 3px rgba(255,215,0,0.7),
              0 0 28px 8px rgba(255,170,0,0.32),
              inset 0 -2px 3px rgba(120, 70, 0, 0.45);
            opacity: 0;
            animation-name: cs-coin;
            animation-duration: 1500ms;
            animation-timing-function: cubic-bezier(0.18, 0.78, 0.32, 1);
            animation-fill-mode: forwards;
            will-change: transform, opacity;
          }
          @keyframes cs-coin {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
            }
            12% {
              opacity: 1;
              transform:
                translate(calc(-50% + var(--dx) * 0.12), calc(-50% + var(--peak-y) * 0.45))
                scale(1.05) rotate(calc(var(--spin) * 0.3));
            }
            42% {
              opacity: 1;
              transform:
                translate(calc(-50% + var(--dx) * 0.5), calc(-50% + var(--peak-y)))
                scale(1) rotate(calc(var(--spin) * 0.65));
            }
            78% {
              opacity: 0.85;
              transform:
                translate(calc(-50% + var(--dx) * 0.85), calc(-50% + var(--end-y) * 0.7))
                scale(0.92) rotate(calc(var(--spin) * 0.9));
            }
            100% {
              opacity: 0;
              transform:
                translate(calc(-50% + var(--dx)), calc(-50% + var(--end-y)))
                scale(0.7) rotate(var(--spin));
            }
          }

          /* ── Encrypted Treasure sign spawn ────────────────────────
             Lands once the gold has settled. Letter-spacing tightens
             from spread to settled so the type "intakes" into place. */
          @keyframes cs-signSpawn {
            0%   { opacity: 0; transform: translateY(8px); letter-spacing: 0.62em; }
            70%  { opacity: 1; }
            100% { opacity: 1; transform: translateY(0); letter-spacing: 0.4em; }
          }

          /* Reduced motion: collapse the whole cutscene to a quick
             cross-fade so people who opt out aren't held up by a 7s
             scroll lock either. */
          @media (prefers-reduced-motion: reduce) {
            [style*="cs-dayFade"],
            [style*="cs-warmTint"],
            [style*="cs-sunArc"],
            [style*="cs-moonArc"],
            [style*="cs-shipReveal"],
            [style*="cs-ctfReveal"],
            [style*="cs-signSpawn"],
            [style*="cs-cueReveal"] {
              animation-duration: 600ms !important;
            }
            .cs-coin, .cs-unlock { animation-duration: 600ms !important; }
          }
        `}</style>
      </div>

      {/* ── BELOW HERO ── */}
      <div style={{ background: '#010310' }}>
        <SectionDivider />

        {/* 1. Countdown */}
        <Countdown />
        <SectionDivider />

        {/* 2. Prize (moved up — sits right under the countdown so the
            stakes are clear before the explainer copy). */}
        <PrizeSection />
        <SectionDivider />

        {/* 3. What is a CTF? */}
        <section id="about" style={{ padding: '110px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <p className="gsap-reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Map size={14} /> Plain talk
            </p>
            <h2 className="gsap-reveal" style={{ fontSize: 'clamp(1.9rem, 4.2vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 28, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              What is a CTF?
            </h2>
            <p className="ctf-copy" style={{ fontSize: 17, lineHeight: 1.75, color: '#cfd9ee', maxWidth: 720, marginBottom: 22 }}>
              A Capture the Flag is a hands-on cybersecurity competition where crews hunt for hidden flags by
              solving challenges across web exploitation, cryptography, reverse engineering, forensics, and
              binary exploitation. Each flag is a short string buried inside a problem. Find it, submit it,
              score points.
            </p>
            <p className="ctf-copy" style={{ fontSize: 17, lineHeight: 1.75, color: '#cfd9ee', maxWidth: 720 }}>
              ProgCTF runs for{' '}
              <span style={{ color: '#ffd76a', fontWeight: 700 }}>8 hours straight</span>. One sitting, one
              venue, one chest. Easy challenges come with hints baked in, the harder tier exists to humble even
              the seasoned crowd, and mentors are on the floor if you stall out. Beginners welcome, sharks
              welcome.
            </p>
            <div className="ctf-stats" style={{ display: 'flex', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
              {([['8 hr', 'Live event'], ['30+', 'Challenges'], ['6', 'Categories'], ['4+', 'Per crew'], ['3', 'Difficulty tiers']] as const).map(([val, label]) => (
                <div key={label} className="ctf-stat">
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: '"JetBrains Mono", monospace' }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#8ab4e8', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <SectionDivider />

        {/* 3. Challenges */}
        <section style={{ background: '#020820', padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <p className="gsap-reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flag size={14} /> The hunt
            </p>
            <h2 className="gsap-reveal" style={{ fontSize: 'clamp(1.9rem, 4.2vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Challenges
            </h2>
            <p className="gsap-reveal" style={{ fontSize: 15, lineHeight: 1.7, color: '#8ab4e8', maxWidth: 680, marginBottom: 48 }}>
              Six categories, dozens of challenges, and difficulty tiers from gentle to brutal. Pick a category
              that intrigues you and follow it down until something breaks loose.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
              {CHALLENGES.map(({ name, flavor, Icon }) => (
                <div key={name} className="challenge-card">
                  <div className="challenge-card__icon"><Icon size={24} strokeWidth={1.5} /></div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 18 }}>{name}</div>
                  <div style={{ fontSize: 13, color: '#8ab4e8', lineHeight: 1.6, marginTop: 8 }}>{flavor}</div>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            .challenge-card {
              background: #071230;
              border: 1px solid rgba(26,58,106,0.7);
              border-radius: 6px;
              padding: 22px 20px 24px;
              transition: border-color 0.25s, transform 0.35s cubic-bezier(0.2,0.7,0.2,1), box-shadow 0.35s ease;
            }
            .challenge-card:hover {
              transform: translateY(-3px);
              border-color: rgba(62,207,190,0.55);
              box-shadow: 0 18px 40px -24px rgba(62,207,190,0.35);
            }
            .challenge-card__icon {
              width: 44px; height: 44px; border-radius: 8px;
              display: grid; place-items: center;
              background: rgba(62,207,190,0.08);
              border: 1px solid rgba(62,207,190,0.35);
              color: #3ecfbe;
            }
          `}</style>
        </section>
        <SectionDivider />

        {/* 4. Sponsors (single, tier-based) */}
        <section style={{ padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <p className="gsap-reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#ffd76a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scroll size={14} /> The manifest
            </p>
            <h2 className="gsap-reveal" style={{ fontSize: 'clamp(1.9rem, 4.2vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Potential Sponsors
            </h2>
            <p className="gsap-reveal" style={{ fontSize: 15, lineHeight: 1.75, color: '#8ab4e8', maxWidth: 720, marginBottom: 56 }}>
              These are the tiers we are offering to companies currently in conversation. None of them are
              confirmed yet. Think of this as the shape of the deal, not the roster, and reach out if your
              team would like a place on the manifest.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
              {TIERS.map((t, i) => (
                <div key={t.name} className="tier-card">
                  <span className="tier-card__order" aria-hidden>{String(i + 1).padStart(2, '0')} / 03</span>
                  <div className="tier-card__icon" style={{ color: t.accent }}>
                    <t.Icon size={36} strokeWidth={1.4} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 22 }}>{t.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', marginTop: 6, color: t.accent }}>
                    {t.pitch}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#cfd9ee', marginTop: 18 }}>
                    {t.copy}
                  </p>
                  <span className="tier-card__halo" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${t.accent}33 0%, transparent 70%)` }} aria-hidden />
                </div>
              ))}
            </div>
          </div>
          <style>{`
            .tier-card {
              position: relative;
              padding: 30px 26px 28px;
              background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.4)), #050816;
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 6px;
              overflow: hidden;
              transition: transform 0.35s cubic-bezier(0.2,0.7,0.2,1), border-color 0.3s, box-shadow 0.4s ease;
            }
            .tier-card:hover {
              transform: translateY(-4px);
              border-color: rgba(255,215,0,0.35);
              box-shadow: 0 24px 60px -28px rgba(0,255,136,0.18), inset 0 1px 0 rgba(255,215,0,0.18);
            }
            .tier-card__icon {
              width: 70px; height: 70px;
              display: grid; place-items: center;
              border: 1px solid currentColor;
              border-radius: 50%;
              background: rgba(0,0,0,0.4);
              box-shadow: inset 0 0 24px rgba(0,0,0,0.6);
              transition: transform 0.5s ease;
            }
            .tier-card:hover .tier-card__icon { transform: rotate(8deg); }
            .tier-card__order {
              position: absolute; top: 16px; right: 18px;
              font-family: "JetBrains Mono", monospace;
              font-size: 10px; letter-spacing: 0.3em;
              text-transform: uppercase; color: rgba(255,255,255,0.4);
            }
            .tier-card__halo {
              position: absolute; inset: -1px; opacity: 0;
              pointer-events: none; transition: opacity 0.5s ease;
            }
            .tier-card:hover .tier-card__halo { opacity: 1; }
          `}</style>
        </section>
        <SectionDivider />

        {/* 5. Ready to Sail */}
        <section style={{
          padding: '110px 24px 130px',
          background: 'radial-gradient(60% 80% at 50% 30%, rgba(62,207,190,0.10) 0%, transparent 70%), linear-gradient(180deg, #020820 0%, #010310 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
            <div className="gsap-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(62,207,190,0.85)', marginBottom: 22 }}>
              <Skull size={18} />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.36em', textTransform: 'uppercase' }}>
                One sitting. One crew. One chest.
              </span>
              <Skull size={18} />
            </div>
            <h2 className="gsap-reveal" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.6rem)', fontWeight: 900, color: '#fff', marginBottom: 14, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
              Ready to Sail?
            </h2>
            <p className="gsap-reveal" style={{ fontSize: 16, color: '#cfd9ee', maxWidth: 540, margin: '0 auto 38px', lineHeight: 1.7 }}>
              Registration is free and the manifest is open. Bring a crew, pick a category, and find out what
              you can crack open in eight hours.
            </p>
            <div className="gsap-reveal" style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, justifyContent: 'center' }}>
              <Link
                to="/register"
                className="px-9 py-3 bg-teal text-navy-950 font-bold rounded text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                style={{ boxShadow: '0 18px 40px -16px rgba(62,207,190,0.55)' }}
              >
                Board the Ship
                <Anchor size={16} strokeWidth={1.6} />
              </Link>
              <a
                href="mailto:sponsors@progctf.example"
                style={{
                  fontSize: 13,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#8ab4e8',
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                  textDecorationColor: 'rgba(138,180,232,0.4)',
                }}
              >
                Sponsor or get involved
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/* ─── Treasure unlock coins ──────────────────────────────────────── */
/* Parabolic flight params for each coin: dx is the horizontal landing
   offset (px), peakY is the highest y-position reached (negative =
   above origin), endY is the resting y-position after the arc settles
   (positive = below origin), spin is a small tumble (deg). Fewer coins
   keeps the unlock readable; tuned so half clear the wordmark up and
   the rest fan low like coins spilling out of a chest. */
const COINS: { dx: number; peakY: number; endY: number; size: number; spin: number; delay: number }[] = [
  { dx: -130, peakY: -70,  endY:  40, size: 14, spin: -240, delay:  20 },
  { dx:  -80, peakY: -110, endY:  60, size: 12, spin: -200, delay:  90 },
  { dx:  -40, peakY: -130, endY:  70, size: 10, spin: -160, delay: 160 },
  { dx:   40, peakY: -130, endY:  70, size: 10, spin:  160, delay: 130 },
  { dx:   80, peakY: -110, endY:  60, size: 12, spin:  200, delay:  60 },
  { dx:  130, peakY: -70,  endY:  40, size: 14, spin:  240, delay:   0 },
  { dx:  -20, peakY: -150, endY:  90, size:  8, spin:  -90, delay: 240 },
  { dx:   20, peakY: -150, endY:  90, size:  8, spin:   90, delay: 220 },
]

/* ─── Prize section ──────────────────────────────────────────────── */
function PrizeSection() {
  return (
    <section style={{ padding: '140px 24px 130px', background: '#020820', position: 'relative', overflow: 'hidden' }}>
      <ChestBackdrop />
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <p className="gsap-reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#ffd76a', marginBottom: 22, display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <Coins size={16} /> The Bounty <Coins size={16} />
        </p>
        <h2 className="gsap-reveal" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 3.8rem)', fontWeight: 900, color: '#fff', marginBottom: 18, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          Treasure Awaits
        </h2>
        <p className="gsap-reveal" style={{ fontSize: 16, color: '#8ab4e8', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }}>
          The chest is real. Crack the most challenges across the eight hours and your crew sails home with
          the lion&rsquo;s share.
        </p>
        <div className="prize-amount-wrap">
          <span className="prize-corner prize-corner--tl" aria-hidden />
          <span className="prize-corner prize-corner--tr" aria-hidden />
          <span className="prize-amount" aria-label="Two thousand US dollars">$2,000</span>
          <span className="prize-corner prize-corner--bl" aria-hidden />
          <span className="prize-corner prize-corner--br" aria-hidden />
        </div>
        <p style={{ marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          Final split is subject to participation and sponsor confirmation.
        </p>
      </div>
      <style>{`
        .prize-amount-wrap {
          position: relative;
          display: inline-flex;
          justify-content: center;
          align-items: baseline;
          line-height: 1;
          padding: 0 8px;
        }
        .prize-amount {
          font-family: "JetBrains Mono", ui-serif, Georgia, serif;
          font-weight: 900;
          font-size: clamp(96px, 17vw, 260px);
          letter-spacing: 0.005em;
          background: linear-gradient(100deg,
            #7a4f00 0%, #b8860b 14%, #ffd700 30%, #fff4c2 44%,
            #ffd700 56%, #ffaa00 72%, #b8860b 88%, #7a4f00 100%);
          background-size: 220% 100%;
          background-position: -110% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          filter: drop-shadow(0 8px 36px rgba(255, 200, 60, 0.32));
          animation: prizeShimmer 6.5s linear infinite;
        }
        @keyframes prizeShimmer {
          0%   { background-position: -110% 50%; }
          100% { background-position: 110% 50%; }
        }
        .prize-corner {
          position: absolute;
          width: 22px; height: 22px;
          border-color: rgba(255, 215, 0, 0.55);
          border-style: solid;
          border-width: 0;
        }
        .prize-corner--tl { top: -16px; left: -16px; border-top-width: 1px; border-left-width: 1px; }
        .prize-corner--tr { top: -16px; right: -16px; border-top-width: 1px; border-right-width: 1px; }
        .prize-corner--bl { bottom: -8px; left: -16px; border-bottom-width: 1px; border-left-width: 1px; }
        .prize-corner--br { bottom: -8px; right: -16px; border-bottom-width: 1px; border-right-width: 1px; }
      `}</style>
    </section>
  )
}

/* ─── Treasure chest backdrop SVG (Prize section) ────────────────── */
function ChestBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 460"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(640px, 92%)',
        opacity: 0.07,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="chest-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a4f00" />
          <stop offset="100%" stopColor="#3a2410" />
        </linearGradient>
        <linearGradient id="chest-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#7a4f00" />
        </linearGradient>
      </defs>
      <path d="M 90 200 Q 300 60 510 200 L 510 220 L 90 220 Z" fill="url(#chest-wood)" stroke="#3a2410" strokeWidth="3" />
      <rect x="90" y="220" width="420" height="180" fill="url(#chest-wood)" stroke="#3a2410" strokeWidth="3" />
      <rect x="90" y="226" width="420" height="14" fill="url(#chest-iron)" />
      <rect x="90" y="384" width="420" height="14" fill="url(#chest-iron)" />
      <rect x="290" y="158" width="20" height="220" fill="url(#chest-iron)" />
      <rect x="280" y="290" width="40" height="42" rx="3" fill="#ffd700" stroke="#7a4f00" strokeWidth="2" />
      <circle cx="300" cy="304" r="4" fill="#3a2410" />
      <line x1="300" y1="308" x2="300" y2="322" stroke="#3a2410" strokeWidth="2" />
      {[
        [200, 410, 12], [240, 420, 10], [340, 418, 11], [380, 408, 13], [430, 422, 9],
        [160, 422, 9], [280, 426, 10], [300, 412, 8],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="url(#chest-iron)" stroke="#7a4f00" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
