import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 60%, #0d3070 100%)' }}
    >
      <div className="text-8xl mb-6 select-none">🌊</div>
      <h1 className="font-mono font-black italic text-4xl mb-2">
        <span className="text-white">404</span>
      </h1>
      <p className="text-steel mb-8">These waters don't appear on any map.</p>
      <Link
        to="/challenges"
        className="px-6 py-2.5 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
      >
        Back to Challenges
      </Link>
    </div>
  )
}
