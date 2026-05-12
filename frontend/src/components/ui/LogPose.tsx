/* ─── LogPose — three-dial loading spinner ───────────────────
   Generic navigational dial loader. Three concentric SVG rings,
   each spinning at a different rate, with a needle marker. Used
   anywhere we used to print plain "Loading…" text. Generic
   stacked dials — NOT the franchise's specific prop. */
export function LogPose({
  size = 38,
  label = 'Loading',
}: {
  size?: number
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--ink-soft, #4a3318)',
        fontFamily: 'var(--font-poster, "IM Fell English SC", serif)',
        fontSize: 12,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer ring */}
          <circle cx="20" cy="20" r="17" strokeWidth="1.4" />
          <g style={{ transformOrigin: '20px 20px', animation: 'logpose-spin-a 2.4s linear infinite' }}>
            <line x1="20" y1="3"  x2="20" y2="7" strokeWidth="2.2" />
            <circle cx="20" cy="5" r="1.4" fill="currentColor" />
          </g>
          {/* Middle ring */}
          <circle cx="20" cy="20" r="11" strokeWidth="1.2" />
          <g style={{ transformOrigin: '20px 20px', animation: 'logpose-spin-b 1.6s linear infinite reverse' }}>
            <line x1="20" y1="9"  x2="20" y2="12" strokeWidth="2" />
          </g>
          {/* Inner ring */}
          <circle cx="20" cy="20" r="5"  strokeWidth="1.2" />
          <g style={{ transformOrigin: '20px 20px', animation: 'logpose-spin-c 0.9s linear infinite' }}>
            <line x1="20" y1="15" x2="20" y2="17.5" strokeWidth="1.8" />
          </g>
          <circle cx="20" cy="20" r="1.2" fill="currentColor" />
        </g>
      </svg>
      <span>{label}…</span>
      <style>{`
        @keyframes logpose-spin-a { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes logpose-spin-b { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes logpose-spin-c { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] svg g { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
