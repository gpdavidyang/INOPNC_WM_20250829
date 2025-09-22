'use client'

import { useState, useEffect } from 'react'

export function useTouchMode() {
  const [touchMode, setTouchMode] = useState(false)

  useEffect(() => {
    // Load touch mode preference from localStorage
    const stored = localStorage.getItem('touchMode')
    if (stored === 'true') {
      setTouchMode(true)
      document.documentElement.classList.add('touch-mode')
    }

    // Auto-detect touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (hasTouch && !stored) {
      // If device has touch and no preference stored, enable touch mode
      setTouchMode(true)
      document.documentElement.classList.add('touch-mode')
    }
  }, [])

  const toggleTouchMode = () => {
    const newMode = !touchMode
    setTouchMode(newMode)
    
    if (newMode) {
      localStorage.setItem('touchMode', 'true')
      document.documentElement.classList.add('touch-mode')
    } else {
      localStorage.removeItem('touchMode')
      document.documentElement.classList.remove('touch-mode')
    }
  }

  return {
    touchMode,
    toggleTouchMode
  }
}