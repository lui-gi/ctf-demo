import { usePowerToggle } from '../../lib/usePowerToggle'

/* ─── PowerChip ───────────────────────────────────────────────
   Tiny on/off pill that controls the cursor-trail effect. Two
   placements share the same hook so flipping it in one updates
   the other.

   Hidden entirely if the user has prefers-reduced-motion enabled,
   since the effect would be a no-op anyway. */
export function PowerChip({ compact = false }: { compact?: boolean }) {
  const [enabled, toggle, reduced] = usePowerToggle()
  if (reduced) return null
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={`Cursor trail — currently ${enabled ? 'on' : 'off'}`}
      title={`Power: ${enabled ? 'on' : 'off'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '2px 8px' : '4px 12px',
        background: enabled
          ? 'var(--role-captain-ink, #a8302a)'
          : 'rgba(255, 252, 232, 0.92)',
        color: enabled ? 'var(--parchment-50, #fff8e0)' : 'var(--ink, #1d1408)',
        border: '2px solid var(--ink, #1d1408)',
        borderRadius: 999,
        fontFamily: 'var(--font-poster, "IM Fell English SC", serif)',
        fontSize: compact ? '0.65rem' : '0.7rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 0 -1px var(--ink, #1d1408)',
        transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease',
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)' }}
      onMouseUp={e =>   { e.currentTarget.style.transform = 'translateY(0)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <span
        aria-hidden
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: enabled ? '#9bff7e' : 'rgba(90, 58, 26, 0.4)',
          boxShadow: enabled ? '0 0 6px 1px rgba(155, 255, 126, 0.7)' : 'none',
          transition: 'background 0.18s ease, box-shadow 0.18s ease',
        }}
      />
      Power · {enabled ? 'On' : 'Off'}
    </button>
  )
}
