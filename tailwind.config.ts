import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { bank: { 50: '#f5f7fb', 100: '#e7ebf3', 500: '#31466f', 600: '#17233f', 700: '#111b32', 900: '#080e1b' } }, boxShadow: { card: '0 8px 30px rgba(23,35,63,.07)' } } },
  plugins: [],
} satisfies Config
