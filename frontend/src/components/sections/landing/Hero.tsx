import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CompassRose, Seagull, CartoonSun, Waves,
} from '../../ui/PirateMotifs'
import { CaptainPull } from '../../ui/CaptainPull'
import { diffParts, pad, type Parts } from './data'
import s from './Hero.module.css'

/* ─── Hero ────────────────────────────────────────────────────
   Captain's deck: bright tropical sky → sea, sun, seagulls,
   distant island, animated waves, the ship riding the swell with
   wake + spray dots, login/register nav, and the prog/ctf wordmark
   with its first-load pop animation.

   At the very bottom edge: a PURELY DECORATIVE chest peek (just the
   top of a closed chest poking up, gently bobbing) with a teaser
   line above it. It is NOT interactive and has NO scroll behaviour
   — the real, clickable chest is its own section right below the
   hero (see TreasureChest). The peek just scrolls away with the
   hero like any other hero content.

   All layout is owned by Hero.module.css. Animations come from
   index.css (waves, gulls, ship rock, spray dots) and abilities.css
   (fx-cap-title-pop, fx-cap-pull). */
export function Hero() {
  /* Compact countdown chip under the sun — ticks every second. */
  const [t, setT] = useState<Parts>(() => diffParts(Date.now()))
  useEffect(() => {
    const id = window.setInterval(() => setT(diffParts(Date.now())), 1000)
    return () => window.clearInterval(id)
  }, [])

  /* Foam-spray dots peeling off the bow. */
  const sprayDots = [
    { left: '20%', bottom: '8%',  sx: '-18px', delay:  '0s'   },
    { left: '26%', bottom: '10%', sx: '-26px', delay: '-0.4s' },
    { left: '34%', bottom: '6%',  sx: '-10px', delay: '-1.0s' },
    { left: '62%', bottom: '8%',  sx:  '22px', delay: '-0.2s' },
    { left: '70%', bottom: '10%', sx:  '30px', delay: '-0.7s' },
    { left: '78%', bottom: '6%',  sx:  '14px', delay: '-1.4s' },
    { left: '50%', bottom: '2%',  sx:   '0px', delay: '-0.6s' },
  ]

  return (
    <div className={s.root}>
      {/* Sun (slowly rotating ray lines via .animate-compass). */}
      <div className={`${s.sun} animate-compass`} aria-hidden>
        <CartoonSun size={240} />
      </div>

      {/* Event timer chip — sits under the sun in the upper-right. Compact
          parchment badge with the date and a ticking d/h/m/s readout. */}
      <div className={s.eventChip} role="timer" aria-label="Time until event">
        <div className={`font-poster ${s.eventChipLabel}`}>
          Setting Sail · Nov 7
        </div>
        {t.done ? (
          <div className={`font-poster ${s.eventChipLive}`}>Live now</div>
        ) : (
          <div className={s.eventChipDigits}>
            <span>{pad(t.days)}<small>d</small></span>
            <span>{pad(t.hours)}<small>h</small></span>
            <span>{pad(t.minutes)}<small>m</small></span>
            <span>{pad(t.seconds)}<small>s</small></span>
          </div>
        )}
      </div>

      {/* Clouds asset, hue-shifted to bright cream. */}
      <img src="/assets/clouds.png" alt="" className={s.clouds} />

      {/* Seagulls — 3 looping silhouettes. */}
      <div className="gull gull--a" aria-hidden style={{ color: '#1d1408' }}>
        <Seagull size={36} strokeWidth={2.4} />
      </div>
      <div className="gull gull--b" aria-hidden style={{ color: '#1d1408' }}>
        <Seagull size={24} strokeWidth={2.2} />
      </div>
      <div className="gull gull--c" aria-hidden style={{ color: '#1d1408' }}>
        <Seagull size={30} strokeWidth={2.4} />
      </div>

      {/* Horizon chase — One Piece (leading) being pursued by Marine
          (trailing, behind in the drift cycle). The wrapper div handles
          the slow horizontal loop; the img inside keeps its bob/roll. */}
      <div className={s.horizonChaseLeft} aria-hidden>
        <img
          src="/assets/pirateship.png"
          alt=""
          className={s.horizonShipLeft}
        />
      </div>
      <div className={s.horizonChaseRight} aria-hidden>
        <img
          src="/assets/marineship.png"
          alt=""
          className={s.horizonShipRight}
        />
      </div>
      <img
        src="/assets/island.png"
        alt=""
        aria-hidden
        className={s.island}
      />

      {/* Sea depth gradient + animated wave layers. */}
      <div className={s.seaDepth} />
      <div className={s.waves}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <Waves variant="hero" tone="#0f4862" />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <Waves variant="hero" tone="#70D0C9" />
        </div>
      </div>

      {/* Nav. */}
      <nav className={s.nav}>
        <CaptainPull as="span">
          <Link to="/login" className={`${s.navLogin} font-poster`}>Login</Link>
        </CaptainPull>
        <CaptainPull as="span">
          <Link to="/register" className={`${s.navRegister} font-poster`}>Register</Link>
        </CaptainPull>
      </nav>

      {/* Content column. */}
      <div className={s.content}>
        {/* Wordmark. */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className={s.wordmark}>
            <span style={{ color: '#1d1408' }} className="animate-compass">
              <CompassRose size={50} strokeWidth={1.6} />
            </span>
            <h1 className={`h-poster italic tracking-wide leading-none fx-cap-title-pop ${s.wordmarkTitle}`}>
              <span>prog</span>
              <span className={s.wordmarkAccent}>ctf</span>
            </h1>
          </div>
          <p className={`font-poster ${s.tagline}`}>Encrypted Treasures</p>
        </div>

        {/* Ship riding the waves. */}
        <div className={s.shipRig}>
          <div className={s.shipRide}>
            <img
              src="/assets/progctf-ship-removebg-preview.png"
              alt=""
              className="w-full h-auto pointer-events-none select-none"
            />
          </div>
          <div className={s.wakePrimary} aria-hidden />
          <div className={s.wakeWide}    aria-hidden />

          {/* Foam-spray dots. */}
          {sprayDots.map((d, i) => (
            <span
              key={i}
              className="spray-dot"
              aria-hidden
              style={{
                left: d.left,
                bottom: d.bottom,
                ['--sx' as string]: d.sx,
                animationDelay: d.delay,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
