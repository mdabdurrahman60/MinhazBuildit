/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0d',
          900: '#14141a',
          800: '#1f1f27',
          700: '#2b2b35',
        },
        scanner: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#b45309',
        },
        paper: {
          DEFAULT: '#f5f1e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'scan-sweep': {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
      animation: {
        'scan-sweep': 'scan-sweep 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
