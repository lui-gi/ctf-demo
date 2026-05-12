import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

/* ─── Palette notes ────────────────────────────────────────────────
   The site is themed as an aged bounty-poster / Grand-Line voyage.
   We keep the legacy navy/amber/teal/steel tokens working (they're
   referenced throughout the existing components) but remap them onto
   sepia / parchment / ink / stamp-red / gold so the whole app shares
   one warm, weathered colour world without any per-class refactor.

   Generic pirate iconography only — no franchise marks. */

const parchment  = '#efdcb2' // lit page
const parchmentH = '#f5e8c8' // highlight (lighter sheet)
const aged       = '#c9a96a' // mid tone, sun-bleached fibre
const agedDark   = '#a3823d' // shadowed edge
const ink        = '#2a1a08' // body / heading ink
const inkSoft    = '#4a3318' // faded ink
const stampRed   = '#8a2a1f' // wax-seal / bounty stamp
const stampRedH  = '#a63a2c' // hover
const shadowBrn  = '#5a3a1a' // deep shadow line
const gold       = '#c9962a' // doubloon
const goldH      = '#e1b049' // doubloon highlight
const seaInk     = '#1f3a55' // sea/ink-on-map blue, used very sparingly
const ok         = '#3d6b3a' // approved-stamp green

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* New themed tokens */
        parchment: {
          DEFAULT: parchment,
          100: parchmentH,
          200: parchment,
          300: '#e6d09c',
          400: aged,
          500: agedDark,
          600: shadowBrn,
        },
        aged: {
          DEFAULT: aged,
          dark: agedDark,
        },
        ink: {
          DEFAULT: ink,
          soft: inkSoft,
        },
        stamp: {
          DEFAULT: stampRed,
          hi: stampRedH,
        },
        gold: {
          DEFAULT: gold,
          hi: goldH,
        },
        sea: seaInk,

        /* ─── Legacy aliases ─────────────────────────────────────
           These keep every existing `text-navy-*`, `bg-navy-*`,
           `text-amber`, `text-teal`, `text-steel`, `text-success`,
           `text-danger` reference working without edits. We map
           them onto the new sepia world. */
        navy: {
          975: parchment,    // page background
          950: ink,          // strong contrast text / dark button face
          900: '#e2c98a',    // surface — aged card face
          800: aged,         // border / divider
          700: agedDark,     // strong border
          600: shadowBrn,
        },
        amber:   gold,        // primary accent (doubloon)
        teal:    stampRed,    // "tech accent" → stamp red
        steel:   inkSoft,     // secondary ink (faded body copy)
        success: ok,
        danger:  stampRed,
      },
      fontFamily: {
        sans:   ['"IM Fell English"', 'Georgia', '"Times New Roman"', 'ui-serif', 'serif'],
        mono:   ['"Special Elite"', '"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        serif:  ['"IM Fell English"', 'Georgia', '"Times New Roman"', 'ui-serif', 'serif'],
        poster: ['"IM Fell English SC"', '"IM Fell English"', 'Georgia', 'ui-serif', 'serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        flagFlap: {
          '0%, 100%': { transform: 'skewY(-1deg) translateY(0)' },
          '50%':       { transform: 'skewY(1deg) translateY(-2px)' },
        },
        compassSpin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        stampDrop: {
          '0%':   { transform: 'rotate(-12deg) scale(1.6)', opacity: '0' },
          '60%':  { transform: 'rotate(-8deg) scale(0.94)', opacity: '0.9' },
          '100%': { transform: 'rotate(-8deg) scale(1)',    opacity: '1' },
        },
      },
      animation: {
        shake:        'shake 0.4s ease-in-out',
        'flag-flap':  'flagFlap 5s ease-in-out infinite',
        'compass':    'compassSpin 60s linear infinite',
        'stamp':      'stampDrop 0.6s cubic-bezier(.2,.7,.2,1.1) both',
      },
      backgroundImage: {
        /* Parchment fibre — a generic procedural fibre/grain texture. */
        'parchment-fibre':
          "radial-gradient(ellipse 800px 480px at 30% 18%, rgba(255,240,198,0.55) 0%, transparent 60%)," +
          "radial-gradient(ellipse 700px 420px at 78% 88%, rgba(120,80,30,0.18) 0%, transparent 65%)," +
          "linear-gradient(180deg, #f3e2b6 0%, #efdcb2 35%, #e6cf99 100%)",
        /* Soft compass-rose vignette used as section decoration. */
        'compass-fade':
          "radial-gradient(circle at center, rgba(90,58,26,0.10) 0%, transparent 60%)",
      },
    },
  },
  plugins: [forms],
} satisfies Config
