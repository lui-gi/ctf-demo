/* ─── Generic pirate motifs ───────────────────────────────────────
   Hand-drawn inline SVGs used across the themed UI. Every shape is
   a generic pirate/nautical trope (skull-and-crossbones, straw hat,
   compass rose, log-pose-style dial, treasure chest, X-marks-spot,
   wanted-poster frame, devil-fruit-style swirl, ship silhouette).
   No franchise marks, no copyrighted artwork. */

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }

const base = (size = 24, strokeWidth = 1.6): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
})

/* Generic jolly roger — skull + crossed bones. Public-domain trope
   that long predates any anime; we draw a plain round skull, no
   character-specific features. */
export function JollyRoger({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <circle cx="12" cy="10" r="5" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
      <circle cx="14" cy="10" r="0.9" fill="currentColor" />
      <path d="M10.6 13.4l-0.6 1.6M13.4 13.4l0.6 1.6M11.4 13.4l0.6 1M12.6 13.4l-0.6 1" />
      <path d="M3.5 18.5l17-3M3.5 15.5l17 3" />
      <circle cx="3.4" cy="17"   r="0.9" />
      <circle cx="20.6" cy="17" r="0.9" />
      <circle cx="3.4" cy="16"   r="0.9" />
      <circle cx="20.6" cy="18"  r="0.9" />
    </svg>
  )
}

/* Straw hat silhouette (generic). The headwear shape itself is not
   copyrightable — any pirate/farmer straw hat has the same outline.
   We deliberately avoid any specific band/ribbon colour. */
export function StrawHat({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <ellipse cx="12" cy="14" rx="9" ry="2.2" />
      <path d="M5.5 13.5c0.8 -5 4 -7 6.5 -7s5.7 2 6.5 7" />
      <path d="M5 14.5h14" />
    </svg>
  )
}

/* Tricorn hat — generic 17th/18th-century silhouette. */
export function Tricorn({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M3 16 Q12 4 21 16" />
      <path d="M3 16 Q12 13 21 16" />
      <path d="M3 16 Q12 19 21 16" />
    </svg>
  )
}

/* Compass rose with cardinal points. Decorative; spins slowly via
   `animate-compass` if you want. */
export function CompassRose({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6.5" />
      <polygon points="12,2.5 13.4,11 12,12 10.6,11" fill="currentColor" />
      <polygon points="12,21.5 13.4,13 12,12 10.6,13" fill="currentColor" opacity="0.5" />
      <polygon points="2.5,12 11,10.6 12,12 11,13.4" fill="currentColor" opacity="0.7" />
      <polygon points="21.5,12 13,10.6 12,12 13,13.4" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    </svg>
  )
}

/* Log-pose-style dial: a generic stacked-dial navigational device.
   It's just three concentric rings + a needle — not any specific
   franchise prop. */
export function LogDial({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="6"   />
      <circle cx="12" cy="12" r="2.6" />
      <line x1="12" y1="12" x2="17.2" y2="6.8" />
      <line x1="12" y1="2.5" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="21.5" y2="12" />
    </svg>
  )
}

/* Treasure chest — classic dome-lid + bands + lock. */
export function TreasureChest({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M4 11 Q12 4 20 11 L20 13 L4 13 Z" />
      <rect x="4" y="13" width="16" height="8" />
      <line x1="4"  y1="15" x2="20" y2="15" />
      <line x1="4"  y1="19" x2="20" y2="19" />
      <rect x="10.5" y="14.5" width="3" height="3.5" />
      <circle cx="12" cy="16.2" r="0.5" fill="currentColor" />
    </svg>
  )
}

/* X marks the spot. */
export function XSpot({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
      <circle cx="12" cy="12" r="9" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  )
}

