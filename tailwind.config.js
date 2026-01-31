/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          primary: '#6366f1',
          'primary-10': '#6366f11a',
        },
        app: {
          bg: '#09090b',
        },
        panel: {
          bg: '#18181b',
          'bg-50': '#18181b80',
        },
        status: {
          success: '#10b981',
          error: '#f43f5e',
          warning: '#f59e0b',
        },
        border: {
          subtle: '#ffffff1a',
          active: '#ffffff33',
        },
        white: {
          DEFAULT: '#ffffff',
          5: '#ffffff0d',
          10: '#ffffff1a',
        },
        zinc: {
          700: '#3f3f46',
        },
      },
      textColor: {
        primary: '#f4f4f5',
        secondary: '#a1a1aa',
        muted: '#52525b',
      },
      fontFamily: {
        ui: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(calc(100% + var(--viewport-padding)))' },
          to: { transform: 'translateX(0)' },
        },
        hide: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        swipeOut: {
          from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
          to: { transform: 'translateX(calc(100% + var(--viewport-padding)))' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        contentShow: {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
      animation: {
        slideIn: 'slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        hide: 'hide 100ms ease-in',
        swipeOut: 'swipeOut 100ms ease-out',
        fadeIn: 'fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        contentShow: 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
