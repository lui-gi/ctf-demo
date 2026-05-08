import type { BountyEntry } from '../../lib/types'

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
    poster: 'w-60',
    wanted: 'text-4xl',
    initials: { width: '7rem', height: '7rem' },
    initialsText: 'text-4xl',
    crewName: '1.1rem',
    rankLabel: '1ST',
  },
  md: {
    poster: 'w-52',
    wanted: 'text-3xl',
    initials: { width: '6rem', height: '6rem' },
    initialsText: 'text-3xl',
    crewName: '1rem',
    rankLabel: '2ND',
  },
  sm: {
    poster: 'w-44',
    wanted: 'text-2xl',
    initials: { width: '5rem', height: '5rem' },
    initialsText: 'text-2xl',
    crewName: '0.9rem',
    rankLabel: '3RD',
  },
}

const TEXTURE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`

export default function WantedPoster({ entry, size }: WantedPosterProps) {
  const cfg = sizeConfig[size]
  const initials = getInitials(entry.crewName)
  const displayedMembers = entry.members.slice(0, 5)
  const extraMembers = entry.members.length - displayedMembers.length

  return (
    <div className={`flex flex-col items-center [filter:drop-shadow(0_8px_24px_rgba(0,0,0,0.7))] ${cfg.poster}`}>
      {/* Rank badge */}
      <div className="mb-[-10px] z-10 relative">
        <span
          className="font-mono text-[10px] font-black px-3 py-1 tracking-widest uppercase"
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
        <p className="text-[#7a1a00] font-bold text-[10px] tracking-[0.3em] uppercase mb-1.5">
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
            <p key={m} className="text-[#5a3500] text-[11px] text-center leading-relaxed">{m}</p>
          ))}
          {extraMembers > 0 && (
            <p className="text-[#7a4f1a] text-[10px] text-center italic">+ {extraMembers} more</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex justify-between w-full border-t-2 border-[#7a4f1a]/50 pt-2">
          <div className="text-center">
            <p className="text-[#7a4f1a] text-[9px] uppercase tracking-widest font-bold">Solves</p>
            <p className="text-[#3d1f00] font-mono font-black text-sm">{entry.solveCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[#7a4f1a] text-[9px] uppercase tracking-widest font-bold">Bounty</p>
            <p className="text-[#3d1f00] font-mono font-black text-sm">{entry.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
