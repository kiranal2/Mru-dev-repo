/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        muted: '#475569',
        faint: '#94A3B8',
        rule: '#E2E8F0',
        surface: '#FFFFFF',
        'surface-alt': '#F8FAFC',
        'surface-soft': '#F1F5F9',
        brand: '#1E40AF',
        'brand-weak': '#DBEAFE',
        'brand-tint': '#EFF6FF',
        positive: '#16A34A',
        'positive-weak': '#DCFCE7',
        warning: '#D97706',
        'warning-weak': '#FEF3C7',
        negative: '#DC2626',
        'negative-weak': '#FEE2E2',
      },
    },
  },
  plugins: [],
};
