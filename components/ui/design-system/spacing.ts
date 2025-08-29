/**
 * INOPNC 디자인 시스템 - 여백/패딩 규칙
 * 일관된 공간 체계를 위한 스페이싱 시스템
 */

// 기본 간격 단위 (rem)
export const spacing = {
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
} as const

// 컴포넌트별 패딩 프리셋
export const padding = {
  // 카드 패딩
  card: {
    normal: 'p-4',     // 16px
    large: 'p-5',      // 20px
    compact: 'p-3'     // 12px
  },
  
  // 버튼 패딩
  button: {
    sm: {
      normal: 'px-4 py-2',      // 16px, 8px
      large: 'px-5 py-2.5'      // 20px, 10px
    },
    md: {
      normal: 'px-6 py-3',      // 24px, 12px
      large: 'px-7 py-3.5'      // 28px, 14px
    },
    lg: {
      normal: 'px-8 py-4',      // 32px, 16px
      large: 'px-10 py-5'       // 40px, 20px
    }
  },
  
  // 리스트 아이템 패딩
  listItem: {
    normal: 'px-4 py-3',        // 16px, 12px
    large: 'px-5 py-4',         // 20px, 16px
    compact: 'px-3 py-2'        // 12px, 8px
  },
  
  // 섹션 패딩
  section: {
    mobile: {
      normal: 'px-4 py-6',      // 16px, 24px
      large: 'px-5 py-8'        // 20px, 32px
    },
    desktop: {
      normal: 'px-8 py-8',      // 32px, 32px
      large: 'px-10 py-10'      // 40px, 40px
    }
  }
} as const

// 마진 프리셋
export const margin = {
  // 섹션 간격
  section: {
    normal: 'my-6',             // 24px
    large: 'my-8',              // 32px
    small: 'my-4'               // 16px
  },
  
  // 요소 간격
  element: {
    normal: 'my-3',             // 12px
    large: 'my-4',              // 16px
    small: 'my-2'               // 8px
  },
  
  // 텍스트 간격
  text: {
    paragraph: 'mb-4',          // 16px
    heading: 'mb-6',            // 24px
    caption: 'mt-1'             // 4px
  }
} as const

// 갭 (Grid/Flex 간격)
export const gap = {
  xs: 'gap-1',                  // 4px
  sm: 'gap-2',                  // 8px
  md: 'gap-3',                  // 12px
  lg: 'gap-4',                  // 16px
  xl: 'gap-6',                  // 24px
  '2xl': 'gap-8'                // 32px
} as const

// 반응형 간격 클래스
export const responsiveSpacing = {
  // 컨테이너 패딩
  container: (isLargeFont: boolean) => 
    isLargeFont ? 'px-5 py-6 md:px-8 md:py-8' : 'px-4 py-4 md:px-6 md:py-6',
  
  // 카드 패딩
  card: (isLargeFont: boolean) => 
    isLargeFont ? 'p-5 md:p-6' : 'p-4 md:p-5',
  
  // 섹션 간격
  sectionGap: (isLargeFont: boolean) => 
    isLargeFont ? 'space-y-5' : 'space-y-4',
  
  // 요소 간격
  elementGap: (isLargeFont: boolean) => 
    isLargeFont ? 'space-y-4' : 'space-y-3',
  
  // 그리드 갭
  gridGap: (isLargeFont: boolean) => 
    isLargeFont ? 'gap-4' : 'gap-3'
} as const

// 높이 프리셋
export const height = {
  // 헤더 높이
  header: {
    normal: 'h-16',             // 64px
    large: 'h-24'               // 96px
  },
  
  // 버튼 높이
  button: {
    sm: {
      normal: 'min-h-[40px]',
      large: 'min-h-[48px]'
    },
    md: {
      normal: 'min-h-[48px]',
      large: 'min-h-[56px]'
    },
    lg: {
      normal: 'min-h-[56px]',
      large: 'min-h-[64px]'
    }
  },
  
  // 입력 필드 높이
  input: {
    normal: 'h-10',             // 40px
    large: 'h-12'               // 48px
  }
} as const

// 유틸리티 함수
export const getSpacing = (value: keyof typeof spacing) => spacing[value]

export const getPadding = (
  component: keyof typeof padding,
  size: string = 'normal',
  isLargeFont: boolean = false
) => {
  const sizeKey = isLargeFont ? 'large' : size
  return (padding[component] as any)[sizeKey] || (padding[component] as any)['normal']
}

// Type exports
export type Spacing = typeof spacing
export type Padding = typeof padding
export type Margin = typeof margin
export type Gap = typeof gap