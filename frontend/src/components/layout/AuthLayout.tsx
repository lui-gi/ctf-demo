import { Outlet, Link } from 'react-router-dom'

const STARS: [number, number, number, number][] = [
  [8, 5, 2, 0.70], [15, 12, 1, 0.40], [23, 3, 1, 0.60], [31, 18, 2, 0.50],
  [42, 8, 1, 0.35], [55, 4, 2, 0.65], [63, 15, 1, 0.45], [71, 7, 1, 0.55],
  [79, 11, 2, 0.40], [87, 3, 1, 0.70], [92, 19, 1, 0.30], [4, 28, 1, 0.50],
  [18, 35, 2, 0.40], [29, 22, 1, 0.60], [47, 30, 1, 0.35], [58, 25, 2, 0.50],
  [67, 32, 1, 0.45], [76, 28, 1, 0.55], [84, 22, 2, 0.40], [93, 35, 1, 0.30],
  [11, 42, 1, 0.50], [36, 45, 2, 0.40], [52, 38, 1, 0.60], [74, 43, 1, 0.35],
  [89, 48, 2, 0.45], [6, 58, 1, 0.30], [27, 65, 1, 0.35], [44, 72, 2, 0.25],
  [61, 55, 1, 0.30], [78, 68, 1, 0.35], [91, 62, 2, 0.28], [33, 78, 1, 0.25],
]

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