/* Crossed cutlasses. */
export function Cutlasses({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M4 4l13 13" />
      <path d="M2 2 L5 2 L5 5 Z" fill="currentColor" />
      <path d="M20 4L7 17" />
      <path d="M22 2 L19 2 L19 5 Z" fill="currentColor" />
      <path d="M4 17l3 3" /><path d="M17 4l3 3" />
      <circle cx="6.5" cy="18.5" r="1.5" />
      <circle cx="17.5" cy="18.5" r="1.5" />
    </svg>
  )
}

/* Anchor — generic. */
export function Anchor({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v15" />
      <path d="M5 12h14" />
      <path d="M5 12c0 5 3 8 7 8s7-3 7-8" />
    </svg>
  )
}

/* Ship wheel. */
export function ShipWheel({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
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
}

/* Scroll / parchment — for ship-manifest / sponsor tiers. */
export function Scroll({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M5 4h11a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V4z" />
      <path d="M19 7H8" />
      <path d="M8 10h8" /><path d="M8 13h8" /><path d="M8 16h6" />
    </svg>
  )
}

/* Coins. */
export function Coins({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <circle cx="9" cy="9" r="6" />
      <circle cx="9" cy="9" r="3" />
      <path d="M18 11A6 6 0 1 1 11 18" />
    </svg>
  )
}

/* Generic devil-fruit-style swirl — concentric spiral, no specific
   fruit. Decorative texture element. */
export function FruitSwirl({ size, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M12 12 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0 a6 6 0 1 1 -12 0 a7.5 7.5 0 1 1 15 0" />
    </svg>
  )
}

/* Stylised pirate ship silhouette — generic galleon, no specific
   ship-from-show details. */
export function PirateShip({ size = 60, strokeWidth = 1.5, ...rest }: IconProps) {
  return (
    <svg
      width={size} height={size * 0.78} viewBox="0 0 100 78"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}
    >
      {/* hull */}
      <path d="M8 56 L92 56 L84 68 L16 68 Z" fill="currentColor" fillOpacity="0.15" />
      {/* deck rail */}
      <path d="M16 56 L84 56" />
      {/* main mast */}
      <line x1="50" y1="56" x2="50" y2="6" />
      {/* main sail */}
      <path d="M52 10 Q72 18 52 50 Z" fill="currentColor" fillOpacity="0.10" />
      <path d="M48 10 Q28 18 48 50 Z" fill="currentColor" fillOpacity="0.10" />
      <line x1="28" y1="22" x2="72" y2="22" />
      <line x1="32" y1="36" x2="68" y2="36" />
      {/* flag — generic jolly roger */}
      <path d="M50 6 L66 6 L62 10 L66 14 L50 14 Z" fill="currentColor" fillOpacity="0.6" />
      <circle cx="57" cy="10" r="1.4" fill="#f3e2b6" />
      <path d="M55 12 l-0.4 1 M59 12 l0.4 1" stroke="#f3e2b6" />
      {/* waves under hull */}
      <path d="M2 70 Q12 66 22 70 T42 70 T62 70 T82 70 T100 70" opacity="0.55" />
      <path d="M2 74 Q14 70 26 74 T50 74 T74 74 T98 74" opacity="0.4" />
    </svg>
  )
}

/* ─── Crew-role icons ─────────────────────────────────────────────
   One generic icon per pirate-crew archetype role. None of these
   reference any specific character. They're the role's universal
   trade-tool: cook = chef knife, doctor = medical cross, sniper =
   slingshot, etc. */

