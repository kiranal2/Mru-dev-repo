/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        rule: 'var(--rule)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'surface-soft': 'var(--surface-soft)',
        brand: 'var(--primary)',
        'brand-weak': 'var(--primary-weak)',
        'brand-tint': 'var(--primary-tint)',
        positive: 'var(--positive)',
        'positive-weak': 'var(--positive-weak)',
        warning: 'var(--warning)',
        'warning-weak': 'var(--warning-weak)',
        negative: 'var(--negative)',
        'negative-weak': 'var(--negative-weak)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        e1: '0 1px 2px rgba(15,23,42,0.04)',
        e2: '0 4px 12px rgba(15,23,42,0.08)',
        e3: '0 12px 32px rgba(15,23,42,0.15)',
      },
      keyframes: {
        'slide-in': { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        'fade-up': { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulse2: { '0%,100%': { opacity: '0.6', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.03)' } },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        pulse2: 'pulse2 1.5s infinite',
      },
    },
  },
  plugins: [],
};
