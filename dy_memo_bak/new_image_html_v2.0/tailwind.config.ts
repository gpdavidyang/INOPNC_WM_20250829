/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F9FF',
        card: '#FFFFFF',
        ink: '#1A254F',
        line: '#E6ECF4',
        brand: '#1A254F',
        accent: '#0068FE',
        cyan: '#00BCD4',
      },
      borderRadius: {
        '10': '10px',
        '14': '14px',
      },
    },
  },
  darkMode: ['class', '[data-theme="dark"]'],
  plugins: [],
}
