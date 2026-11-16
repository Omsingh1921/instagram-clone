/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1264px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--bg-secondary)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: '#ffffff',
          hover: 'var(--color-primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--bg-hover)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-hover)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--bg-hover)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'var(--color-error)',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: '#ffffff',
        },
        border: 'var(--border-subtle)',
        input: 'var(--border-secondary)',
        ring: 'var(--color-primary)',
        ig: {
          like: 'var(--ig-like-color)',
          link: 'var(--text-link)',
          secondaryText: 'var(--text-secondary)',
        }
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        glow: 'var(--glow-primary)',
        'glow-pink': 'var(--glow-pink)',
        subtle: 'var(--glow-subtle)',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heart-pop': 'heartPop 0.45s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        heartPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.25)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

