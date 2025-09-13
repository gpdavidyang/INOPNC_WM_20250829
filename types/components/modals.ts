/**
 * 모달/다이얼로그 컴포넌트 Props 타입 정의
 */

import { ReactNode } from 'react'
import { BaseComponentProps } from './index'

// Modal Props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
  centered?: boolean
  scrollable?: boolean
  animation?: 'fade' | 'slide' | 'zoom' | 'none'
  zIndex?: number
}

// Dialog Props (Confirmation)
export interface DialogProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm'
  confirmButtonVariant?: 'primary' | 'danger' | 'success'
  loading?: boolean
}

// Drawer Props
export interface DrawerProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  placement?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
  overlay?: boolean
  push?: boolean
}

// Popover Props
export interface PopoverProps extends BaseComponentProps {
  content: ReactNode
  trigger: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  triggerType?: 'click' | 'hover' | 'focus' | 'manual'
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  arrow?: boolean
  offset?: number
  delay?: number | { open?: number; close?: number }
}

// Sheet Props (Bottom Sheet for Mobile)
export interface SheetProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  snapPoints?: number[]
  defaultSnapPoint?: number
  closeOnOverlayClick?: boolean
  showHandle?: boolean
  footer?: ReactNode
  scrollable?: boolean
}

// Toast/Notification Props
export interface ToastProps extends BaseComponentProps {
  id?: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number | null
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  closable?: boolean
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
}

// Lightbox Props
export interface LightboxProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  images: Array<{
    src: string
    alt?: string
    caption?: string
  }>
  currentIndex?: number
  onIndexChange?: (index: number) => void
  showThumbnails?: boolean
  showCaption?: boolean
  showNav?: boolean
  showFullscreen?: boolean
  showDownload?: boolean
}

// Command Palette Props
export interface CommandPaletteProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  commands: Array<{
    id: string
    label: string
    description?: string
    icon?: ReactNode
    shortcut?: string
    category?: string
    action: () => void
  }>
  placeholder?: string
  emptyState?: ReactNode
  onSearch?: (query: string) => void
  recent?: string[]
}