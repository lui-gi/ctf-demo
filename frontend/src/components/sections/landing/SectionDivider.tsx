import { CompassRose, Waves } from '../../ui/PirateMotifs'

/* ─── SectionDivider ──────────────────────────────────────────────
   Divider used between every major landing section. Two variants:
   - "map":   thin dashed-route line with a compass rose centerpiece
   - "waves": sepia wave band with a compass-rose medallion */

export function SectionDivider({ kind = 'map' }: { kind?: 'map' | 'waves' } = {}) {
  if (kind === 'waves') {
    return (
      <div style={{ position: 'relative', height: 56 }}>
        <Waves variant="divider" tone="#5a3a1a" />
        <div
          aria-hidden
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--parchment-50, #fff8e0)',
            padding: '4px 10px',
            borderRadius: '50%',
            color: 'var(--parchment-600, #5a3a1a)',
            boxShadow: '0 0 0 2px var(--ink, #1d1408), 0 4px 0 -1px var(--ink, #1d1408)',
          }}
        >
          <CompassRose size={18} strokeWidth={1.3} />
        </div>
      </div>
    )
  }
  return (
    <div style={{ padding: '8px 24px' }}>
      <div className="map-route">
        <span style={{ color: '#5a3a1a' }}>
          <CompassRose size={20} strokeWidth={1.3} />
        </span>
      </div>
    </div>
  )
}
