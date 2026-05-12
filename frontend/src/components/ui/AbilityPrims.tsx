/* ─── Ability primitives ──────────────────────────────────────────
   Tiny, hand-drawn SVG primitives used by the per-section "ability"
   effects. Every shape is a generic geometric form (coin = circle
   with a star stamp, flame = teardrop, vine = curve + 3 petals).
   No franchise marks. */

import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }

const sw = (s = 24, w = 1.6): SVGProps<SVGSVGElement> => ({
  width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: w,
  strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
})

/* Generic stamped coin — outlined circle + abstract 4-point star
   stamp in the centre. Not the Berry symbol. */
export function Coin({ size, strokeWidth, ...rest }: P) {
  return (
    <svg {...sw(size, strokeWidth)} {...rest}>
      <circle cx="12" cy="12" r="10" fill="#e8a91e" />
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="7" />
      <path d="M12 6 L13 11 L18 12 L13 13 L12 18 L11 13 L6 12 L11 11 Z"
            fill="#b27210" stroke="#1d1408" strokeWidth="0.8" />
    </svg>
  )
}

/* Generic cartoon cloud — used in Navigator's countdown background. */
export function Cloud({ size, strokeWidth, ...rest }: P) {
  return (
    <svg {...sw(size, strokeWidth)} {...rest} viewBox="0 0 48 24">
      <path d="M6 18 Q4 18 4 16 Q4 13 8 12 Q8 6 14 6 Q19 6 21 10 Q24 7 28 9 Q32 7 35 11 Q42 11 42 16 Q42 18 40 18 Z"
            fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth={strokeWidth ?? 1.4} />
    </svg>
  )
}

/* Crosshair reticle — used by Sniper. Designed so the stroke-dash
   animation crawls the whole shape cleanly. */
export function Crosshair({ size = 60, strokeWidth = 2, ...rest }: P) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 60 60"
      fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round"
      aria-hidden {...rest}
    >
      <circle cx="30" cy="30" r="22" />
      <line x1="30" y1="2"  x2="30" y2="12" />
      <line x1="30" y1="48" x2="30" y2="58" />
      <line x1="2"  y1="30" x2="12" y2="30" />
      <line x1="48" y1="30" x2="58" y2="30" />
    </svg>
  )
}

/* Flame wisp — used by Cook. Tall S-curved flame with a clear
   pointed tip + inner highlight. Reads as flame from a distance,
   not a teardrop blob. */
export function Flame({ size = 22, strokeWidth = 1.6, ...rest }: P) {
  return (
    <svg
      width={size} height={size * 1.9} viewBox="0 0 20 38"
      fill="none" stroke="#1d1408"
      strokeWidth={strokeWidth} strokeLinejoin="round"
      aria-hidden {...rest}
    >
      {/* Outer flame — S-curved with sharp tip. */}
      <path
        d="M10 1
           Q4 9 6 16
           Q8 21 4 26
           Q4 32 10 36
           Q16 32 16 26
           Q12 21 14 16
           Q16 9 10 1 Z"
        fill="#e25a36"
      />
      {/* Mid layer — orange. */}
      <path
        d="M10 6
           Q6 13 8 19
           Q9 23 7 27
           Q7 31 10 34
           Q13 31 13 27
           Q11 23 12 19
           Q14 13 10 6 Z"
        fill="#f39220" stroke="none"
      />
      {/* Inner highlight — bright yellow. */}
      <path
        d="M10 13
           Q8 19 9 24
           Q9 28 10 31
           Q11 28 11 24
           Q12 19 10 13 Z"
        fill="#ffd34a" stroke="none"
      />
    </svg>
  )
}

