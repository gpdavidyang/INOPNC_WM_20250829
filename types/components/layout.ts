/**
 * 레이아웃 컴포넌트 Props 타입 정의
 */

import { BaseComponentProps } from './index'

// Container Props
export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  centered?: boolean
  padding?: boolean
}

// Grid Props
export interface GridProps extends BaseComponentProps {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number | string
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

// Flex Props
export interface FlexProps extends BaseComponentProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: number | string
}

// Stack Props
export interface StackProps extends BaseComponentProps {
  spacing?: number | string
  direction?: 'horizontal' | 'vertical'
  divider?: boolean
}

// Sidebar Props
export interface SidebarProps extends BaseComponentProps {
  isOpen: boolean
  onClose?: () => void
  position?: 'left' | 'right'
  width?: number | string
  overlay?: boolean
  persistent?: boolean
}

// Header Props
export interface HeaderProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  sticky?: boolean
  transparent?: boolean
  elevation?: number
}

// Footer Props
export interface FooterProps extends BaseComponentProps {
  sticky?: boolean
  transparent?: boolean
  links?: Array<{
    label: string
    href: string
  }>
}

// Main Layout Props
export interface MainLayoutProps extends BaseComponentProps {
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
  breadcrumbs?: ReactNode
}

// Page Layout Props
export interface PageLayoutProps extends BaseComponentProps {
  title: string
  description?: string
  actions?: ReactNode
  tabs?: ReactNode
  filters?: ReactNode
  loading?: boolean
  error?: string | null
}