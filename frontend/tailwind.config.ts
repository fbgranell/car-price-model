import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050A14',
        surface: '#0A1628',
        'surface-2': '#0F1E3A',
        primary: '#00D4FF',
        secondary: '#0088FF',
        accent: '#00FF88',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
