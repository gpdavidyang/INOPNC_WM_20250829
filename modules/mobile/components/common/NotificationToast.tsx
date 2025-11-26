'use client'

import React, { useEffect, useState } from 'react'

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  showClose?: boolean
}

interface NotificationToastProps extends NotificationOptions {
  isVisible: boolean
  onClose: () => void
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
  duration = 3000,
  showClose = true,
  isVisible,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
      setIsExiting(false)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  if (!isVisible && !isExiting) return null

  return (
    <div className={`notification-toast ${type} ${isExiting ? 'exiting' : 'entering'}`}>
      <div className="notification-content">
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-text">
          {title && <div className="notification-title">{title}</div>}
          <div className="notification-message">{message}</div>
        </div>
        {showClose && (
          <button className="notification-close" onClick={handleClose} aria-label="닫기">
            닫기
          </button>
        )}
      </div>

      <style jsx>{`
        .notification-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          max-width: 400px;
          width: 90%;
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--border-color, #e0e0e0);
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: auto;
        }

        .notification-toast.entering {
          animation: slideIn 0.3s ease forwards;
        }

        .notification-toast.exiting {
          animation: slideOut 0.3s ease forwards;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
        }

        .notification-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 4px;
        }

        .notification-message {
          font-size: 14px;
          color: var(--text-secondary, #666666);
          line-height: 1.4;
          word-break: break-word;
        }

        .notification-close {
          background: none;
          border: 1px solid var(--border-color, #e0e0e0);
          font-size: 13px;
          color: var(--text-secondary, #666666);
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 999px;
          flex-shrink: 0;
          font-weight: 600;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .notification-close:hover {
          background: var(--hover-bg, #f3f4f6);
          color: var(--text-primary, #1a1a1a);
        }

        /* Type-specific styling */
        .notification-toast.success {
          border-left: 4px solid var(--success-color, #10b981);
        }

        .notification-toast.success .notification-title {
          color: var(--success-color, #10b981);
        }

        .notification-toast.error {
          border-left: 4px solid var(--error-color, #ef4444);
        }

        .notification-toast.error .notification-title {
          color: var(--error-color, #ef4444);
        }

        .notification-toast.warning {
          border-left: 4px solid var(--warning-color, #f59e0b);
        }

        .notification-toast.warning .notification-title {
          color: var(--warning-color, #f59e0b);
        }

        .notification-toast.info {
          border-left: 4px solid var(--info-color, #3b82f6);
        }

        .notification-toast.info .notification-title {
          color: var(--info-color, #3b82f6);
        }

        /* Dark theme */
        [data-theme='dark'] .notification-toast {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        [data-theme='dark'] .notification-title {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .notification-message {
          color: var(--text-secondary-dark, #cbd5e1);
        }

        [data-theme='dark'] .notification-close {
          color: var(--text-secondary-dark, #cbd5e1);
        }

        [data-theme='dark'] .notification-close:hover {
          background: var(--hover-bg-dark, #334155);
          color: var(--text-primary-dark, #f1f5f9);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .notification-toast {
            top: 10px;
            max-width: calc(100vw - 20px);
          }

          .notification-content {
            padding: 14px;
          }

          .notification-title {
            font-size: 13px;
          }

          .notification-message {
            font-size: 13px;
          }

          .notification-icon {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}
