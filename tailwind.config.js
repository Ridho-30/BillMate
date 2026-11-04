/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#9AD72B',
          hover: '#86C21F',
          soft: '#D6F0A2',
          tint: '#EEF8D3',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#4B5240',
        },
        dark: {
          DEFAULT: '#161A0E',
          card: '#232A16',
          text: '#E6EBD9',
        },
        line: '#E3E7DA',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

