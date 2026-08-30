import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { bank: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#0a1728' }, gold: { 50: '#fffaf0', 100: '#fdf0ca', 300: '#ebcf83', 400: '#d6b45f', 500: '#c49b3b', 600: '#b78a32', 700: '#8c6726' } }, boxShadow: { card: '0 8px 30px rgba(10,23,40,.07)' } } },
  plugins: [],
} satisfies Config
