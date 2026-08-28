import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { bank: { 50: '#f2f8f4', 100: '#e2f0e7', 500: '#258154', 600: '#176b43', 700: '#105737', 900: '#123b2b' } }, boxShadow: { card: '0 8px 30px rgba(20,55,40,.07)' } } },
  plugins: [],
} satisfies Config
