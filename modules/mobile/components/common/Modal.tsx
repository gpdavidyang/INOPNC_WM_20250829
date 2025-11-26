'use client'

import React, { useEffect, useRef } from 'react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden'

      // 첫 번째 포커스 가능한 요소에 포커스
      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements && focusableElements.length > 0) {
        ;(focusableElements[0] as HTMLElement).focus()
      }
    } else {
      // 모달 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      className={`modal-backdrop ${isOpen ? 'modal-backdrop-open' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={contentRef}
        className={`modal-content modal-content-${size} ${isOpen ? 'modal-content-open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h3 id="modal-title" className="modal-title">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="modal-close-button"
                onClick={onClose}
                aria-label="모달 닫기"
              >
                닫기
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
