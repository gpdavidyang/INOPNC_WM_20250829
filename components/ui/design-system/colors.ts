/**
 * INOPNC 디자인 시스템 - 색상 팔레트
 * 모바일 데모에서 검증된 색상 체계
 */

export const colors = {
  // Primary Colors - 파란색 계열 (브랜드 컬러)
  primary: {
    50: '#EFF6FF',   // 매우 연한 파란색
    100: '#DBEAFE',  // 연한 파란색
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // 기본 파란색
    600: '#2563EB',  // 진한 파란색 (주 사용)
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554'   // 매우 진한 파란색
  },

  // Grayscale - 회색 계열
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712'   // 다크모드 배경
  },

  // Semantic Colors - 의미별 색상
  semantic: {
    // 성공/확인
    success: {
      light: '#10B981',  // green-500
      dark: '#059669',   // green-600
      bg: '#D1FAE5',     // green-100
      bgDark: '#065F46'  // green-900/30
    },
    
    // 경고/주의
    warning: {
      light: '#F59E0B',  // amber-500
      dark: '#D97706',   // amber-600
      bg: '#FEF3C7',     // amber-100
      bgDark: '#78350F'  // amber-900/30
    },
    
    // 오류/위험
    error: {
      light: '#EF4444',  // red-500
      dark: '#DC2626',   // red-600
      bg: '#FEE2E2',     // red-100
      bgDark: '#7F1D1D'  // red-900/30
    },
    
    // 정보
    info: {
      light: '#3B82F6',  // blue-500
      dark: '#2563EB',   // blue-600
      bg: '#DBEAFE',     // blue-100
      bgDark: '#1E3A8A'  // blue-900/30
    }
  },

  // Background Colors - 배경색
  background: {
    // 라이트 모드
    light: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6',  // gray-100
      tertiary: '#E5E7EB',   // gray-200
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    // 다크 모드
    dark: {
      primary: '#030712',    // gray-950
      secondary: '#111827',  // gray-900
      tertiary: '#1F2937',   // gray-800
      elevated: '#374151',   // gray-700
      overlay: 'rgba(0, 0, 0, 0.7)'
    }
  },

  // Text Colors - 텍스트 색상
  text: {
    // 라이트 모드
    light: {
      primary: '#111827',    // gray-900
      secondary: '#4B5563',  // gray-600
      tertiary: '#6B7280',   // gray-500
      disabled: '#9CA3AF',   // gray-400
      inverse: '#FFFFFF'
    },
    // 다크 모드
    dark: {
      primary: '#FFFFFF',
      secondary: '#E5E7EB',  // gray-200
      tertiary: '#D1D5DB',   // gray-300
      disabled: '#6B7280',   // gray-500
      inverse: '#111827'     // gray-900
    }
  },

  // Border Colors - 테두리 색상
  border: {
    light: {
      default: '#E5E7EB',    // gray-200
      hover: '#D1D5DB',      // gray-300
      focus: '#3B82F6',      // blue-500
      error: '#EF4444'       // red-500
    },
    dark: {
      default: '#374151',    // gray-700
      hover: '#4B5563',      // gray-600
      focus: '#2563EB',      // blue-600
      error: '#DC2626'       // red-600
    }
  }
} as const

// Tailwind 클래스명 매핑
export const colorClasses = {
  primary: {
    bg: 'bg-blue-600 dark:bg-blue-500',
    hover: 'hover:bg-blue-700 dark:hover:bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-600 dark:border-blue-500'
  },
  
  card: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:shadow-md dark:hover:bg-gray-750'
  },
  
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
  }
} as const

// Type exports
export type ColorPalette = typeof colors
export type ColorClasses = typeof colorClasses