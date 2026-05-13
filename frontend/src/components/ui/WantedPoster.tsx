import { useEffect, useRef, useState } from 'react'
import type { BountyEntry } from '../../lib/types'
import { Vine } from './AbilityPrims'

interface WantedPosterProps {
  entry: BountyEntry
  size: 'lg' | 'md' | 'sm'
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 3)
    .join('')
}

const sizeConfig = {
  lg: {
    poster: 'w-[420px]',
    wanted: 'text-[4rem]',
    initials: { width: '11rem', height: '11rem' },
    initialsText: 'text-[4rem]',
    crewName: '1.75rem',
    rankLabel: '1ST',
  },
  md: {
    poster: 'w-[330px]',
    wanted: 'text-[3rem]',
    initials: { width: '8rem', height: '8rem' },
    initialsText: 'text-[3rem]',
    crewName: '1.35rem',
    rankLabel: '2ND',
  },
  sm: {
    poster: 'w-[330px]',
    wanted: 'text-[3rem]',
    initials: { width: '8rem', height: '8rem' },
    initialsText: 'text-[3rem]',
    crewName: '1.35rem',
    rankLabel: '3RD',
  },
}

const TEXTURE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`

export default function WantedPoster({ entry, size }: WantedPosterProps) {
  const cfg = sizeConfig[size]
  const initials = getInitials(entry.crewName)
  const displayedMembers = entry.members.slice(0, 5)
  const extraMembers = entry.members.length - displayedMembers.length

  /* Bloomsprout — vines + flowers sprout from the four corners
     once the poster scrolls into view. One-shot. */
  const hostRef = useRef<HTMLDivElement>(null)
  const [bloomed, setBloomed] = useState(false)
  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setBloomed(true)
      return
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setBloomed(true)
          obs.disconnect()
        }
      })
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      className={`flex flex-col items-center fx-paper-flip fx-arch-host relative [filter:drop-shadow(0_8px_24px_rgba(0,0,0,0.7))] ${cfg.poster}`}
    >
      {/* Rank badge */}
      <div className="mb-[-10px] z-10 relative">
        <span
          className="font-mono text-sm font-black px-3 py-1 tracking-widest uppercase"
          style={{ background: '#7a4f1a', color: '#f5e6b8' }}
        >
          {cfg.rankLabel}
        </span>
      </div>

      {/* Poster card */}
      <div
        className="relative flex flex-col items-center px-4 pb-4 pt-5 w-full"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #f5e6b8 0%, #e8d090 40%, #d4b865 80%, #c4a040 100%)',
          boxShadow: 'inset 0 0 30px rgba(100,60,0,0.35), inset 0 0 8px rgba(80,40,0,0.2), 0 8px 32px rgba(0,0,0,0.5)',
          border: '6px solid #7a4f1a',
          borderRadius: '10px',
        }}
      >
        {/* Inner decorative border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ margin: '4px', border: '2px solid #5c3a0e', borderRadius: '6px' }}
        />

        {/* Worn texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: TEXTURE_SVG, backgroundSize: '80px 80px' }}
        />

        {/* Bloomsprout vines — sprout from each corner on first reveal,
            with additional curls layered on hover via .fx-arch-host. */}
        {bloomed && (
          <>
            <span className="fx-arch-vine" aria-hidden style={{ top: -8, left: -8, animationDelay: '0s' }}>
              <Vine size={42} strokeWidth={1.8} rotation={0} />
            </span>
            <span className="fx-arch-vine" aria-hidden style={{ top: -8, right: -8, animationDelay: '0.08s' }}>
              <Vine size={42} strokeWidth={1.8} rotation={90} />
            </span>
            <span className="fx-arch-vine" aria-hidden style={{ bottom: -8, left: -8, animationDelay: '0.16s' }}>
              <Vine size={42} strokeWidth={1.8} rotation={-90} />
            </span>
            <span className="fx-arch-vine" aria-hidden style={{ bottom: -8, right: -8, animationDelay: '0.24s' }}>
              <Vine size={42} strokeWidth={1.8} rotation={180} />
            </span>

            {/* Hover-only mid-edge curls. */}
            <span className="fx-arch-vine fx-arch-vine--hover" aria-hidden
                  style={{ top: '40%', left: -22, transform: 'translateY(-50%)', opacity: 0 }}>
              <Vine size={30} strokeWidth={1.6} rotation={-45} />
            </span>
            <span className="fx-arch-vine fx-arch-vine--hover" aria-hidden
                  style={{ top: '40%', right: -22, transform: 'translateY(-50%)', opacity: 0 }}>
              <Vine size={30} strokeWidth={1.6} rotation={135} />
            </span>
          </>
        )}

        {/* "YOU" badge */}
        {entry.isCurrentCrew && (
          <div className="absolute top-2 right-2 bg-teal text-navy-950 text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-widest z-10">
            YOU
          </div>
        )}

        {/* WANTED header */}
        <p
          className={`text-[#3d1f00] font-black tracking-[0.2em] uppercase leading-none ${cfg.wanted}`}
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          WANTED
        </p>
        <div className="h-[2px] bg-[#7a4f1a] w-full my-1.5" />

        {/* Initials box */}
        <div
          className="flex items-center justify-center border-2 border-[#7a4f1a] mb-2"
          style={{
            ...cfg.initials,
            background: 'rgba(180,140,60,0.25)',
          }}
        >
          <span
            className={`text-[#3d1f00] font-black tracking-tight ${cfg.initialsText}`}
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {initials}
          </span>
        </div>

        {/* DEAD OR ALIVE */}
        <p className="text-[#7a1a00] font-bold text-sm tracking-[0.3em] uppercase mb-1.5">
          Dead or Alive
        </p>

        {/* Crew name */}
        <p
          className="text-[#3d1f00] font-black text-center uppercase break-words leading-tight mb-2 w-full"
          style={{ fontFamily: "'Georgia', serif", fontSize: cfg.crewName }}
        >
          {entry.crewName}
        </p>

        <div className="h-px bg-[#7a4f1a]/60 w-full mb-2" />

        {/* Member list */}
        <div className="w-full mb-3">
          {displayedMembers.map(m => (
            <p key={m} className="text-[#5a3500] text-base font-bold text-center leading-relaxed">{m}</p>
          ))}
          {extraMembers > 0 && (
            <p className="text-[#7a4f1a] text-sm text-center italic">+ {extraMembers} more</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex justify-between w-full border-t-2 border-[#7a4f1a]/50 pt-2">
          <div className="text-center">
            <p className="text-[#7a4f1a] text-xs uppercase tracking-widest font-bold">Solves</p>
            <p className="text-[#3d1f00] font-mono font-black text-lg">{entry.solveCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[#7a4f1a] text-xs uppercase tracking-widest font-bold">Bounty</p>
            <p className="text-[#3d1f00] font-mono font-black text-lg">{entry.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
