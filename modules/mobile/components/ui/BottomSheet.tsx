'use client'

import React, { useEffect, useRef, useCallback } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  swipeable?: boolean
  backdropClosable?: boolean
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  swipeable = true,
  backdropClosable = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (backdropClosable && e.target === backdropRef.current) {
        onClose()
      }
    },
    [backdropClosable, onClose]
  )

  // Handle swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeable) return
    startY.current = e.touches[0].clientY
    isDragging.current = true
    if (sheetRef.current) {
      sheetRef.current.classList.add('swiping')
    }
  }, [swipeable])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeable || !isDragging.current) return
    
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0 && sheetRef.current) {
      // Only allow downward swipe
      const transform = `translateY(${deltaY}px)`
      sheetRef.current.style.transform = transform
    }
  }, [swipeable])

  const handleTouchEnd = useCallback(() => {
    if (!swipeable || !isDragging.current) return
    
    const deltaY = currentY.current - startY.current
    isDragging.current = false
    
    if (sheetRef.current) {
      sheetRef.current.classList.remove('swiping')
      sheetRef.current.style.transform = ''
      
      // Close if swiped down more than 100px
      if (deltaY > 100) {
        onClose()
      }
    }
  }, [swipeable, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        ref={backdropRef}
        className={`bottom-sheet-backdrop ${isOpen ? 'show' : ''}`}
        onClick={handleBackdropClick}
        role="button"
        tabIndex={-1}
        aria-label="Close bottom sheet"
      />
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'show' : ''} ${swipeable ? 'bottom-sheet-swipeable' : ''} ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {swipeable && (
          <div className="bottom-sheet-handle" onClick={onClose} />
        )}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  )
}