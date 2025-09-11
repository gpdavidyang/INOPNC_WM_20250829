'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
  BellOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { NotificationExtended, NotificationType } from '@/types/notifications'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification
} from '@/app/actions/notifications'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface NotificationListProps {
  className?: string
  onNotificationClick?: (notification: NotificationExtended) => void
}

export function NotificationList({ className, onNotificationClick }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const result = await getNotifications({ limit: 50 })
      if (result.success && result.data) {
        setNotifications(result.data)
      } else {
        console.error('Failed to load notifications:', result.error)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notification: NotificationExtended) => {
    if (notification.is_read) return

    try {
      const result = await markNotificationAsRead(notification.id)
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    setDeletingId(notificationId)

    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success('알림이 삭제되었습니다.')
      } else {
        showErrorNotification(result.error || '알림 삭제에 실패했습니다', 'deleteNotification')
      }
    } catch (error) {
      showErrorNotification(error, 'deleteNotification')
    } finally {
      setDeletingId(null)
    }
  }

  const handleNotificationClick = (notification: NotificationExtended) => {
    handleMarkAsRead(notification)
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    } else if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'system':
        return <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    if (read) {
      return 'bg-white dark:bg-gray-800'
    }
    
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-gray-800 border-l-4 border-green-500'
      case 'warning':
        return 'bg-white dark:bg-gray-800 border-l-4 border-yellow-500'
      case 'error':
        return 'bg-white dark:bg-gray-800 border-l-4 border-red-500'
      case 'system':
        return 'bg-white dark:bg-gray-800 border-l-4 border-purple-500'
      case 'approval':
        return 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'
      default:
        return 'bg-white dark:bg-gray-800 border-l-4 border-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <BellOff className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-500" />
        <p className="text-sm">알림이 없습니다</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-2">
        {notifications.map((notification: any) => (
          <div
            key={notification.id}
            className={cn(
              "relative group flex items-start gap-3 p-3 mb-2 rounded-lg cursor-pointer transition-all",
              "hover:bg-gray-50 dark:hover:bg-gray-700/50",
              getNotificationBgColor(notification.type, notification.is_read),
              notification.is_read ? "opacity-70" : "",
              !notification.is_read && "shadow-sm"
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className={cn(
                    "text-sm leading-tight",
                    notification.is_read 
                      ? "text-gray-700 dark:text-gray-300 font-normal" 
                      : "text-gray-900 dark:text-gray-100 font-semibold"
                  )}>
                    {notification.title}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1 leading-relaxed line-clamp-2",
                    notification.is_read 
                      ? "text-gray-500 dark:text-gray-400" 
                      : "text-gray-600 dark:text-gray-300"
                  )}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </span>
                    {notification.action_url && (
                      <ExternalLink className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => handleDelete(e, notification.id)}
                  disabled={deletingId === notification.id}
                >
                  {deletingId === notification.id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <X className="h-2.5 w-2.5" />
                  )}
                </Button>
              </div>
            </div>

            {!notification.is_read && (
              <div className="absolute top-3 right-3 h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full shadow-sm" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}