/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        primary: '#31a3fa',
        'primary-bg': '#eaf6ff',
        'header-navy': '#1a254f',
        'bg-body': '#f2f4f6',
        'bg-surface': '#ffffff',
        'bg-input': '#ffffff',
        'bg-search-input': '#ffffff',
        'text-main': '#111111',
        'text-sub': '#475569',
        'text-placeholder': '#94a3b8',
        border: '#e2e8f0',
        'btn-clear-bg': '#f1f5f9',
        'btn-clear-text': '#64748b',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
