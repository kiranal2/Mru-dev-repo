/** @type {import('tailwindcss').Config} */
// Colors reference CSS custom properties that are set at runtime via
// NativeWind's `vars()` helper on the root View (see src/theme.tsx).
// This lets the light/dark palette swap instantly without re-rendering
// every `className` and keeps tokens in sync with the web prototype.
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        faint: 'var(--color-faint)',
        rule: 'var(--color-rule)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-soft': 'var(--color-surface-soft)',
        brand: 'var(--color-brand)',
        'brand-weak': 'var(--color-brand-weak)',
        'brand-tint': 'var(--color-brand-tint)',
        'brand-tint-soft': 'var(--color-brand-tint-soft)',
        'brand-accent': 'var(--color-brand-accent)',
        positive: 'var(--color-positive)',
        'positive-weak': 'var(--color-positive-weak)',
        warning: 'var(--color-warning)',
        'warning-weak': 'var(--color-warning-weak)',
        negative: 'var(--color-negative)',
        'negative-weak': 'var(--color-negative-weak)',
        info: 'var(--color-info)',
      },
    },
  },
  plugins: [],
};
