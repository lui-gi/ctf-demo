import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          975: '#010a1a',
          950: '#03082e',
          900: '#0a1a5c',
          800: '#0d3070',
          700: '#1a3a6a',
          600: '#2a4a8a',
        },
        amber: '#ffb347',
        teal: '#3ecfbe',
        steel: '#8ab4e8',
        success: '#4dbb88',
        danger: '#cc4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [forms],
} satisfies Config
