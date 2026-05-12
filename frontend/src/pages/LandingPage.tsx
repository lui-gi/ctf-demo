import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { Hero }              from '../components/sections/landing/Hero'
import { Countdown }         from '../components/sections/landing/Countdown'
import { PrizeSection }      from '../components/sections/landing/PrizeSection'
import { AboutSection }      from '../components/sections/landing/AboutSection'
import { ChallengesSection } from '../components/sections/landing/ChallengesSection'
import { SponsorsSection }   from '../components/sections/landing/SponsorsSection'
import { FinalCTA }          from '../components/sections/landing/FinalCTA'
import { SectionDivider }    from '../components/sections/landing/SectionDivider'
import { HeroAwaken }        from '../components/ui/HeroAwaken'

gsap.registerPlugin(ScrollTrigger)

/* ─── Landing page ─────────────────────────────────────────────
   Thin assembly of per-section components. GSAP scroll-reveal is
   wired here so it picks up `.gsap-reveal`, `.challenge-card`,
   `.tier-card`, `.ctf-stat`, and `.prize-amount` regardless of
   which child component declares them. */
export default function LandingPage() {
  const scrollToAbout = () =>
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })

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

      reveal('.gsap-reveal')

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
      stagger('.ctf-stat',       { y: 18, duration: 0.6,  stagger: 0.06 })
      /* .challenge-card uses .fx-sword-slash-in (CSS clip-path) — see
         ChallengesSection.tsx. Don't double up GSAP on the same nodes. */
      stagger('.tier-card',      { y: 44, duration: 0.85, stagger: 0.12, clearProps: 'transform' })

      const prize = document.querySelector<HTMLElement>('.prize-amount, [aria-label="Two thousand US dollars"]')
      if (prize) {
        gsap.from(prize, {
          opacity: 0, scale: 0.86, y: 24,
          duration: 1.1, ease: 'expo.out',
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
      <Hero onScrollToAbout={scrollToAbout} />

      <div>
        <SectionDivider kind="waves" />
        <Countdown />
        <SectionDivider kind="waves" />
        <PrizeSection />
        <SectionDivider kind="waves" />
        <AboutSection />
        <SectionDivider kind="waves" />
        <ChallengesSection />
        <SectionDivider kind="waves" />
        <SponsorsSection />
        <SectionDivider kind="waves" />
        <FinalCTA />
      </div>

    </>
  )
}
