import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { Hero }              from '../components/sections/landing/Hero'
import { TreasureChest }     from '../components/sections/landing/TreasureChest'
import { AboutSection }      from '../components/sections/landing/AboutSection'
import { ChallengesSection } from '../components/sections/landing/ChallengesSection'
import { SponsorsSection }   from '../components/sections/landing/SponsorsSection'
import { FinalCTA }          from '../components/sections/landing/FinalCTA'
import { HeroAwaken }        from '../components/ui/HeroAwaken'
import dive                  from '../components/sections/landing/Dive.module.css'

gsap.registerPlugin(ScrollTrigger)

/* ─── Landing page ─────────────────────────────────────────────
   Thin assembly of per-section components. GSAP scroll-reveal is
   wired here so it picks up `.gsap-reveal`, `.challenge-card`,
   `.tier-card`, `.ctf-stat`, and `.prize-amount` regardless of
   which child component declares them. */
export default function LandingPage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Per-section "slide rises out of the deep" entrance — every
         scroll section animates as a single unit: floats up 60px,
         scales in from 0.96, fades from 0 → 1. Eased on power4.out so
         it has a satisfying decel at the dock. */
      const stackEl = document.querySelector('[data-dive-stack]')
      const diveSections: HTMLElement[] = stackEl
        ? Array.from(stackEl.querySelectorAll<HTMLElement>(':scope > section'))
        : []
      diveSections.forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 60,
          scale: 0.96,
          transformOrigin: '50% 100%',
          duration: 1.05,
          ease: 'power4.out',
          scrollTrigger: { trigger: section, start: 'top 82%', once: true },
        })
      })

      /* Generic reveal for headings, paragraphs, and any per-section
         element that opts in via the `.gsap-reveal` class. Slightly
         delayed so it follows the section's own entrance. */
      gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.85,
          ease: 'power3.out',
          delay: 0.12,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

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

      stagger('.ctf-stat',   { y: 22, duration: 0.6,  stagger: 0.07 })
      stagger('.log-beat',   { y: 24, duration: 0.7,  stagger: 0.09 })
      stagger('.tier-card',  { y: 44, duration: 0.9,  stagger: 0.14, ease: 'back.out(1.2)', clearProps: 'transform' })

      const prize = document.querySelector<HTMLElement>('.prize-amount, [aria-label="Two thousand US dollars"]')
      if (prize) {
        gsap.from(prize, {
          opacity: 0, scale: 0.82, y: 24,
          duration: 1.15, ease: 'back.out(1.6)',
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
      <HeroAwaken />
      {/* Hero = ship + a passive decorative chest PEEK at the bottom. */}
      <Hero />

      {/* Separate full-viewport section with the real interactive
          chest, centred. Its background bridges the hero's bottom
          colour into the dive's top colour (no seam). */}
      <TreasureChest />

      {/* Dive — continuous depth gradient from just below the hero down
          into the abyss. Sections flow into each other without dividers;
          GSAP reveals (set up below) drive the entrance animations. */}
      <div className={dive.stack} data-dive-stack>
        <AboutSection />
        <ChallengesSection />
        <SponsorsSection />
        <FinalCTA />
      </div>

    </>
  )
}
