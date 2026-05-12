import type { ReactNode, CSSProperties } from 'react'

/* ─── Generic crew-role theming ────────────────────────────────────
   Each major section of the site is themed around a generic
   pirate-crew archetype (Captain, Navigator, Cook, etc.). The role
   determines the eyebrow icon, the role label, and the accent tint
   shown on this section's eyebrow + decorative chip. NO franchise
   marks: role names are universal pirate-fiction nouns, icons are
   generic trade-tools, accents are just colours.

   Use:
     <SectionEyebrow role="navigator" label="The hunt" />
     <SectionRolePill role="cook" />
     {ROLE_ACCENT.navigator}  // -> "#2a6f9e"  */

export type CrewRole =
  | 'captain'
  | 'navigator'
  | 'treasurer'
  | 'sniper'
  | 'swordsman'
  | 'cook'
  | 'shipwright'
  | 'archaeologist'
  | 'doctor'
  | 'musician'

export const ROLE_LABEL: Record<CrewRole, string> = {
  captain:       'The Captain',
  navigator:     'The Navigator',
  treasurer:     'The Treasurer',
  sniper:        'The Sniper',
  swordsman:     'The Swordsman',
  cook:          'The Cook',
  shipwright:    'The Shipwright',
  archaeologist: 'The Archaeologist',
  doctor:        'The Doctor',
  musician:      'The Musician',
}

/* Each accent is paired so we have a strong stroke + a soft fill. */
export const ROLE_ACCENT: Record<CrewRole, { ink: string; soft: string; chip: string }> = {
  captain:       { ink: '#a8302a', soft: 'rgba(168,48,42,0.18)',  chip: '#fde0dc' },
  navigator:     { ink: '#1f5f87', soft: 'rgba(31,95,135,0.20)',  chip: '#d6ecf6' },
  treasurer:     { ink: '#b27210', soft: 'rgba(178,114,16,0.22)', chip: '#fbe5b8' },
  sniper:        { ink: '#6b5d1a', soft: 'rgba(107,93,26,0.20)',  chip: '#ede4b8' },
  swordsman:     { ink: '#2e6b3a', soft: 'rgba(46,107,58,0.20)',  chip: '#d4e8d8' },
  cook:          { ink: '#c4541d', soft: 'rgba(196,84,29,0.22)',  chip: '#fbdac4' },
  shipwright:    { ink: '#2a4a6a', soft: 'rgba(42,74,106,0.22)',  chip: '#d4dfeb' },
  archaeologist: { ink: '#8a3e1a', soft: 'rgba(138,62,26,0.20)',  chip: '#ecd6c4' },
  doctor:        { ink: '#a83a6a', soft: 'rgba(168,58,106,0.20)', chip: '#f6dce6' },
  musician:      { ink: '#5e3a8a', soft: 'rgba(94,58,138,0.20)',  chip: '#dfd2ee' },
}

/* The eyebrow shown above each section heading. Purely typographic
   now — small uppercase line in the role's accent ink, no chip, no
   icon stamp. The `icon` and `style` props are accepted for
   backwards-compat with callsites but only the icon is rendered
   inline (very small, same ink as the text). */
export function SectionEyebrow({
  role,
  label,
  icon,
  style,
}: {
  role: CrewRole
  label: string
  icon?: ReactNode
  style?: CSSProperties
}) {
  const a = ROLE_ACCENT[role]
  return (
    <p
      className="gsap-reveal"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        fontFamily: '"IM Fell English SC", Georgia, serif',
        fontSize: 11,
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        color: a.ink,
        fontWeight: 700,
        ...style,
      }}
    >
      {icon && (
        <span aria-hidden style={{ display: 'inline-flex', color: a.ink, opacity: 0.85 }}>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </p>
  )
}

/* Compact role-pill — for use outside the main eyebrow slot
   (e.g. on the page heading of an authed page). */
export function SectionRolePill({
  role,
  icon,
}: {
  role: CrewRole
  icon: ReactNode
}) {
  const a = ROLE_ACCENT[role]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        background: a.chip,
        border: `2px solid ${a.ink}`,
        borderRadius: 999,
        color: a.ink,
        fontFamily: '"IM Fell English SC", Georgia, serif',
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>{icon}</span>
      {ROLE_LABEL[role]}
    </span>
  )
}