/* Vine + 3-petal flower — used by Archaeologist. Generic plant. */
export function Vine({ size = 60, strokeWidth = 2, rotation = 0, ...rest }: P & { rotation?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 60 60"
      fill="none" aria-hidden
      style={{ transform: `rotate(${rotation}deg)`, ...(rest.style ?? {}) }}
      {...rest}
    >
      {/* stem curve */}
      <path d="M8 52 Q14 36 22 30 Q32 22 40 22"
            stroke="#2e6b3a" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      {/* leaf */}
      <path d="M22 30 Q18 26 22 22 Q26 26 22 30 Z" fill="#2e6b3a" />
      {/* 3-petal flower at end */}
      <g transform="translate(40 22)">
        <circle cx="0"  cy="-5" r="4" fill="#a8302a" />
        <circle cx="-5" cy="3"  r="4" fill="#a8302a" />
        <circle cx="5"  cy="3"  r="4" fill="#a8302a" />
        <circle cx="0"  cy="0"  r="2.4" fill="#ffd34a" />
      </g>
    </svg>
  )
}

/* Plank — used by Shipwright assembly. */
export function Plank({ width = 80, height = 12, ...rest }: P & { width?: number; height?: number }) {
  return (
    <svg
      width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      fill="none" aria-hidden {...rest}
    >
      <rect x="1" y="1" width={width - 2} height={height - 2}
            fill="#7a5a2b" stroke="#1d1408" strokeWidth="2" rx="1.5" />
      {/* nail-heads at each end */}
      <circle cx="8" cy={height / 2} r="1.4" fill="#1d1408" />
      <circle cx={width - 8} cy={height / 2} r="1.4" fill="#1d1408" />
    </svg>
  )
}

/* 4-point click spark — used by Shipwright. */
export function ClickSpark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <line x1="9"  y1="1"  x2="9"  y2="17" stroke="#fff8e0" strokeWidth="2" strokeLinecap="round" />
      <line x1="1"  y1="9"  x2="17" y2="9"  stroke="#fff8e0" strokeWidth="2" strokeLinecap="round" />
      <line x1="3.5"  y1="3.5"  x2="14.5" y2="14.5" stroke="#fff8e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="14.5" y1="3.5"  x2="3.5"  y2="14.5" stroke="#fff8e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

/* Small plus icon — used by Doctor focus state. */
export function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/* Audio waveform — used by Musician. Render N vertical bars with
   staggered animation delays for a "live equalizer" feel. */
export function Waveform({
  bars = 12,
  height = 18,
  className = '',
}: {
  bars?: number
  height?: number
  className?: string
}) {
  return (
    <div
      className={`fx-music-waveform ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = 30 + Math.abs(((i * 53) % 100) - 50) * 1.4
        return (
          <span
            key={i}
            className="fx-music-wave-bar"
            style={{
              height: `${baseH}%`,
              animationDelay: `${(i * 0.08) % 0.6}s`,
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Snail messenger ────────────────────────────────────────
   Generic snail silhouette with a small "button" on the shell —
   used as the SolveToast icon. Pirate fiction has long associated
   snails with slowness/messengers; the icon is hand-drawn and
   abstract, not based on any franchise's specific snail prop. */
export function MessengerSnail({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 44 36" fill="none" aria-hidden>
      {/* Body */}
      <path
        d="M3 30 Q3 22 12 22 L26 22 Q34 22 34 30 L34 32 L3 32 Z"
        fill="#7a5a2b" stroke="#1d1408" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Eyestalks */}
      <line x1="6" y1="22" x2="3" y2="14" stroke="#1d1408" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="8" y2="13" stroke="#1d1408" strokeWidth="2" strokeLinecap="round" />
      <circle cx="3"  cy="13" r="1.6" fill="#1d1408" />
      <circle cx="8"  cy="12" r="1.6" fill="#1d1408" />
      {/* Shell — spiral. */}
      <circle cx="26" cy="20" r="11" fill="#a8302a" stroke="#1d1408" strokeWidth="2" />
      <path
        d="M26 20 m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0"
        fill="none" stroke="#fff8e0" strokeWidth="1.6" strokeLinecap="round"
      />
      {/* Round "button" on top of the shell. */}
      <circle cx="26" cy="10" r="2.6" fill="#fff8e0" stroke="#1d1408" strokeWidth="1.4" />
      <circle cx="26" cy="10" r="1"   fill="#a8302a" />
    </svg>
  )
}

/* Heat-haze SVG filter definition — emitted once in the global
   <FilterDefs /> sprite. Static turbulence (no animation on
   baseFrequency) — much cheaper than a live filter. */
export function FilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="fx-cook-haze-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>
    </svg>
  )
}
