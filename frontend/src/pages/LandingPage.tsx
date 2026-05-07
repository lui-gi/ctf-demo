import { Link } from 'react-router-dom'

const STARS: [number, number, number][] = [
  [4, 8, 3], [7, 22, 2], [3, 38, 2], [6, 55, 3], [2, 70, 2], [9, 85, 3],
  [14, 93, 2], [11, 45, 2], [18, 30, 3], [16, 65, 2], [22, 78, 2], [5, 95, 3],
  [25, 15, 2], [20, 50, 2], [8, 42, 3], [13, 73, 2], [19, 88, 2], [24, 33, 3],
  [10, 60, 2], [15, 48, 2], [28, 20, 3], [26, 82, 2], [12, 10, 2], [21, 40, 3],
  [17, 57, 2], [23, 67, 2], [6, 77, 3], [29, 5, 2],
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 18%, #070f3a 40%, #0c1f6a 58%, #0a1a58 75%, #050d38 90%, #030820 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 1 }}>
        {STARS.map(([top, left, size], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: 0.25 + (i % 5) * 0.12,
            }}
          />
        ))}
      </div>

      {/* Moon — large, upper left */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 2,
          top: '5%',
          left: '11%',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
          boxShadow: '0 0 50px 28px rgba(255,248,215,0.22), 0 0 110px 60px rgba(200,225,255,0.10)',
        }}
      />

      {/* Mid-ground layered hills */}
      <svg
        className="absolute pointer-events-none w-full"
        style={{ zIndex: 4, bottom: '24%', left: 0 }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 200 Q180 65 400 115 Q620 165 830 78 Q1030 0 1240 72 Q1360 118 1440 88 L1440 200 Z"
          fill="#0b1a58" opacity="0.50"
        />
        <path
          d="M0 200 Q230 108 460 148 Q680 188 890 118 Q1090 55 1295 122 Q1390 158 1440 138 L1440 200 Z"
          fill="#0d2070" opacity="0.60"
        />
      </svg>

      {/* Nav */}
      <nav className="relative flex items-center justify-end gap-4 px-10 py-4" style={{ zIndex: 10 }}>
        <Link to="/login" className="text-steel text-sm px-4 py-1.5 hover:text-white transition-colors">
          Login
        </Link>
        <Link
          to="/register"
          className="text-sm px-4 py-1.5 bg-teal text-black font-semibold rounded hover:opacity-90 transition-opacity"
        >
          Register
        </Link>
      </nav>

      {/* Wordmark — top center */}
      <div className="relative flex flex-col items-center text-center px-4 pt-0 pb-0" style={{ zIndex: 10 }}>
        <h1
          className="font-mono font-black italic tracking-wide leading-none mb-3"
          style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
        >
          <span className="text-white">prog</span>
          <span
            className="text-teal"
            style={{
              textShadow:
                '0 0 24px rgba(62,207,190,0.80), 0 0 55px rgba(62,207,190,0.45), 0 0 100px rgba(62,207,190,0.20)',
            }}
          >
            ctf
          </span>
        </h1>
        <p className="text-steel/70 text-xs tracking-[0.4em] uppercase">
          Encrypted Treasures
        </p>
      </div>

      {/* Ship — centered, dominant */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 6,
          bottom: 'calc(20% + 5px)',
          left: '50%',
          transform: 'translateX(-50%) rotate(15deg)',
          width: 'clamp(280px, 30vw, 460px)',
          animation: 'shipFloat 7s ease-in-out infinite',
        }}
      >
        <img
          src="/assets/progctf-ship-removebg-preview.png"
          alt=""
          className="w-full h-auto"
          style={{
            filter: 'drop-shadow(0 0 44px rgba(62,207,190,0.55)) drop-shadow(0 30px 40px rgba(0,0,0,0.75))',
          }}
        />
      </div>

      {/* Water surface */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 5,
          bottom: 0,
          left: 0,
          right: 0,
          height: '28%',
          background: 'linear-gradient(180deg, transparent 0%, #05102a 25%, #040d22 60%, #030918 100%)',
        }}
      />

      {/* Moonlight streak on water */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 5,
          bottom: '4%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '160px',
          height: '140px',
          background: 'radial-gradient(ellipse at 50% 10%, rgba(255,250,205,0.12) 0%, rgba(255,250,205,0.05) 50%, transparent 100%)',
          filter: 'blur(14px)',
        }}
      />

      {/* CTAs — bottom center, above water line */}
      <div
        className="absolute flex gap-4 justify-center"
        style={{ zIndex: 9, bottom: '13%', left: 0, right: 0 }}
      >
        <Link
          to="/register"
          className="px-8 py-3 bg-teal text-navy-950 font-bold rounded hover:opacity-90 transition-opacity text-sm"
        >
          Join the Hunt
        </Link>
        <Link
          to="/login"
          className="px-8 py-3 border border-navy-700/80 text-steel rounded hover:text-white hover:border-steel/60 transition-colors text-sm backdrop-blur-sm"
        >
          Login
        </Link>
      </div>

      <style>{`
        @keyframes shipFloat {
          0%, 100% { transform: translateX(-50%) rotate(15deg) translateY(0px); }
          50%       { transform: translateX(-50%) rotate(15deg) translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