export function RoleSwordsman({ size, strokeWidth, ...rest }: IconProps) {
  return <Cutlasses size={size} strokeWidth={strokeWidth} {...rest} />
}
export function RoleNavigator({ size, strokeWidth, ...rest }: IconProps) {
  return <CompassRose size={size} strokeWidth={strokeWidth} {...rest} />
}
export function RoleTreasurer({ size, strokeWidth, ...rest }: IconProps) {
  return <Coins size={size} strokeWidth={strokeWidth} {...rest} />
}
export function RoleCaptain({ size, strokeWidth, ...rest }: IconProps) {
  return <Tricorn size={size} strokeWidth={strokeWidth} {...rest} />
}
export function RoleShipwright({ size, strokeWidth, ...rest }: IconProps) {
  /* Wrench + hammer crossed. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M14 4a3 3 0 0 0 0 4l-9 9a2 2 0 1 0 3 3l9-9a3 3 0 0 0 4 0 1 1 0 0 0-1-1.6L19 11l-2-2 1.6-1.4A1 1 0 0 0 17 6a3 3 0 0 0-3-2z" />
      <line x1="5" y1="14" x2="2" y2="22" />
    </svg>
  )
}
export function RoleCook({ size, strokeWidth, ...rest }: IconProps) {
  /* Chef's knife. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M3 6 Q11 4 17 10 L13 14 L3 6Z" />
      <line x1="13" y1="14" x2="20" y2="21" />
      <rect x="18.5" y="19.5" width="3" height="2.5" transform="rotate(45 19.5 20.5)" />
    </svg>
  )
}
export function RoleSniper({ size, strokeWidth, ...rest }: IconProps) {
  /* Slingshot Y. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M7 4 Q12 12 12 16 Q12 12 17 4" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <path d="M7 4 Q4 5 5 7" />
      <path d="M17 4 Q20 5 19 7" />
      <path d="M5 7 Q12 9 19 7" strokeDasharray="2 2" />
    </svg>
  )
}
export function RoleArchaeologist({ size, strokeWidth, ...rest }: IconProps) {
  /* Open book. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M3 5 Q7 4 12 6 Q17 4 21 5 L21 19 Q17 18 12 20 Q7 18 3 19 Z" />
      <line x1="12" y1="6" x2="12" y2="20" />
      <line x1="6" y1="9"  x2="9" y2="9.5" />
      <line x1="6" y1="12" x2="9" y2="12.5" />
      <line x1="15" y1="9.5" x2="18" y2="9" />
      <line x1="15" y1="12.5" x2="18" y2="12" />
    </svg>
  )
}
export function RoleDoctor({ size, strokeWidth, ...rest }: IconProps) {
  /* Doctor's bag with cross. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8 V6 a3 3 0 0 1 6 0 V8" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}
export function RoleMusician({ size, strokeWidth, ...rest }: IconProps) {
  /* Treble clef-ish curl. */
  return (
    <svg {...base(size, strokeWidth)} {...rest}>
      <path d="M12 3 Q14 8 12 12 Q9 16 12 19 Q15 22 12 22 Q9 22 9 19 Q9 16 12 14" />
      <circle cx="11.5" cy="20.5" r="1.4" />
    </svg>
  )
}

/* ─── Bright cartoon sun ──────────────────────────────────────────
   Big yellow disc + slowly rotating ray-lines around it. Standard
   "shounen-adventure sun" trope — generic radial sun with rays,
   not any specific franchise mark. */
export function CartoonSun({ size = 220 }: { size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      {/* Rotating ray ring */}
      <svg
        viewBox="0 0 200 200"
        className="sun-rays"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 360) / 16
          const x1 = 100 + Math.cos((a * Math.PI) / 180) * 64
          const y1 = 100 + Math.sin((a * Math.PI) / 180) * 64
          const x2 = 100 + Math.cos((a * Math.PI) / 180) * 92
          const y2 = 100 + Math.sin((a * Math.PI) / 180) * 92
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#ffce4a"
              strokeWidth={i % 2 === 0 ? 8 : 5}
              strokeLinecap="round"
              opacity={i % 2 === 0 ? 0.9 : 0.65}
            />
          )
        })}
      </svg>
      {/* Sun disc */}
      <div
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '52%',
          height: '52%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 32%, #fff6c4 0%, #ffe27a 35%, #ffb834 78%, #d68a10 100%)',
          boxShadow:
            '0 0 40px 8px rgba(255,213,90,0.55),' +
            '0 0 80px 24px rgba(255,210,100,0.30),' +
            'inset 0 -8px 16px rgba(180,100,10,0.30)',
          border: '3px solid #1d1408',
        }}
      />
    </div>
  )
}

