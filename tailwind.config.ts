import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import typography from '@tailwindcss/typography'

/** Les couleurs pointent vers les variables définies dans app/globals.css. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        raised: token('raised'),
        ink: token('ink'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-strong': token('accent-strong'),
        'on-accent': token('on-accent'),
        rule: token('rule'),
        up: token('up'),
        down: token('down'),
      },
      fontFamily: {
        sans: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        // Direction « Console » : angles vifs, 2px partout sauf les pastilles.
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '3px',
      },
      keyframes: {
        // Flash au tick. Deux teintes distinctes plutôt qu'une opacité, pour
        // rester lisible sur les deux thèmes.
        'flash-up': {
          '0%': { backgroundColor: 'rgb(var(--up) / 0.22)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-down': {
          '0%': { backgroundColor: 'rgb(var(--down) / 0.22)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'flash-up': 'flash-up 600ms ease-out',
        'flash-down': 'flash-down 600ms ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [typography],
}

export default config
