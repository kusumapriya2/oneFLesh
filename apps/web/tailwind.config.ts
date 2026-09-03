import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand palette (unchanged — used as accent/bg) ─────
        'crimson-deep': '#4a0a12',
        'crimson': '#6b0f1a',
        'crimson-light': '#8b1a2a',
        'gold': '#c9a84c',
        'gold-light': '#e2c97e',
        // ── Surface tokens remapped to dark theme ─────────────
        'cream': '#0d0204',          // darkest page background
        'warm-white': '#1a0508',     // card surface
        'rose-pale': '#200608',      // hover / subtle surface
        // ── Text tokens remapped to light-on-dark ─────────────
        'text-muted': '#a09080',     // muted warm text on dark bg
        'text-deep': '#ede0d4',      // primary text on dark bg
        // ── Border ────────────────────────────────────────────
        'border-color': 'rgba(201,168,76,0.18)',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Jost', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 8px 40px rgba(0,0,0,0.55)',
        soft: '0 2px 16px rgba(0,0,0,0.45)',
        gold: '0 4px 20px rgba(201,168,76,0.35)',
      },
      backgroundImage: {
        'crimson-gradient': 'linear-gradient(135deg, #0d0204 0%, #1a0508 50%, #260810 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e2c97e 100%)',
        'cream-gradient': 'linear-gradient(180deg, #0d0204 0%, #1a0508 100%)',
      },
      borderColor: {
        DEFAULT: 'rgba(201,168,76,0.18)',
        brand: 'rgba(201,168,76,0.18)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#ede0d4',
            a: {
              color: '#e2c97e',
              '&:hover': {
                color: '#c9a84c',
              },
            },
            h1: { fontFamily: "'Cormorant Garamond', serif", color: '#e2c97e' },
            h2: { fontFamily: "'Cormorant Garamond', serif", color: '#e2c97e' },
            h3: { fontFamily: "'Cormorant Garamond', serif", color: '#e2c97e' },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
