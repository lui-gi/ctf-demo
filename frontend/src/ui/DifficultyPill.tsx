import { strings } from '@/theme/strings';

/**
 * DifficultyPill — vocabulary pivot 2026-05-02.
 *
 * Renders a colored pill with both the themed tier name (e.g. "The Port")
 * and the plain English difficulty (e.g. "Easy"), so players never have to
 * mentally translate the difficulty bucket.
 *
 * Tier → color map (locked, mirrored from tailwind.config.ts diff* tokens):
 *   port           → diffEasy   (green)
 *   open_sea       → diffMedium (amber)
 *   cursed_depths  → bloodRed   (red)
 *
 * `showThemed` defaults to true. Pass false where the surrounding context
 * already announces the themed name (e.g. a card header that already shows
 * "The Port" in the title row).
 */

export type Tier = 'port' | 'open_sea' | 'cursed_depths';

interface Props {
  tier: Tier;
  /** When true (default), shows "The Port (Easy)". When false, "Easy". */
  showThemed?: boolean;
}

const TONE: Record<Tier, { fg: string; bg: string; ring: string }> = {
  port: {
    fg: 'var(--color-diff-easy)',
    bg: 'color-mix(in srgb, var(--color-diff-easy) 15%, transparent)',
    ring: 'color-mix(in srgb, var(--color-diff-easy) 40%, transparent)',
  },
  open_sea: {
    fg: 'var(--color-diff-medium)',
    bg: 'color-mix(in srgb, var(--color-diff-medium) 15%, transparent)',
    ring: 'color-mix(in srgb, var(--color-diff-medium) 40%, transparent)',
  },
  cursed_depths: {
    fg: 'var(--color-ink-on-dark)',
    bg: 'color-mix(in srgb, var(--color-blood-red) 22%, transparent)',
    ring: 'color-mix(in srgb, var(--color-blood-red) 55%, transparent)',
  },
};

export function DifficultyPill({ tier, showThemed = true }: Props): JSX.Element {
  const themed = strings.voyage.difficultyLabels[tier] ?? tier;
  const plain = strings.voyage.difficultyPlainLabels[tier] ?? tier;
  const tone = TONE[tier];
  const label = `Difficulty: ${themed} (${plain})`;
  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.35em',
        padding: '3px 9px',
        fontSize: '0.78rem',
        lineHeight: 1.2,
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: 999,
        color: tone.fg,
        background: tone.bg,
        boxShadow: `inset 0 0 0 1px ${tone.ring}`,
        whiteSpace: 'nowrap',
      }}
    >
      {showThemed ? (
        <>
          <span aria-hidden>{themed}</span>
          <span
            aria-hidden
            style={{
              opacity: 0.6,
              fontWeight: 500,
              fontSize: '0.72rem',
            }}
          >
            ({plain})
          </span>
        </>
      ) : (
        <span aria-hidden>{plain}</span>
      )}
    </span>
  );
}
