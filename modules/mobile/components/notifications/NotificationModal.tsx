'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, FileText, AlertCircle, Calendar } from 'lucide-react'
// Switch to server history API backed by notification_logs

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'document'
  created_at: string
  is_read: boolean
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications/history?limit=10`, { cache: 'no-store' })
      if (!res.ok) throw new Error('history api failed')
      const json = await res.json()
      const items = Array.isArray(json?.notifications) ? json.notifications : []
      const mapped: NotificationItem[] = items.map((n: any) => ({
        id: String(n.id),
        title: n.title || '알림',
        message: n.body || '',
        type: 'info',
        created_at: n.sent_at || n.created_at || new Date().toISOString(),
        is_read: !!n.read_at,
      }))
      setNotifications(mapped)
    } catch (error) {
      console.warn('Failed to fetch notifications:', error)
      setNotifications([
        {
          id: '1',
          title: '시스템 점검 안내',
          message: '오늘 오후 2시부터 3시까지 시스템 점검이 예정되어 있습니다.',
          type: 'info',
          created_at: new Date().toISOString(),
          is_read: false,
        },
        {
          id: '2',
          title: '새로운 문서 도착',
          message: '승인이 필요한 새로운 문서가 도착했습니다.',
          type: 'document',
          created_at: new Date().toISOString(),
          is_read: false,
        },
        {
          id: '3',
          title: '작업 완료',
          message: '금일 예정된 작업이 모두 완료되었습니다.',
          type: 'success',
          created_at: new Date().toISOString(),
          is_read: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'read' }),
      })
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unread.length === 0) return
      await Promise.allSettled(
        unread.map(id =>
          fetch('/api/notifications/history', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id, action: 'read' }),
          })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleClose = () => {
    if (dontShowToday) {
      localStorage.setItem('hideNotifications', new Date().toDateString())
    }
    onClose()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Calendar className="w-5 h-5 text-blue-500" />
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="notification-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="notification-popup">
        <div className="notification-popup-header">
          <h3>알림</h3>
          <button className="notification-popup-close" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="notification-popup-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="loader" />
              <p className="text-sm text-gray-500 mt-2">알림을 불러오는 중...</p>
            </div>
          ) : notifications.length > 0 ? (
            <>
              <div className="notification-list">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read ? 'read' : ''}`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="notification-icon">{getIcon(notification.type)}</div>
                    <div className="notification-text">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-desc">{notification.message}</div>
                    </div>
                  </div>
                ))}
              </div>

              {notifications.some(n => !n.is_read) && (
                <button className="mark-all-read-btn" onClick={markAllAsRead}>
                  모두 읽음으로 표시
                </button>
              )}
            </>
          ) : (
            <div className="empty-notifications">
              <p>새로운 알림이 없습니다.</p>
            </div>
          )}

          <div className="notification-options">
            <label className="notification-checkbox">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={e => setDontShowToday(e.target.checked)}
              />
              <span className="checkmark">
                <svg
                  className={`checkmark-icon ${dontShowToday ? 'checked' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
              </span>
              오늘 하루 보지 않기
            </label>
          </div>
        </div>
      </div>
    </>
  )
}
