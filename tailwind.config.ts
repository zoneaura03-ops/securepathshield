import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { bank: { 50: '#f4f6f8', 100: '#e5e9ee', 200: '#c7d0dc', 300: '#9aa9bb', 500: '#31435a', 600: '#1b2d44', 700: '#102238', 800: '#0d1c30', 900: '#0a1728' }, gold: { 50: '#fffaf0', 100: '#fdf0ca', 300: '#ebcf83', 400: '#d6b45f', 500: '#c49b3b', 600: '#b78a32', 700: '#8c6726' } }, boxShadow: { card: '0 8px 30px rgba(10,23,40,.07)' } } },
  plugins: [],
} satisfies Config
