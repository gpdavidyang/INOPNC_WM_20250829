'use client'

import {
  clearNotificationSuppression,
  isNotificationHiddenToday,
  suppressNotificationsForToday,
} from '@/modules/mobile/lib/notification-preferences'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  DollarSign,
  FileText,
  Megaphone,
  Package,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
// Switch to server history API backed by notification_logs

interface NotificationItem {
  id: string
  title: string
  message: string
  type:
    | 'announcement'
    | 'safety'
    | 'materials'
    | 'schedule'
    | 'document'
    | 'general'
    | 'success'
    | 'warning'
    | 'payroll'
  created_at: string
  is_read: boolean
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

const ICON_MAP: Record<NotificationItem['type'], LucideIcon> = {
  announcement: Megaphone,
  safety: ShieldAlert,
  materials: Package,
  schedule: CalendarClock,
  document: FileText,
  success: CheckCircle,
  warning: AlertCircle,
  payroll: DollarSign,
  general: ClipboardList,
}

const TYPE_LABELS: Record<NotificationItem['type'], string> = {
  announcement: '공지',
  safety: '안전',
  materials: '자재',
  schedule: '일정',
  document: '문서',
  success: '완료',
  warning: '주의',
  payroll: '급여',
  general: '알림',
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const PAGE_SIZE = 10
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      setDontShowToday(isNotificationHiddenToday())
      // User explicitly opened the modal, so we should show it even if "don't show today" is set.
      // The preference is mainly for auto-popup scenarios (if any).
      setPage(1)
      setHasMore(true)
      void fetchNotifications(1, false)
    } else if (!isOpen) {
      setSelectedNotification(null)
    }
  }, [isOpen, userId])

  useEffect(() => {
    if (!selectedNotification) return
    const latest = notifications.find(n => n.id === selectedNotification.id)
    if (!latest) {
      setSelectedNotification(null)
      return
    }
    if (latest !== selectedNotification) {
      setSelectedNotification(latest)
    }
  }, [notifications, selectedNotification])

  const resolveNotificationType = (
    rawType?: string,
    fallbackTitle?: string
  ): NotificationItem['type'] => {
    const type = (rawType || '').toLowerCase()
    if (type.includes('safety') || type.includes('alert')) return 'safety'
    if (type.includes('material')) return 'materials'
    if (type.includes('report') || type.includes('schedule')) return 'schedule'
    if (type.includes('document') || type.includes('doc')) return 'document'
    if (type.includes('announcement') || type.includes('notice') || type.includes('site'))
      return 'announcement'
    if (type.includes('payroll') || type.includes('salary')) return 'payroll'
    if (type.includes('success')) return 'success'
    if (type.includes('warning') || type.includes('urgent')) return 'warning'
    if ((fallbackTitle || '').includes('급여')) return 'payroll'
    if ((fallbackTitle || '').includes('공지')) return 'announcement'
    return 'general'
  }

  const fetchNotifications = async (targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const res = await fetch(`/api/notifications/history?limit=${PAGE_SIZE}&page=${targetPage}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('history api failed')
      const json = await res.json()
      const items = Array.isArray(json?.notifications) ? json.notifications : []
      const mapped: NotificationItem[] = items.map((n: any) => {
        const title = n.title || '알림'
        const type = resolveNotificationType(String(n.notification_type || n.type || ''), title)
        return {
          id: String(n.id),
          title,
          message: n.body || '',
          type,
          created_at: n.sent_at || n.created_at || new Date().toISOString(),
          is_read: !!n.read_at,
        }
      })
      if (append) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id))
          const appended = mapped.filter(n => !existingIds.has(n.id))
          return [...prev, ...appended]
        })
      } else {
        setNotifications(mapped)
      }
      const totalPages = Number(json?.pagination?.totalPages || 0)
      if (totalPages > 0) {
        setHasMore(targetPage < totalPages)
      } else {
        setHasMore(mapped.length === PAGE_SIZE)
      }
      setPage(targetPage)
    } catch (error) {
      console.warn('Failed to fetch notifications:', error)
      setNotifications([
        {
          id: '1',
          title: '시스템 점검 안내',
          message: '오늘 오후 2시부터 3시까지 시스템 점검이 예정되어 있습니다.',
          type: 'announcement',
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
      setHasMore(false)
      setPage(1)
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
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
    setSelectedNotification(null)
    if (dontShowToday) {
      suppressNotificationsForToday()
    } else {
      clearNotificationSuppression()
    }
    onClose()
  }

  const getIcon = (type: NotificationItem['type']) => {
    const IconComponent = ICON_MAP[type] ?? ClipboardList
    return <IconComponent className="w-5 h-5" aria-hidden="true" />
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification)
    if (!notification.is_read) {
      void markAsRead(notification.id)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    void fetchNotifications(page + 1, true)
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
          <button className="notification-popup-close" onClick={handleClose} aria-label="닫기">
            닫기
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
                    data-type={notification.type}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon" data-type={notification.type}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-text">
                      <div className="notification-text-header">
                        <span
                          className="notification-type-badge"
                          data-type={notification.type}
                          aria-label={`${TYPE_LABELS[notification.type]} 유형`}
                        >
                          {TYPE_LABELS[notification.type]}
                        </span>
                        <div className="notification-title">{notification.title}</div>
                      </div>
                      <div className="notification-desc">{notification.message}</div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <button
                  className="notification-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? '불러오는 중…' : '더보기'}
                </button>
              )}

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

          {selectedNotification && (
            <div className="notification-detail">
              <div className="notification-detail-header">
                <div>
                  <p className="notification-detail-label">선택한 알림</p>
                  <h4 className="notification-detail-title">{selectedNotification.title}</h4>
                </div>
                <button
                  type="button"
                  className="notification-detail-close"
                  onClick={() => setSelectedNotification(null)}
                >
                  닫기
                </button>
              </div>
              <div className="notification-detail-meta">
                <span>{new Date(selectedNotification.created_at).toLocaleString('ko-KR')}</span>
                {selectedNotification.is_read ? <span>읽음</span> : <span>읽지 않음</span>}
              </div>
              <div className="notification-detail-message">{selectedNotification.message}</div>
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
                  aria-hidden="true"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
