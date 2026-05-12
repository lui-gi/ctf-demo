import { Outlet, Link } from 'react-router-dom'
import { JollyRoger, CompassRose } from '../ui/PirateMotifs'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Swirl decoration backdrop */}
      <div className="swirl-backdrop" aria-hidden />

      {/* Wordmark */}
      <Link
        to="/"
        className="relative font-poster italic text-3xl tracking-wide mb-6 flex items-center gap-2"
        style={{ zIndex: 10, color: '#2a1a08' }}
      >
        <span style={{ color: '#5a3a1a' }} className="animate-compass">
          <CompassRose size={26} strokeWidth={1.4} />
        </span>
        <span>prog</span>
        <span style={{ color: '#8a2a1f' }}>ctf</span>
      </Link>

      {/* Card — bounty-poster framing */}
      <div
        className="relative w-full max-w-sm p-8 bounty-frame"
        style={{ zIndex: 10 }}
      >
        {/* Decorative jolly roger header */}
        <div
          aria-hidden
          className="absolute left-1/2 -top-7 -translate-x-1/2 px-3 py-1 rounded"
          style={{
            background: '#5a3a1a',
            color: '#f3e2b6',
            border: '2px solid #5a3a1a',
          }}
        >
          <JollyRoger size={28} strokeWidth={1.6} />
        </div>

        <div className="pt-3">
          <Outlet />
        </div>
      </div>

      {/* Back to home */}
      <Link
        to="/"
        className="relative mt-8 btn-ink"
        style={{ zIndex: 10 }}
      >
        ← Home
      </Link>
    </div>
  )
}
