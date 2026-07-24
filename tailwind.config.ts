import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        engineering: {
          bg: '#0F172A',
          panel: '#111C36',
          border: '#1E3156',
          text: '#D6E2FF',
          muted: '#93A4CB',
          teal: '#14B8A6',
          amber: '#F59E0B'
        }
      },
      boxShadow: {
        panel: '0 10px 30px rgba(2, 6, 23, 0.45)',
        glowTeal: '0 0 0 1px rgba(20, 184, 166, 0.4), 0 0 18px rgba(20, 184, 166, 0.2)',
        glowAmber: '0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.2)'
      },
      borderRadius: {
        panel: '1rem'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 380ms ease-out'
      }
    }
  },
  plugins: []
};

export default config;
