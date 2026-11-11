/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#060709',
          900: '#0c0e12',
          850: '#13161c',
          800: '#1a1e26',
          700: '#262c38',
          600: '#384152',
          cyan: '#38ef7d',
          accent: '#11998e',
          glow: '#00f2fe'
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Songti SC', 'SimSun', 'serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
