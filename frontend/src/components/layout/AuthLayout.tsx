import { Outlet, Link } from 'react-router-dom'
import { STARS } from './starfield'

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 55%, #0a1a52 100%)' }}
    >
      {/* Star field */}
      {STARS.map(([x, y, size, opacity], i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#fff',
            opacity,
          }}
        />
      ))}

      {/* Moon */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5%',
          left: '4%',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
          boxShadow: '0 0 30px 14px rgba(255,248,215,0.18), 0 0 70px 36px rgba(200,225,255,0.08)',
        }}
      />

      {/* Logo */}
      <Link
        to="/"
        className="relative font-mono font-black italic text-3xl tracking-wide mb-8"
        style={{ zIndex: 10 }}
      >
        <span className="text-white">prog</span>
        <span
          className="text-teal"
          style={{ textShadow: '0 0 24px rgba(62,207,190,0.70), 0 0 55px rgba(62,207,190,0.35)' }}
        >
          ctf
        </span>
      </Link>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-[10px] p-8"
        style={{
          zIndex: 10,
          background: 'rgba(5, 12, 40, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(62, 207, 190, 0.30)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.50), 0 0 18px rgba(62,207,190,0.08)',
        }}
      >
        <Outlet />
      </div>

      {/* Back to home */}
      <Link
        to="/"
        className="relative mt-6 font-mono font-bold text-xs tracking-[0.3em] uppercase px-6 py-2 rounded transition-all duration-200"
        style={{
          zIndex: 10,
          color: '#d8ffe9',
          border: '1px solid rgba(216,255,233,0.30)',
          textShadow: '0 0 10px rgba(0,255,136,0.45)',
          boxShadow: '0 0 12px rgba(0,255,136,0.08)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(216,255,233,0.65)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 18px rgba(0,255,136,0.18)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(216,255,233,0.30)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 12px rgba(0,255,136,0.08)'
        }}
      >
        ← Home
      </Link>
    </div>
  )
}
