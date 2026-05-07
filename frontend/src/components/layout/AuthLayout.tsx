import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 60%, #0d3070 100%)' }}
    >
      <Link to="/" className="font-mono font-black italic text-3xl tracking-wide mb-8">
        <span className="text-white">prog</span>
        <span className="text-amber">ctf</span>
      </Link>
      <div className="w-full max-w-sm bg-navy-900/80 border border-navy-700 rounded-lg p-8">
        <Outlet />
      </div>
    </div>
  )
}
