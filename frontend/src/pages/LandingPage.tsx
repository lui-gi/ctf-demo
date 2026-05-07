import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #03082e 0%, #0a1a5c 45%, #0d3070 75%, #0a2050 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[8%] left-[15%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 top-[12%] left-[60%]" />
        <div className="absolute w-1 h-1 rounded-full bg-white/50 top-[6%] left-[80%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/30 top-[20%] left-[35%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/50 top-[5%] left-[50%]" />
        <div className="absolute w-1 h-1 rounded-full bg-white/30 top-[15%] left-[90%]" />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 top-[18%] left-[70%]" />
      </div>

      {/* Moon */}
      <div
        className="absolute top-10 left-14 w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #fffbe8, #e8d89a)',
          boxShadow: '0 0 30px 12px rgba(255,251,232,0.25)',
        }}
      />

      {/* Minimal nav */}
      <nav className="relative z-10 flex justify-end gap-6 px-10 py-6">
        <Link to="/login" className="text-steel text-sm hover:text-white transition-colors">
          Login
        </Link>
        <Link
          to="/register"
          className="text-sm px-4 py-1.5 border border-amber/60 text-amber rounded hover:bg-amber/10 transition-colors"
        >
          Register
        </Link>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10">
        <div
          className="text-9xl mb-6 select-none"
          style={{ filter: 'drop-shadow(0 0 24px rgba(255,179,71,0.35))' }}
        >
          🏴‍☠️
        </div>
        <h1 className="font-mono font-black italic text-6xl tracking-wide mb-3">
          <span className="text-white">prog</span>
          <span className="text-amber">ctf</span>
        </h1>
        <p className="text-steel text-sm tracking-[0.3em] uppercase mb-10">
          Encrypted Treasures
        </p>
        <div className="flex gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 transition-colors"
          >
            Join the Hunt
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-navy-700 text-steel rounded hover:text-white hover:border-steel transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Rocky coast SVG */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none">
        <svg viewBox="0 0 1440 100" fill="none" className="w-full" preserveAspectRatio="none">
          <path
            d="M0 70 Q180 35 360 60 Q540 85 720 50 Q900 15 1080 48 Q1260 80 1440 42 L1440 100 L0 100 Z"
            fill="#0a1a5c" opacity="0.55"
          />
          <path
            d="M0 82 Q220 55 440 75 Q660 95 880 65 Q1060 40 1240 72 Q1360 88 1440 62 L1440 100 L0 100 Z"
            fill="#0d3070" opacity="0.75"
          />
          <path
            d="M0 92 Q300 75 600 88 Q900 100 1200 84 Q1340 78 1440 88 L1440 100 L0 100 Z"
            fill="#0a2050" opacity="0.9"
          />
        </svg>
      </div>
    </div>
  )
}
