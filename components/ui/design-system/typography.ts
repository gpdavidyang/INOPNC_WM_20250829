/**
 * INOPNC 디자인 시스템 - 타이포그래피
 * 큰글씨 모드를 고려한 반응형 폰트 시스템
 */

// 기본 폰트 크기 (rem 단위)
export const fontSize = {
  // 기본 모드
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  
  // 큰글씨 모드 (1.5배)
  large: {
    xs: '1.125rem',    // 18px
    sm: '1.25rem',     // 20px
    base: '1.5rem',    // 24px
    lg: '1.875rem',    // 30px
    xl: '2.25rem',     // 36px
    '2xl': '3rem',     // 48px
    '3xl': '3.75rem',  // 60px
    '4xl': '4.5rem'    // 72px
  }
} as const

// 폰트 굵기
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
} as const

// 줄 높이
export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
  loose: '2'
} as const

// 타이포그래피 프리셋
export const typography = {
  // 제목
  heading: {
    h1: {
      normal: 'text-3xl font-bold leading-tight',
      large: 'text-4xl font-bold leading-tight'
    },
    h2: {
      normal: 'text-2xl font-bold leading-tight',
      large: 'text-3xl font-bold leading-tight'
    },
    h3: {
      normal: 'text-xl font-semibold leading-normal',
      large: 'text-2xl font-semibold leading-normal'
    },
    h4: {
      normal: 'text-lg font-semibold leading-normal',
      large: 'text-xl font-semibold leading-normal'
    }
  },
  
  // 본문
  body: {
    large: {
      normal: 'text-base font-normal leading-relaxed',
      large: 'text-lg font-normal leading-relaxed'
    },
    base: {
      normal: 'text-sm font-normal leading-normal',
      large: 'text-base font-normal leading-normal'
    },
    small: {
      normal: 'text-xs font-normal leading-normal',
      large: 'text-sm font-normal leading-normal'
    }
  },
  
  // 버튼 텍스트
  button: {
    large: {
      normal: 'text-base font-medium',
      large: 'text-lg font-medium'
    },
    medium: {
      normal: 'text-sm font-medium',
      large: 'text-base font-medium'
    },
    small: {
      normal: 'text-xs font-medium',
      large: 'text-sm font-medium'
    }
  },
  
  // 라벨
  label: {
    normal: 'text-sm font-medium',
    large: 'text-base font-medium'
  },
  
  // 캡션
  caption: {
    normal: 'text-xs font-normal text-gray-600 dark:text-gray-400',
    large: 'text-sm font-normal text-gray-600 dark:text-gray-400'
  }
} as const

// 폰트 크기 유틸리티 함수
export const getTextSize = (size: keyof typeof fontSize, isLargeFont: boolean = false) => {
  return isLargeFont ? (fontSize as unknown).large[size] : fontSize[size]
}

// Tailwind 클래스 유틸리티 함수
export const getTextClass = (
  preset: keyof typeof typography.body | keyof typeof typography.heading,
  isLargeFont: boolean = false
) => {
  const category = preset.startsWith('h') ? 'heading' : 'body'
  return (typography as unknown)[category][preset][isLargeFont ? 'large' : 'normal']
}

// 반응형 텍스트 클래스
export const responsiveText = {
  title: (isLargeFont: boolean) => 
    isLargeFont ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
  
  subtitle: (isLargeFont: boolean) => 
    isLargeFont ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl',
  
  body: (isLargeFont: boolean) => 
    isLargeFont ? 'text-lg' : 'text-base',
  
  small: (isLargeFont: boolean) => 
    isLargeFont ? 'text-base' : 'text-sm',
  
  caption: (isLargeFont: boolean) => 
    isLargeFont ? 'text-sm' : 'text-xs'
} as const

// Type exports
export type FontSize = typeof fontSize
export type Typography = typeof typography
export type ResponsiveText = typeof responsiveText