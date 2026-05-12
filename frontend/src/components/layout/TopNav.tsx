import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CrewBadge from '../ui/CrewBadge'
import { CompassRose } from '../ui/PirateMotifs'
import { PowerChip } from '../ui/PowerChip'
import { useScrollRotation } from '../../lib/useScrollRotation'

const links = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/bounties',   label: 'Bounties' },
  { to: '/crew',       label: 'Crew' },
  { to: '/profile',    label: 'Profile' },
]

export default function TopNav() {
  const { logout, crewRank } = useAuth()
  /* Compass rotates as user scrolls — points "deeper" into the page. */
  const compassDeg = useScrollRotation(900)
  return (
    <nav
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{
        background:
          'linear-gradient(180deg, #f3e2b6 0%, #e8cf99 100%)',
        borderBottom: '2px solid #5a3a1a',
        boxShadow: '0 4px 10px -6px rgba(60,30,5,0.4)',
        fontFamily: '"IM Fell English", Georgia, serif',
      }}
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-poster italic text-xl tracking-wide"
        style={{ color: '#2a1a08' }}
      >
        <span
          style={{
            color: '#5a3a1a',
            display: 'inline-block',
            transform: `rotate(${compassDeg.toFixed(1)}deg)`,
            transition: 'transform 0.12s linear',
          }}
        >
          <CompassRose size={22} strokeWidth={1.3} />
        </span>
        <span>prog</span>
        <span style={{ color: '#8a2a1f' }}>ctf</span>
      </Link>

      <div className="flex items-center gap-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'text-sm font-bold pb-0.5 border-b-2'
                : 'text-sm font-bold transition-colors'
            }
            style={({ isActive }) =>
              isActive
                ? { color: '#2a1a08', borderColor: '#8a2a1f', fontFamily: '"IM Fell English SC", Georgia, serif', letterSpacing: '0.08em' }
                : { color: '#4a3318', fontFamily: '"IM Fell English SC", Georgia, serif', letterSpacing: '0.08em' }
            }
          >
            {label}
          </NavLink>
        ))}
        <CrewBadge crewRank={crewRank} />
        <PowerChip compact />
        <button
          onClick={logout}
          className="text-sm font-bold transition-colors"
          style={{ color: '#4a3318', fontFamily: '"IM Fell English SC", Georgia, serif', letterSpacing: '0.08em' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8a2a1f')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a3318')}
        >
          Abandon Ship
        </button>
      </div>
    </nav>
  )
}
