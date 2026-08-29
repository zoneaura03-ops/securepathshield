import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { bank: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#10233f' } }, boxShadow: { card: '0 8px 30px rgba(16,35,63,.07)' } } },
  plugins: [],
} satisfies Config
