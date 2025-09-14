/**
 * UI 컴포넌트 Props 타입 정의
 */

import { BaseComponentProps } from './index'

// Button Props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

// Card Props
export interface CardProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  footer?: ReactNode
  hoverable?: boolean
  clickable?: boolean
  selected?: boolean
  bordered?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

// Badge Props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  count?: number
  maxCount?: number
}

// Avatar Props
export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'away' | 'busy'
  fallback?: ReactNode
}

// Alert Props
export interface AlertProps extends BaseComponentProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  closable?: boolean
  onClose?: () => void
  action?: ReactNode
  icon?: ReactNode
}

// Spinner Props
export interface SpinnerProps extends BaseComponentProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  label?: string
}

// Progress Props
export interface ProgressProps extends BaseComponentProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'linear' | 'circular'
}

// Skeleton Props
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: number | string
  height?: number | string
  animation?: 'pulse' | 'wave' | false
  count?: number
}

// Tooltip Props
export interface TooltipProps extends BaseComponentProps {
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  arrow?: boolean
  delay?: number
}

// Chip Props
export interface ChipProps extends BaseComponentProps {
  label: string
  variant?: 'filled' | 'outlined'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  deletable?: boolean
  onDelete?: () => void
  icon?: ReactNode
  onClick?: () => void
}

// Divider Props
export interface DividerProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'solid' | 'dashed' | 'dotted'
  thickness?: number
  color?: string
  spacing?: number | string
}

// Empty State Props
export interface EmptyStateProps extends BaseComponentProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  image?: string
}