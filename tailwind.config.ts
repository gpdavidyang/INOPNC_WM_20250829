import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // INOPNC 디자인 시스템 색상 팔레트
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        // UI Guidelines 준수: Toss 디자인 시스템 색상
        'toss-blue': {
          DEFAULT: '#3182F6',
          50: '#eff9ff',
          100: '#dff0ff',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3182F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1e40af',
          900: '#001a4d'
        },
        'toss-gray': {
          DEFAULT: '#374151',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        },
        // Enhanced Layout Structure Colors (High Contrast Version)
        layout: {
          'main-bg': '#F1F5F9',        // Main container background (darker slate-100)
          'section-bg': '#FFFFFF',     // Section/card backgrounds (pure white)
          'elevated': '#FEFEFE',       // Elevated surfaces (off-white)
          'divider-subtle': '#D1D5DB', // Subtle dividers (stronger gray-300)
          'divider-prominent': '#9CA3AF', // Prominent dividers (gray-400)
          'section-border': '#E5E7EB', // Section borders (gray-200)
          'section-shadow': 'rgba(0, 0, 0, 0.08)', // Section shadow color
          'elevated-shadow': 'rgba(0, 0, 0, 0.12)' // Elevated shadow color
        },
        // Dark mode layout colors (Enhanced Contrast)
        'layout-dark': {
          'main-bg': '#0F172A',        // Dark main background (slate-900)
          'section-bg': '#1E293B',     // Dark section backgrounds (slate-800)
          'elevated': '#334155',       // Dark elevated surfaces (slate-700)
          'divider-subtle': '#475569', // Dark subtle dividers (slate-600)
          'divider-prominent': '#64748B', // Dark prominent dividers (slate-500)
          'section-border': '#374151', // Dark section borders (gray-700)
          'section-shadow': 'rgba(0, 0, 0, 0.25)', // Dark section shadow
          'elevated-shadow': 'rgba(0, 0, 0, 0.35)' // Dark elevated shadow
        }
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Roboto',
          'Noto Sans KR',
          'Segoe UI',
          'Malgun Gothic',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'sans-serif'
        ]
      },
      fontSize: {
        // INOPNC 디자인 시스템 타이포그래피 - 더 큰 폰트 크기로 조정
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px (기존 13px에서 증가)
        'sm': ['1rem', { lineHeight: '1.5rem' }],        // 16px (기존 15px에서 증가)
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px (기존 17px에서 증가)
        'lg': ['1.25rem', { lineHeight: '2rem' }],       // 20px (기존 19px에서 증가)
        'xl': ['1.375rem', { lineHeight: '2rem' }],      // 22px (기존 21px에서 증가)
        '2xl': ['1.625rem', { lineHeight: '2.25rem' }],  // 26px (기존 25px에서 증가)
        '3xl': ['2rem', { lineHeight: '2.5rem' }],       // 32px (기존 31px에서 증가)
        '4xl': ['2.375rem', { lineHeight: '2.75rem' }],  // 38px (기존 37px에서 증가)
        '5xl': ['3.25rem', { lineHeight: '1' }],         // 52px (기존 50px에서 증가)
        '6xl': ['4rem', { lineHeight: '1' }]             // 64px (기존 62px에서 증가)
      },
      spacing: {
        // INOPNC 디자인 시스템 스페이싱 확장
        '0': '0px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px'
      },
      borderRadius: {
        'sm': '0.25rem',    // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        '3xl': '1.5rem'     // 24px
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'button': '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      animation: {
        // 기존 애니메이션 유지
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        // INOPNC 디자인 시스템 애니메이션 추가
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        // Quantum Holographic Effects (Iteration 9)
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'shimmer-slow': 'shimmer 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'quantum-field': 'quantumField 4s ease-in-out infinite',
        'holographic-shift': 'holographicShift 6s ease-in-out infinite'
      },
      keyframes: {
        // 기존 키프레임 유지
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // INOPNC 디자인 시스템 키프레임 추가
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        // Quantum Holographic Effects Keyframes (Iteration 9)
        shimmer: {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '50%': {
            transform: 'translateX(0%)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'translateX(100%)',
            opacity: '0'
          }
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(59,130,246,0.3)',
            opacity: '0.7'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(59,130,246,0.6), 0 0 30px rgba(147,51,234,0.4)',
            opacity: '1'
          }
        },
        quantumField: {
          '0%': { 
            backgroundPosition: '0% 50%',
            opacity: '0.3'
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            opacity: '0.6'
          },
          '100%': { 
            backgroundPosition: '0% 50%',
            opacity: '0.3'
          }
        },
        holographicShift: {
          '0%': { 
            filter: 'hue-rotate(0deg) saturate(100%)',
            transform: 'translateX(0px)'
          },
          '25%': { 
            filter: 'hue-rotate(90deg) saturate(120%)',
            transform: 'translateX(1px)'
          },
          '50%': { 
            filter: 'hue-rotate(180deg) saturate(110%)',
            transform: 'translateX(0px)'
          },
          '75%': { 
            filter: 'hue-rotate(270deg) saturate(120%)',
            transform: 'translateX(-1px)'
          },
          '100%': { 
            filter: 'hue-rotate(360deg) saturate(100%)',
            transform: 'translateX(0px)'
          }
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // INOPNC 그라데이션 추가
        "gradient-primary": "linear-gradient(135deg, var(--tw-gradient-stops))",
        "gradient-card": "linear-gradient(to right, var(--tw-gradient-stops))"
      },
      backdropBlur: {
        'xs': '2px'
      },
      transitionDuration: {
        '400': '400ms'
      }
    },
  },
  plugins: [],
};
export default config;