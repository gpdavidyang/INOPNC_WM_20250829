'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, Package, Wrench, Megaphone, ChevronRight, Filter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NotificationLog {
  id: string
  notification_type: string
  title: string
  body: string
  status: 'delivered' | 'failed' | 'pending'
  sent_at: string
  clicked_at?: string
  read_at?: string
  deleted_at?: string
  error_message?: string
  engagement: {
    clicked: boolean
    deepLinked: boolean
    actionPerformed: boolean
    lastEngagement?: string
  }
}

const NOTIFICATION_ICONS = {
  material_approval: <Package className="h-5 w-5 text-blue-500" />,
  daily_report_reminder: <Clock className="h-5 w-5 text-orange-500" />,
  safety_alert: <AlertTriangle className="h-5 w-5 text-red-500" />,
  equipment_maintenance: <Wrench className="h-5 w-5 text-purple-500" />,
  site_announcement: <Megaphone className="h-5 w-5 text-green-500" />
}

const NOTIFICATION_TYPE_LABELS = {
  material_approval: '자재 승인',
  daily_report_reminder: '작업일지 리마인더',
  safety_alert: '안전 경고',
  equipment_maintenance: '장비 정비',
  site_announcement: '현장 공지'
}

export function NotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [page, filterType, filterStatus])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filterType) params.append('type', filterType)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/notifications/history?${params}`)
      const data = await response.json()

      if (response.ok) {
        setNotifications(data.notifications)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          action: 'read'
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          action: 'delete'
        })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getStatusIcon = (notification: NotificationLog) => {
    if (notification.status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (notification.engagement.clicked || notification.read_at) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <div className="h-4 w-4 rounded-full bg-blue-500" />
  }

  const clearFilters = () => {
    setFilterType('')
    setFilterStatus('')
    setPage(1)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              알림 기록
            </h2>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            필터
            {(filterType || filterStatus) && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                {[filterType, filterStatus].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 유형</option>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 상태</option>
                <option value="delivered">전송됨</option>
                <option value="failed">실패</option>
              </select>

              {(filterType || filterStatus) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
              로딩 중...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {filterType || filterStatus ? '조건에 맞는 알림이 없습니다' : '알림 기록이 없습니다'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                notification.read_at ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {NOTIFICATION_ICONS[notification.notification_type as keyof typeof NOTIFICATION_ICONS] || <Bell className="h-5 w-5 text-gray-500" />}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.sent_at), { 
                            addSuffix: true,
                            locale: ko 
                          })}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {NOTIFICATION_TYPE_LABELS[notification.notification_type as keyof typeof NOTIFICATION_TYPE_LABELS]}
                        </span>
                        {notification.engagement.clicked && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            클릭됨
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(notification)}
                      
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="읽음 표시"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="삭제"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {notification.status === 'failed' && notification.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                      전송 실패: {notification.error_message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              이전
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  )
}