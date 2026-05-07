import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CrewBadge from '../ui/CrewBadge'

const links = [
  { to: '/challenges', label: 'Challenges' },
  { to: '/bounties', label: 'Bounties' },
  { to: '/crew', label: 'Crew' },
  { to: '/profile', label: 'Profile' },
]

export default function TopNav() {
  const { logout, crewRank } = useAuth()
  return (
    <nav className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur border-b border-navy-700 px-6 py-3 flex items-center justify-between">
      <Link
        to="/dashboard"
        className="font-mono font-black italic text-xl tracking-wide"
      >
        <span className="text-white">prog</span>
        <span className="text-teal">ctf</span>
      </Link>

      <div className="flex items-center gap-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'text-white text-sm border-b border-amber pb-0.5'
                : 'text-steel text-sm hover:text-white transition-colors'
            }
          >
            {label}
          </NavLink>
        ))}
        <CrewBadge crewRank={crewRank} />
        <button
          onClick={logout}
          className="text-steel text-sm hover:text-danger transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
