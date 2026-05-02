import type { Config } from 'tailwindcss';

// Tailwind is layered on top of the existing var-based CSS in
// `src/theme/global.css`. We bridge the locked palette into Tailwind via
// CSS-var-backed colors so utilities like `bg-deepSea` resolve to the same
// tokens the rest of the app already uses, and we keep `corePlugins.preflight`
// OFF so Tailwind doesn't reset the typography/link/button rules global.css
// already establishes.
//
// Difficulty-pill colors were added 2026-05-02 per the vocabulary pivot —
// these are the only NEW palette tokens the pivot introduced. They sit
// alongside the locked deep-sea / parchment / brass / blood-red tokens.
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        deepSea: 'var(--color-deep-sea)',
        deepSeaSoft: 'var(--color-deep-sea-soft)',
        deepSeaDeep: 'var(--color-deep-sea-deep)',
        parchment: 'var(--color-parchment)',
        parchmentDim: 'var(--color-parchment-dim)',
        parchmentEdge: 'var(--color-parchment-edge)',
        bloodRed: 'var(--color-blood-red)',
        bloodRedDim: 'var(--color-blood-red-dim)',
        brass: 'var(--color-brass)',
        brassDim: 'var(--color-brass-dim)',
        fadedInk: 'var(--color-faded-ink)',
        fadedInkSoft: 'var(--color-faded-ink-soft)',
        inkOnDark: 'var(--color-ink-on-dark)',
        inkOnDarkDim: 'var(--color-ink-on-dark-dim)',
        // Difficulty pill tokens (vocabulary pivot 2026-05-02). Always shown
        // alongside themed tier names (The Port / Open Sea / Cursed Depths).
        diffEasy: 'var(--color-diff-easy)',
        diffEasyDim: 'var(--color-diff-easy-dim)',
        diffMedium: 'var(--color-diff-medium)',
        diffMediumDim: 'var(--color-diff-medium-dim)',
        diffHard: 'var(--color-blood-red)',
        diffHardDim: 'var(--color-blood-red-dim)',
      },
      fontFamily: {
        display: ['"IM Fell English"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
