import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onPress?: () => void
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

export const useLongPress = ({
  onLongPress,
  onPress,
  delay = 800,
}: UseLongPressOptions): LongPressHandlers => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const start = useCallback(() => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handlePress = useCallback(() => {
    // 롱프레스가 아닌 경우에만 일반 클릭 이벤트 실행
    if (!isLongPressRef.current && onPress) {
      onPress()
    }
  }, [onPress])

  return {
    onMouseDown: start,
    onMouseUp: () => {
      clear()
      handlePress()
    },
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: () => {
      clear()
      handlePress()
    },
    onTouchMove: clear, // 터치가 이동하면 롱프레스 취소
  }
}
