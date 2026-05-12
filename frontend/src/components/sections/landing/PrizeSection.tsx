import { useState, useCallback } from 'react'
import { Coin } from '../../ui/AbilityPrims'
import { useAbilityGate } from '../../../lib/useAbilityGate'
import s from './PrizeSection.module.css'

/* ─── PrizeSection ──────────────────────────────────────────────
   Treasurer-themed section. The $2,000 dollar amount has a gold
   shimmer sweep + a coin-jingle wiggle on hover. A faint treasure
   chest watermarks the background. */
export function PrizeSection() {
  const { ref: gateRef, visible, prefersReduced, isMobile } = useAbilityGate()
  /* Each hover spawns a fresh batch of coin instances. We key on a
     monotonic counter so React re-mounts the spans (so the animation
     replays from frame 0). Old batches age out via a setTimeout. */
  const [coinBatches, setCoinBatches] = useState<number[]>([])

  const spawnCoins = useCallback(() => {
    if (prefersReduced || !visible) return
    const id = Date.now()
    setCoinBatches(b => [...b, id])
    /* Coin keyframe is ~1.8s; cull after 2.5s for safety. */
    window.setTimeout(() => {
      setCoinBatches(b => b.filter(x => x !== id))
    }, 2500)
  }, [prefersReduced, visible])

  const coinCount = isMobile ? 7 : 14

  return (
    <section
      ref={gateRef as React.RefObject<HTMLElement>}
      style={{ padding: '140px 24px 130px', position: 'relative', overflow: 'hidden' }}
    >
      <ChestBackdrop />
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <h2 className="gsap-reveal h-poster" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 3.8rem)', fontWeight: 900, marginBottom: 18 }}>
          Treasure Awaits
        </h2>
        <p className="gsap-reveal font-poster" style={{ fontSize: 21, fontWeight: 500, color: 'var(--ink-soft, #4a3318)', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }}>
          The chest is real. Crack the most challenges across the eight hours and your crew sails
          home with the lion&rsquo;s share.
        </p>

        <div
          className={s.amountWrap}
          onMouseEnter={spawnCoins}
          onTouchStart={spawnCoins}
        >
          <span className={`${s.corner} ${s.cornerTl}`} aria-hidden />
          <span className={`${s.corner} ${s.cornerTr}`} aria-hidden />
          <span
            className={`prize-amount ${s.amount} fx-coin-wiggle`}
            aria-label="Two thousand US dollars"
          >
            $2,000
          </span>
          <span className={`${s.corner} ${s.cornerBl}`} aria-hidden />
          <span className={`${s.corner} ${s.cornerBr}`} aria-hidden />

          {/* Goldfall — coins cascade from across the FULL WIDTH of
              the $2,000 text on hover, like a small fountain. Each
              coin picks its own column position (5%-95%), a horizontal
              drift, a rotation, a duration, and a staggered delay so
              the cascade looks like real falling money rather than a
              single fountain point. */}
          {coinBatches.flatMap(batchId =>
            Array.from({ length: coinCount }).map((_, i) => {
              /* Distribute coins across the wrap width, with jitter
                 so columns aren't perfectly evenly spaced. */
              const baseLeft = 5 + (i / Math.max(1, coinCount - 1)) * 90
              const jitter   = ((i * 17) % 11) - 5
              const left     = `${baseLeft + jitter}%`
              const cdx      = `${((i * 31) % 30) - 15}px`
              const crot     = `${360 + ((i * 47) % 360)}deg`
              const dur      = `${1.6 + ((i * 13) % 6) * 0.1}s`
              const delay    = `${(i * 0.06) % 0.5}s`
              return (
                <span
                  key={`${batchId}-${i}`}
                  className="fx-treas-coin"
                  aria-hidden
                  style={{
                    left,
                    top: 0,
                    ['--cx'  as string]: '0',
                    ['--cdx' as string]: cdx,
                    ['--crot' as string]: crot,
                    ['--cdur' as string]: dur,
                    animationDelay: delay,
                  }}
                >
                  <Coin size={20} />
                </span>
              )
            }),
          )}
        </div>

        <p className="font-poster" style={{ marginTop: 40, fontSize: 17.5, color: '#6b3a18', fontStyle: 'italic', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          Final split is subject to participation and sponsor confirmation.
        </p>
      </div>
    </section>
  )
}

/* Treasure-chest watermark — abstract, generic, hand-drawn. */
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
        opacity: 0.10,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="chest-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7a4f00" />
          <stop offset="100%" stopColor="#3a2410" />
        </linearGradient>
        <linearGradient id="chest-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c9962a" />
          <stop offset="100%" stopColor="#5a3a1a" />
        </linearGradient>
      </defs>
      <path d="M 90 200 Q 300 60 510 200 L 510 220 L 90 220 Z" fill="url(#chest-wood)" stroke="#3a2410" strokeWidth="3" />
      <rect x="90"  y="220" width="420" height="180" fill="url(#chest-wood)" stroke="#3a2410" strokeWidth="3" />
      <rect x="90"  y="226" width="420" height="14"  fill="url(#chest-iron)" />
      <rect x="90"  y="384" width="420" height="14"  fill="url(#chest-iron)" />
      <rect x="290" y="158" width="20"  height="220" fill="url(#chest-iron)" />
      <rect x="280" y="290" width="40"  height="42"  rx="3" fill="#c9962a" stroke="#5a3a1a" strokeWidth="2" />
      <circle cx="300" cy="304" r="4" fill="#3a2410" />
      <line x1="300" y1="308" x2="300" y2="322" stroke="#3a2410" strokeWidth="2" />
      {[
        [200, 410, 12], [240, 420, 10], [340, 418, 11], [380, 408, 13], [430, 422, 9],
        [160, 422, 9],  [280, 426, 10], [300, 412, 8],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="url(#chest-iron)" stroke="#5a3a1a" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
