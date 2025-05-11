/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
      },
      animation: {
        'carousel-left': 'carousel-left 40s linear infinite',
        'carousel-right': 'carousel-right 40s linear infinite',
      },
      keyframes: {
        'carousel-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'carousel-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' }
        },
      },
      variants: {
        animation: ['responsive', 'hover', 'focus']
      },
    },
  },
  plugins: [
    // Add a custom plugin for pause-animation utility
    function ({ addUtilities }) {
      const newUtilities = {
        '.pause-animation': {
          'animation-play-state': 'paused',
        }
      }
      addUtilities(newUtilities)
    }
  ],
};