/* ─── Cartoon seagull ─────────────────────────────────────────────
   The classic "M-shape" two-arc silhouette. Pure stroke, no fill.
   Use multiple instances on different paths/durations to populate
   the sky. */
export function Seagull({ size = 28, strokeWidth = 2.4, ...rest }: IconProps) {
  return (
    <svg
      width={size} height={size * 0.5}
      viewBox="0 0 60 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="M2 18 Q14 4 22 16 Q30 22 38 16 Q46 4 58 18" />
    </svg>
  )
}

/* ─── Distant cartoon island ──────────────────────────────────────
   Small silhouette with a single palm tree. Generic tropical
   island; not based on any specific franchise location. */
export function DistantIsland({ width = 220 }: { width?: number }) {
  return (
    <svg
      width={width} height={width * 0.46}
      viewBox="0 0 220 100"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      {/* Island mass */}
      <path
        d="M10 78 Q26 62 50 60 Q80 56 110 58 Q150 60 180 64 Q200 66 212 78 Z"
        fill="#1d2a3a"
        opacity="0.55"
      />
      {/* Mid hill */}
      <path
        d="M60 64 Q90 38 130 50 Q160 58 180 64"
        fill="#1d2a3a"
        opacity="0.65"
      />
      {/* Palm tree (very stylised, generic) */}
      <g stroke="#1d2a3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85">
        <path d="M110 64 Q108 50 106 38" />
        <path d="M106 38 Q98 32 90 34" />
        <path d="M106 38 Q114 30 122 32" />
        <path d="M106 38 Q102 28 98 22" />
        <path d="M106 38 Q112 28 118 24" />
      </g>
    </svg>
  )
}

/* Compass-rose ink divider — wide horizontal element. */
export function CompassDivider() {
  return (
    <div className="map-route">
      <span style={{ color: '#5a3a1a' }}>
        <CompassRose size={20} strokeWidth={1.3} />
      </span>
    </div>
  )
}

/* ─── Animated waves ──────────────────────────────────────────────
   Three stacked sine-wave paths, each scrolling horizontally at a
   slightly different rate so the layers parallax against each other
   and read as moving water rather than a single repeating loop.
   Pure CSS animation, no JS, respects prefers-reduced-motion. */

type WavesProps = {
  /* Visual intensity. "hero" is the big breaking sea under the
     landing hero; "divider" is a thin band used between sections. */
  variant?: 'hero' | 'divider'
  /* Override the ink colour for special placements. */
  tone?: string
  /* Flip vertically — useful when the wave sits at the top of a
     section (the crests should point downward into the page). */
  flip?: boolean
  /* Extra class on the wrapper. */
  className?: string
}

export function Waves({ variant = 'divider', tone = '#5a3a1a', flip = false, className = '' }: WavesProps) {
  const height = variant === 'hero' ? 140 : 56
  return (
    <div
      className={`waves-wrap ${className}`}
      aria-hidden
      style={{
        height,
        transform: flip ? 'scaleY(-1)' : undefined,
      }}
    >
      <svg
        className="waves-svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          {/* One reusable wave path — repeated below at different
              offsets / speeds / opacities. */}
          <path
            id="wave-path"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g className="waves-parallax">
          <use href="#wave-path" x="48"  y="0"  fill={tone} fillOpacity="0.18" className="wave wave--back" />
          <use href="#wave-path" x="48"  y="3"  fill={tone} fillOpacity="0.30" className="wave wave--mid" />
          <use href="#wave-path" x="48"  y="5"  fill={tone} fillOpacity="0.55" className="wave wave--fore" />
          <use href="#wave-path" x="48"  y="7"  fill={tone} fillOpacity="0.85" className="wave wave--crest" />
        </g>
      </svg>
    </div>
  )
}
