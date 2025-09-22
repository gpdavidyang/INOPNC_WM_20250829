'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  NotificationToast,
  NotificationOptions,
} from '@/modules/mobile/components/common/NotificationToast'

interface NotificationItem extends NotificationOptions {
  id: string
}

interface NotificationContextType {
  notifications: NotificationItem[]
  showNotification: (options: NotificationOptions) => string
  hideNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
  maxNotifications?: number
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 3,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = useCallback(
    (options: NotificationOptions): string => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newNotification: NotificationItem = {
        ...options,
        id,
      }

      setNotifications(prev => {
        const updated = [newNotification, ...prev]
        // 최대 개수 제한
        return updated.slice(0, maxNotifications)
      })

      return id
    },
    [maxNotifications]
  )

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* 알림 토스트 렌더링 */}
      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="notification-wrapper"
            style={{
              position: 'fixed',
              top: `${20 + index * 80}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999 + index,
            }}
          >
            <NotificationToast
              {...notification}
              isVisible={true}
              onClose={() => hideNotification(notification.id)}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .notification-container {
          pointer-events: none;
        }

        .notification-wrapper {
          pointer-events: auto;
        }
      `}</style>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }

  return context
}

// 편의 함수들
export const useNotificationHelpers = () => {
  const { showNotification } = useNotification()

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showNotification({
        type: 'success',
        title,
        message,
        duration,
      })
    },
    [showNotification]
  )

  const showError = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showNotification({
        type: 'error',
        title,
        message,
        duration: duration || 5000, // 에러는 더 오래 표시
      })
    },
    [showNotification]
  )

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showNotification({
        type: 'warning',
        title,
        message,
        duration,
      })
    },
    [showNotification]
  )

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showNotification({
        type: 'info',
        title,
        message,
        duration,
      })
    },
    [showNotification]
  )

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
