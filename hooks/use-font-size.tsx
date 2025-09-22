'use client'

import { useState, useEffect } from 'react'

export function useFontSize() {
  const [isLargeFont, setIsLargeFont] = useState(false)

  useEffect(() => {
    // Load font size preference from localStorage
    const stored = localStorage.getItem('fontSize')
    if (stored === 'large') {
      setIsLargeFont(true)
      document.documentElement.classList.add('font-large')
    }
  }, [])

  const toggleFontSize = () => {
    const newSize = !isLargeFont
    setIsLargeFont(newSize)
    
    if (newSize) {
      localStorage.setItem('fontSize', 'large')
      document.documentElement.classList.add('font-large')
    } else {
      localStorage.removeItem('fontSize')
      document.documentElement.classList.remove('font-large')
    }
  }

  return {
    isLargeFont,
    toggleFontSize
  }
}