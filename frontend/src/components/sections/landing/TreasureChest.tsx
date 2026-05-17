import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import s from './TreasureChest.module.css'

/* ─── TreasureChest ────────────────────────────────────────────
   Its OWN full-viewport section directly below the hero. NO
   ScrollTrigger, NO pin, NO scroll-driven scale/move. Just a big
   chest centred in the section, idle-bobbing. The user reaches it
   by scrolling past the hero normally. The section background
   bridges the hero's bottom colour (#1d6c8a) into the dive stack's
   top colour (#4aabac) so there's no seam either side.

   Click runs the ~0.4s open (slighty → open → loot); the prize
   rises out + coin burst + gold glow. Replayable. Refs only; all
   tweens cleaned up on unmount. Stills preloaded (on-disk spelling
   is `slightyopenchest`). */

const CHEST = {
  closed:  '/assets/closedchest.png',
  slighty: '/assets/slightyopenchest.png',
  open:    '/assets/openchest.png',
  loot:    '/assets/lootchest.png',
} as const
type ChestKey = keyof typeof CHEST

export function TreasureChest() {
  const chestRef  = useRef<HTMLImageElement>(null)
  const coinRef   = useRef<HTMLDivElement>(null)
  const goldRef   = useRef<HTMLDivElement>(null)
  const amountRef = useRef<HTMLSpanElement>(null)
  const labelRef  = useRef<HTMLSpanElement>(null)
  const prizeRef  = useRef<HTMLDivElement>(null)
  const glowRef   = useRef<HTMLDivElement>(null)
  const raysRef   = useRef<HTMLDivElement>(null)
  const glowPulseRef = useRef<gsap.core.Tween | null>(null)
  const raysSpinRef  = useRef<gsap.core.Tween | null>(null)
  const raysFlickRef = useRef<gsap.core.Tween | null>(null)

  const idleRef    = useRef<gsap.core.Tween | null>(null)
  const wiggleRef  = useRef<gsap.core.Tween | null>(null)
  const openTlRef  = useRef<gsap.core.Timeline | null>(null)
  const liveRef    = useRef<gsap.core.Tween[]>([])
  const coinNodesRef = useRef<HTMLDivElement[]>([])
  const openingRef = useRef(false)

  const [revealed, setRevealed] = useState(false)

  const setChest = (k: ChestKey) => {
    if (chestRef.current) chestRef.current.src = CHEST[k]
  }

  const startIdle = () => {
    const chest = chestRef.current
    if (!chest) return
    idleRef.current?.kill()
    wiggleRef.current?.kill()
    gsap.set(chest, { y: 0, rotation: 0, scale: 1 })
    idleRef.current = gsap.to(chest, {
      y: -10, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut',
    })
    wiggleRef.current = gsap.to(chest, {
      rotation: 3, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut',
    })
  }

  /* ── Mount: preload + idle bob (no scroll behaviour) ── */
  useEffect(() => {
    Object.values(CHEST).forEach((src) => { new Image().src = src })

    const chest = chestRef.current
    if (!chest) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) startIdle()
    else gsap.set(chest, { opacity: 1 })

    return () => {
      idleRef.current?.kill()
      wiggleRef.current?.kill()
      openTlRef.current?.kill()
      glowPulseRef.current?.kill()
      raysSpinRef.current?.kill()
      raysFlickRef.current?.kill()
      liveRef.current.forEach((t) => t.kill())
      liveRef.current = []
      coinNodesRef.current.forEach((n) => n.remove())
      coinNodesRef.current = []
    }
  }, [])

  /* ── Coin burst — gold circles out of the chest ── */
  const spawnCoins = () => {
    const layer = coinRef.current
    if (!layer) return
    const COUNT = 18
    const nodes: HTMLDivElement[] = []
    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement('div')
      d.className = s.coin
      const size = gsap.utils.random(12, 18)
      d.style.width = `${size}px`
      d.style.height = `${size}px`
      d.style.marginLeft = `${-size / 2}px`
      d.style.marginTop = `${-size / 2}px`
      layer.appendChild(d)
      nodes.push(d)
    }
    coinNodesRef.current.push(...nodes)
    const tw = gsap.to(nodes, {
      x: () => gsap.utils.random(-1, 1) * gsap.utils.random(120, 260),
      y: () => gsap.utils.random(-260, -50),
      rotation: () => gsap.utils.random(-540, 540),
      opacity: 0,
      duration: 1.2,
      ease: 'power2.out',
      stagger: { each: 0.011, from: 'random' },
      onComplete: () => {
        nodes.forEach((n) => n.remove())
        coinNodesRef.current = coinNodesRef.current.filter((n) => !nodes.includes(n))
        liveRef.current = liveRef.current.filter((t) => t !== tw)
      },
    })
    liveRef.current.push(tw)
  }

  /* ── Gold shimmer fountain — sparkles erupting from the opening ── */
  const GOLD = ['#FFD700', '#FFA500', '#FFC700', '#FFB347', '#FFF4B8']
  const spawnGold = () => {
    const layer = goldRef.current
    if (!layer) return
    const COUNT = 28
    const nodes: HTMLDivElement[] = []
    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement('div')
      const shape = i % 5 === 0 ? s.goldStar : i % 3 === 0 ? s.goldDiamond : s.goldCircle
      d.className = `${s.gold} ${shape}`
      const size = gsap.utils.random(4, 8)
      d.style.width = `${size}px`
      d.style.height = `${size}px`
      d.style.marginLeft = `${-size / 2}px`
      d.style.marginTop = `${-size / 2}px`
      d.style.background = gsap.utils.random(GOLD)
      d.style.boxShadow = `0 0 ${size * 1.6}px rgba(255, 210, 110, 0.9)`
      layer.appendChild(d)
      nodes.push(d)
    }
    coinNodesRef.current.push(...nodes)
    nodes.forEach((node, i) => {
      const angle = (gsap.utils.random(-80, 80) * Math.PI) / 180 // from straight up
      const dist  = gsap.utils.random(140, 300)
      const peakX = Math.sin(angle) * dist
      const peakY = -Math.cos(angle) * dist
      const dur   = gsap.utils.random(0.8, 1.4)
      const rot   = gsap.utils.random(360, 720) * (Math.random() < 0.5 ? -1 : 1)
      const tw = gsap.to(node, {
        delay: (i / COUNT) * 0.15,
        rotation: rot,
        ease: 'none',
        keyframes: [
          { x: peakX * 0.55, y: peakY * 0.7,  duration: dur * 0.40, ease: 'power2.out' },
          { x: peakX,        y: peakY,         duration: dur * 0.32, ease: 'power1.out' },
          { x: peakX * 1.05, y: peakY + gsap.utils.random(30, 70), opacity: 0,
            duration: dur * 0.28, ease: 'power1.in' },
        ],
        onComplete: () => {
          node.remove()
          coinNodesRef.current = coinNodesRef.current.filter((n) => n !== node)
          liveRef.current = liveRef.current.filter((t) => t !== tw)
        },
      })
      liveRef.current.push(tw)
    })
  }

  /* ── Gold trail riding up behind the $2,000 as it launches ── */
  const spawnTrail = () => {
    const layer = goldRef.current
    if (!layer) return
    const N = 7
    for (let i = 0; i < N; i++) {
      const d = document.createElement('div')
      d.className = `${s.gold} ${s.goldCircle}`
      const size = gsap.utils.random(4, 7)
      d.style.width = `${size}px`
      d.style.height = `${size}px`
      d.style.marginLeft = `${-size / 2}px`
      d.style.marginTop = `${-size / 2}px`
      d.style.background = '#FFE9A8'
      d.style.boxShadow = `0 0 ${size * 2}px rgba(255, 225, 150, 0.9)`
      layer.appendChild(d)
      coinNodesRef.current.push(d)
      const tw = gsap.fromTo(
        d,
        {
          x: gsap.utils.random(-14, 14),
          y: gsap.utils.random(-260, -30),
          opacity: 0.9,
          scale: 1,
        },
        {
          opacity: 0,
          scale: 0.35,
          duration: 0.4,
          delay: 0.1 + i * 0.09,
          ease: 'power1.out',
          onComplete: () => {
            d.remove()
            coinNodesRef.current = coinNodesRef.current.filter((n) => n !== d)
            liveRef.current = liveRef.current.filter((t) => t !== tw)
          },
        },
      )
      liveRef.current.push(tw)
    }
  }

  /* ── Animated god-rays bursting from the open chest ── */
  const showRays = () => {
    const el = raysRef.current
    if (!el) return
    raysSpinRef.current?.kill()
    raysFlickRef.current?.kill()
    gsap.set(el, { rotation: 0 })
    raysSpinRef.current = gsap.to(el, {
      rotation: 360, duration: 20, ease: 'none', repeat: -1,
    })
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.55 },
      {
        opacity: 0.9, scale: 1,
        duration: 0.5, ease: 'power2.out',
        onComplete: () => {
          raysFlickRef.current = gsap.to(el, {
            opacity: 0.6, scale: 1.06,
            duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut',
          })
        },
      },
    )
  }

  /* ── Cinematic gold glow behind the chest ── */
  const showGlow = () => {
    const glow = glowRef.current
    if (!glow) return
    glowPulseRef.current?.kill()
    gsap.fromTo(
      glow,
      { opacity: 0, scale: 0.5 },
      {
        opacity: 1, scale: 1.2,
        duration: 0.6, ease: 'power2.out',
        onComplete: () => {
          glowPulseRef.current = gsap.to(glow, {
            scale: 1.3, duration: 2,
            yoyo: true, repeat: -1, ease: 'sine.inOut',
          })
        },
      },
    )
  }

  /* ── Prize text emerging just above the chest ── */
  const revealPrize = () => {
    setRevealed(true)
    const prize = prizeRef.current
    const amount = amountRef.current
    const label = labelRef.current
    const chest = chestRef.current
    if (!prize || !amount || !label || !chest) return

    gsap.set(prize, { opacity: 1 })

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(amount, { y: 0, scale: 1, opacity: 1 })
      gsap.set(label, { y: 0, opacity: 1 })
      return
    }

    /* Start DEEP inside the chest body (its opening), then launch up
       and out, overshooting before settling above the lid. */
    const H = chest.getBoundingClientRect().height || 600
    const startY = H * 0.5 + 160

    gsap.fromTo(
      amount,
      { y: startY, scale: 0.2 },
      {
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        keyframes: { scale: [0.2, 1], easeEach: 'power2.out' },
      },
    )
    gsap.fromTo(
      amount,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'power1.out' },
    )
    gsap.fromTo(
      label,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 1.0 },
    )
    spawnTrail()
  }

  /* ── Open sequence (~0.4s) ── */
  const handleOpen = () => {
    if (openingRef.current || revealed) return
    const chest = chestRef.current
    if (!chest) return
    openingRef.current = true

    idleRef.current?.kill()
    wiggleRef.current?.kill()
    gsap.set(chest, { y: 0 })

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setChest('loot')
      showGlow()
      showRays()
      spawnCoins()
      spawnGold()
      revealPrize()
      return
    }

    /* CLICK → bambambam → BOOM. ~240ms of frames flying past. */
    const tl = gsap.timeline({ onComplete: () => { openTlRef.current = null } })
    tl.add(() => setChest('slighty'), 0)
    tl.to(chest, {
      keyframes: { rotation: [0, -3, 3, -2, 0] },
      duration: 0.08, ease: 'sine.inOut',
    }, 0)
    tl.add(() => setChest('open'), 0.12)
    tl.to(chest, {
      keyframes: { scale: [1, 1.09, 1] },
      duration: 0.08, ease: 'sine.inOut',
    }, 0.12)
    tl.add(() => {
      setChest('loot')
      showGlow()
      showRays()
      spawnCoins()
      spawnGold()
      revealPrize()
    }, 0.24)
    tl.to({}, { duration: 0.01 }, 0.26)
    openTlRef.current = tl
  }

  /* ── Hover: lean in a touch (only while interactive) ── */
  const handleEnter = () => {
    if (openingRef.current || revealed) return
    gsap.to(chestRef.current, { scale: 1.05, duration: 0.22, ease: 'power2.out' })
  }
  const handleLeave = () => {
    if (openingRef.current || revealed) return
    gsap.to(chestRef.current, { scale: 1, duration: 0.22, ease: 'power2.out' })
  }

  /* No reset — once the treasure is open it stays open. The only way
     to play it again is a fresh page load. */

  return (
    <section className={s.revealSection} aria-label="Treasure reveal">
      <div className={s.center}>
        <div ref={glowRef} className={s.glow} aria-hidden />

        <div className={s.stage}>
          <div className={s.aura} aria-hidden />
          <button
            type="button"
            className={s.chestBtn}
            onClick={handleOpen}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            aria-label="Open the treasure chest to reveal the prize pool"
          >
            <img
              ref={chestRef}
              className={s.chest}
              src={CHEST.closed}
              alt=""
              draggable={false}
            />
          </button>
          <div ref={raysRef} className={s.rays} aria-hidden />
          <div ref={coinRef} className={s.coinLayer} aria-hidden />
          <div ref={goldRef} className={s.goldLayer} aria-hidden />
        </div>

        {!revealed && (
          <p className={s.teaser}>Wanna see what&rsquo;s inside the treasure?</p>
        )}

        <div ref={prizeRef} className={s.prize} aria-hidden>
          <span ref={amountRef} className={s.amount}>$2,000</span>
          <span ref={labelRef} className={s.label}>Prize Pool</span>
        </div>
      </div>
    </section>
  )
}
