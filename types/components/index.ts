/**
 * 컴포넌트 Props 타입 정의
 */


// 기본 컴포넌트 Props
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
  id?: string
  testId?: string
}

// 확장 가능한 HTML 요소 Props
export interface ExtendableHTMLProps<T = HTMLDivElement> 
  extends HTMLAttributes<T>, BaseComponentProps {}

// 레이아웃 관련 Props
export * from './layout'

// UI 컴포넌트 Props
export * from './ui'

// 폼 관련 Props
export * from './forms'

// 데이터 디스플레이 Props
export * from './data-display'

// 차트 관련 Props
export * from './charts'

// 모달/다이얼로그 Props
export * from './modals'

// 내비게이션 Props
export * from './navigation'

// 페이지 컴포넌트 Props
export * from './pages'