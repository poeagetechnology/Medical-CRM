/** @type {import('tailwindcss').Config} */

// Semantic colours are CSS variables (see src/styles/index.css) so the whole
// app switches between light and dark theme by toggling the `dark` class.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bdd3ff',
          300: '#90b6fe',
          400: '#5c8ffb',
          500: '#3869f6',
          600: '#224beb',
          700: '#1a39d8',
          800: '#1c31af',
          900: '#1c2f8a',
          950: '#151e54',
        },
        canvas: v('canvas'),
        surface: v('surface'),
        subtle: v('subtle'),
        line: v('line'),
        fg: {
          DEFAULT: v('fg'),
          muted: v('fg-muted'),
          subtle: v('fg-subtle'),
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.05)',
        pop: '0 16px 40px -12px rgb(16 24 40 / 0.25), 0 4px 12px -4px rgb(16 24 40 / 0.08)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
