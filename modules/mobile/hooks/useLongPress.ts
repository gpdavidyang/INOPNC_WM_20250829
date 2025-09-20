import { useCallback, useEffect, useRef } from 'react'

interface UseLongPressOptions<T> {
  onLongPress: (data: T) => void
  onPress?: (data: T) => void
  delay?: number
}

interface LongPressHandlers {
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  onTouchMove: () => void
}

export const useLongPress = <T>({ onLongPress, onPress, delay = 800 }: UseLongPressOptions<T>) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef(false)
  const payloadRef = useRef<T | null>(null)

  const onLongPressRef = useRef(onLongPress)
  const onPressRef = useRef(onPress)

  useEffect(() => {
    onLongPressRef.current = onLongPress
  }, [onLongPress])

  useEffect(() => {
    onPressRef.current = onPress
  }, [onPress])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(
    (data: T) => {
      payloadRef.current = data
      longPressTriggeredRef.current = false
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true
        onLongPressRef.current?.(data)
      }, delay)
    },
    [delay]
  )

  const triggerPress = useCallback(() => {
    if (!longPressTriggeredRef.current && payloadRef.current !== null) {
      onPressRef.current?.(payloadRef.current)
    }
    payloadRef.current = null
  }, [])

  const bind = useCallback(
    (data: T): LongPressHandlers => ({
      onMouseDown: () => startTimer(data),
      onMouseUp: () => {
        clearTimer()
        triggerPress()
      },
      onMouseLeave: () => clearTimer(),
      onTouchStart: () => startTimer(data),
      onTouchEnd: () => {
        clearTimer()
        triggerPress()
      },
      onTouchMove: () => clearTimer(),
    }),
    [clearTimer, startTimer, triggerPress]
  )

  return bind
}
