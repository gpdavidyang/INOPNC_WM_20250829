import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
  priority: 'low' | 'medium' | 'high'
}

export interface UseNotificationsOptions {
  limit?: number
  showReadNotifications?: boolean
  userId?: string
}

export function useNotifications({
  limit = 5,
  showReadNotifications = true,
  userId
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (limit > 0) {
        query = query.limit(limit)
      }

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`)
      }

      if (!showReadNotifications) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error

      const transformedNotifications: Notification[] = (data || []).map(notification => ({
        ...notification,
        priority: notification.type === 'error' ? 'high' : 
                 notification.type === 'warning' ? 'medium' : 'low'
      }))

      setNotifications(transformedNotifications)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err instanceof Error ? err.message : '알림을 불러오는데 실패했습니다.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [supabase, limit, showReadNotifications, userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )

      return true
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id)
      }

      return true
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return false
    }
  }, [notifications, markAsRead])

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.is_read).length
  }, [notifications])

  const refreshNotifications = useCallback(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // 실시간 알림 구독
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          console.log('Notification change:', payload)
          refreshNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, refreshNotifications])

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refreshNotifications
  }
}