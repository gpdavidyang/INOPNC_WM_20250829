/**
 * INOPNC 디자인 시스템 - 통합 Export
 * 모든 디자인 토큰과 유틸리티를 한 곳에서 관리
 */

// 색상 시스템
export {
  colors,
  colorClasses,
  type ColorPalette,
  type ColorClasses
} from './colors'

// 타이포그래피 시스템
export {
  fontSize,
  fontWeight,
  lineHeight,
  typography,
  getTextSize,
  getTextClass,
  responsiveText,
  type FontSize,
  type Typography,
  type ResponsiveText
} from './typography'

// 스페이싱 시스템
export {
  spacing,
  padding,
  margin,
  gap,
  responsiveSpacing,
  height,
  getSpacing,
  getPadding,
  type Spacing,
  type Padding,
  type Margin,
  type Gap
} from './spacing'

// 컴포넌트 스타일
export {
  cardStyles,
  buttonStyles,
  inputStyles,
  badgeStyles,
  iconButtonStyles,
  listItemStyles,
  dividerStyles,
  overlayStyles,
  getCardClass,
  getButtonClass,
  getInputClass,
  type CardStyles,
  type ButtonStyles,
  type InputStyles,
  type BadgeStyles
} from './components'

// 디자인 시스템 버전
export const DESIGN_SYSTEM_VERSION = '1.0.0'

// 디자인 시스템 메타데이터
export const designSystem = {
  version: DESIGN_SYSTEM_VERSION,
  lastUpdated: '2025-07-31',
  basedOn: 'Mobile Demo Components',
  features: {
    darkMode: true,
    largeFontMode: true,
    responsive: true,
    accessibility: true
  }
} as const

// 통합 유틸리티 함수
export const getResponsiveClass = (
  baseClass: string,
  largeClass: string,
  isLargeFont: boolean
) => {
  return isLargeFont ? largeClass : baseClass
}

// 컴포넌트 프리셋 (자주 사용되는 조합)
export const componentPresets = {
  // 주요 카드
  primaryCard: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm',
  
  // 강조 카드
  accentCard: 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg text-white rounded-lg',
  
  // 주요 버튼
  primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
  
  // 보조 버튼
  secondaryButton: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors duration-200',
  
  // 입력 필드
  inputField: 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200'
} as const

export type ComponentPresets = typeof componentPresets