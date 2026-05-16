import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['var(--font-bebas)', 'Bebas Neue', 'cursive'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-sans)', 'DM Sans', 'sans-serif'],
      },
      colors: {
        base: '#070A12',
        surface: '#0D1117',
        elevated: '#131923',
        hover: '#1A2332',
        accent: {
          DEFAULT: '#2F80ED',
          2: '#56CFE1',
        },
        gold: '#D4A843',
        success: '#0FB872',
        danger: '#E53E3E',
        warning: '#F6AD55',
        purple: '#9F7AEA',
      },
      borderColor: {
        subtle: '#141B27',
        DEFAULT: '#1E2A3A',
        strong: '#2D3F55',
      },
    },
  },
  plugins: [],
}

export default config
