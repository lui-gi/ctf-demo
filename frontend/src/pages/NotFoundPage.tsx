import { Link } from 'react-router-dom'
import { XSpot } from '../components/ui/PirateMotifs'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div style={{ color: '#8a2a1f' }} className="mb-4">
        <XSpot size={120} strokeWidth={3} />
      </div>
      <h1 className="h-poster mb-2" style={{ fontSize: '3rem', fontWeight: 900 }}>
        404
      </h1>
      <p className="ink-soft mb-8 font-poster" style={{ fontSize: 14, letterSpacing: '0.18em' }}>
        These waters don't appear on any map.
      </p>
      <Link to="/challenges" className="btn-stamp">
        Back to Challenges
      </Link>
    </div>
  )
}
