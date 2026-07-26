import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        engineering: {
          bg: '#EDF1F6',
          panel: '#F8FAFC',
          border: '#D5DEEA',
          text: '#0F172A',
          muted: '#55637F',
          teal: '#14B8A6',
          amber: '#F59E0B'
        }
      },
      boxShadow: {
        panel: '0 14px 30px rgba(15, 23, 42, 0.12)',
        glowTeal: '0 0 0 1px rgba(20, 184, 166, 0.3), 0 0 16px rgba(20, 184, 166, 0.12)',
        glowAmber: '0 0 0 1px rgba(245, 158, 11, 0.28), 0 0 16px rgba(245, 158, 11, 0.12)'
      },
      borderRadius: {
        panel: '1rem'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(100, 116, 139, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 116, 139, 0.14) 1px, transparent 1px)'
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
