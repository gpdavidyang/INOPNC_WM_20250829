'use client'


interface KeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (e: KeyboardEvent) => void
  onShiftTab?: (e: KeyboardEvent) => void
  enabled?: boolean
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true
  } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault()
          onEscape()
        }
        break
      case 'Enter':
        if (onEnter && !['INPUT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
          e.preventDefault()
          onEnter()
        }
        break
      case 'ArrowUp':
        if (onArrowUp) {
          e.preventDefault()
          onArrowUp()
        }
        break
      case 'ArrowDown':
        if (onArrowDown) {
          e.preventDefault()
          onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (onArrowLeft) {
          e.preventDefault()
          onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (onArrowRight) {
          e.preventDefault()
          onArrowRight()
        }
        break
      case 'Tab':
        if (e.shiftKey && onShiftTab) {
          onShiftTab(e)
        } else if (!e.shiftKey && onTab) {
          onTab(e)
        }
        break
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

// Hook for managing focus within a container
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !containerRef.current || e.key !== 'Tab') return

    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
    
    const focusableArray = Array.from(focusableElements) as HTMLElement[]
    if (focusableArray.length === 0) return

    const firstElement = focusableArray[0]
    const lastElement = focusableArray[focusableArray.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (e.shiftKey && activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }, [containerRef, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  // Focus first element when trap is enabled
  useEffect(() => {
    if (enabled && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )
      
      const firstElement = focusableElements[0] as HTMLElement
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [enabled, containerRef])
}

// Hook for managing roving tabindex in lists
export function useRovingTabIndex(itemCount: number, initialIndex = 0) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => (prev + 1) % itemCount)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev - 1 + itemCount) % itemCount)
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(itemCount - 1)
        break
    }
  }, [itemCount])

  return {
    focusedIndex,
    setFocusedIndex,
    getRovingProps: (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: handleKeyDown,
      onFocus: () => setFocusedIndex(index)
    })
  }
}