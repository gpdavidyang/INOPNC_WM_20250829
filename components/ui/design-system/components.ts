/**
 * INOPNC 디자인 시스템 - 컴포넌트 스타일
 * 재사용 가능한 컴포넌트 스타일 정의
 */


// 카드 스타일
export const cardStyles = {
  base: 'rounded-lg transition-all duration-200',
  
  variant: {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg',
    gradient: 'bg-gradient-to-r border-0 shadow-lg text-white',
    ghost: 'bg-transparent border-0'
  },
  
  padding: {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6'
  },
  
  // 큰글씨 모드 대응
  responsive: (isLargeFont: boolean) => ({
    padding: isLargeFont ? 'p-5' : 'p-4',
    gap: isLargeFont ? 'space-y-4' : 'space-y-3'
  })
} as const

// 버튼 스타일
export const buttonStyles = {
  base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  variant: {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-500',
    outline: 'border-2 bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-md hover:shadow-lg'
  },
  
  size: {
    sm: {
      normal: 'px-4 py-2 text-sm min-h-[40px]',
      large: 'px-5 py-2.5 text-base min-h-[48px]'
    },
    md: {
      normal: 'px-6 py-3 text-base min-h-[48px]',
      large: 'px-7 py-3.5 text-lg min-h-[56px]'
    },
    lg: {
      normal: 'px-8 py-4 text-lg min-h-[56px]',
      large: 'px-10 py-5 text-xl min-h-[64px]'
    },
    full: {
      normal: 'w-full px-6 py-3 text-base min-h-[50px]',
      large: 'w-full px-7 py-4 text-lg min-h-[60px]'
    }
  }
} as const

// 입력 필드 스타일
export const inputStyles = {
  base: 'w-full rounded-lg border bg-transparent transition-colors duration-200 focus:outline-none focus:ring-2',
  
  variant: {
    default: 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20',
    error: 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
  },
  
  size: {
    normal: 'px-4 py-2 text-sm h-10',
    large: 'px-5 py-3 text-base h-12'
  }
} as const

// 배지 스타일
export const badgeStyles = {
  base: 'inline-flex items-center font-medium rounded-full',
  
  variant: {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  },
  
  size: {
    sm: {
      normal: 'px-2 py-0.5 text-xs',
      large: 'px-2.5 py-1 text-sm'
    },
    md: {
      normal: 'px-2.5 py-1 text-xs',
      large: 'px-3 py-1.5 text-sm'
    },
    lg: {
      normal: 'px-3 py-1.5 text-sm',
      large: 'px-4 py-2 text-base'
    }
  }
} as const

// 아이콘 버튼 스타일
export const iconButtonStyles = {
  base: 'inline-flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  variant: {
    default: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    primary: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
  },
  
  size: {
    sm: {
      normal: 'p-1.5',
      large: 'p-2'
    },
    md: {
      normal: 'p-2',
      large: 'p-2.5'
    },
    lg: {
      normal: 'p-2.5',
      large: 'p-3'
    }
  }
} as const

// 리스트 아이템 스타일
export const listItemStyles = {
  base: 'transition-colors duration-200 rounded-lg',
  
  variant: {
    default: 'hover:bg-gray-50 dark:hover:bg-gray-900/50',
    clickable: 'hover:bg-gray-100 dark:hover:bg-gray-900/70 cursor-pointer',
    selected: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
  },
  
  padding: {
    normal: 'p-3',
    large: 'p-4'
  }
} as const

// 구분선 스타일
export const dividerStyles = {
  horizontal: 'border-t border-gray-200 dark:border-gray-700',
  vertical: 'border-l border-gray-200 dark:border-gray-700',
  
  spacing: {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6'
  }
} as const

// 오버레이 스타일
export const overlayStyles = {
  base: 'fixed inset-0 z-40 transition-opacity duration-300',
  
  variant: {
    default: 'bg-black/50',
    dark: 'bg-black/70',
    blur: 'bg-black/30 backdrop-blur-sm'
  }
} as const

// 유틸리티 함수들
export const getCardClass = (
  variant: keyof typeof cardStyles.variant = 'default',
  padding: keyof typeof cardStyles.padding = 'md',
  className?: string
) => {
  return cn(
    cardStyles.base,
    cardStyles.variant[variant],
    cardStyles.padding[padding],
    className
  )
}

export const getButtonClass = (
  variant: keyof typeof buttonStyles.variant = 'primary',
  size: keyof typeof buttonStyles.size = 'md',
  isLargeFont: boolean = false,
  className?: string
) => {
  return cn(
    buttonStyles.base,
    buttonStyles.variant[variant],
    buttonStyles.size[size][isLargeFont ? 'large' : 'normal'],
    className
  )
}

export const getInputClass = (
  variant: keyof typeof inputStyles.variant = 'default',
  isLargeFont: boolean = false,
  className?: string
) => {
  return cn(
    inputStyles.base,
    inputStyles.variant[variant],
    inputStyles.size[isLargeFont ? 'large' : 'normal'],
    className
  )
}

// Type exports
export type CardStyles = typeof cardStyles
export type ButtonStyles = typeof buttonStyles
export type InputStyles = typeof inputStyles
export type BadgeStyles = typeof badgeStyles