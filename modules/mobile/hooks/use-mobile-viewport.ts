import { useEffect, useState, useCallback } from 'react'

/**
 * Mobile viewport optimization hook
 * Based on HTML reference implementation
 */
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const setViewportCSSProperty = useCallback(() => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    setViewportHeight(window.innerHeight)
  }, [])

  const handleViewportChange = useCallback(() => {
    if (!window.visualViewport) return

    const viewport = window.visualViewport
    const height = viewport.height
    const isKeyboard = height < window.innerHeight * 0.75

    setIsKeyboardOpen(isKeyboard)

    // Adjust body height when virtual keyboard is open
    if (isKeyboard) {
      document.body.style.height = `${height}px`
      document.body.style.paddingBottom = `${window.innerHeight - height}px`
    } else {
      document.body.style.height = ''
      document.body.style.paddingBottom = ''
    }

    // Auto-scroll to active input elements
    const activeElement = document.activeElement
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
    ) {
      setTimeout(() => {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        })
      }, 100)
    }
  }, [])

  useEffect(() => {
    // Initialize viewport height
    setViewportCSSProperty()

    // Set up event listeners
    window.addEventListener('resize', setViewportCSSProperty)
    window.addEventListener('orientationchange', setViewportCSSProperty)

    // Visual Viewport API support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      window.visualViewport.addEventListener('scroll', handleViewportChange)
    }

    return () => {
      window.removeEventListener('resize', setViewportCSSProperty)
      window.removeEventListener('orientationchange', setViewportCSSProperty)

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange)
        window.visualViewport.removeEventListener('scroll', handleViewportChange)
      }
    }
  }, [setViewportCSSProperty, handleViewportChange])

  return {
    viewportHeight,
    isKeyboardOpen,
    setViewportCSSProperty,
  }
}

/**
 * Initialize mobile viewport on app startup
 */
export const initMobileViewport = () => {
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  setViewportHeight()
  window.addEventListener('resize', setViewportHeight)
  window.addEventListener('orientationchange', setViewportHeight)

  if (window.visualViewport) {
    function handleViewportChange() {
      const viewport = window.visualViewport
      const height = viewport.height

      if (height < window.innerHeight) {
        document.body.style.height = `${height}px`
        document.body.style.paddingBottom = `${window.innerHeight - height}px`
      } else {
        document.body.style.height = ''
        document.body.style.paddingBottom = ''
      }

      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        setTimeout(() => {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }, 100)
      }
    }

    window.visualViewport.addEventListener('resize', handleViewportChange)
    window.visualViewport.addEventListener('scroll', handleViewportChange)
  }
}

// Type declarations for Visual Viewport API
declare global {
  interface Window {
    visualViewport?: {
      height: number
      width: number
      scale: number
      addEventListener: (event: string, callback: () => void) => void
      removeEventListener: (event: string, callback: () => void) => void
    }
  }
}