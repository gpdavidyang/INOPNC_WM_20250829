'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationHistory } from './notification-history'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  BellOff,
  Loader2,
  Filter,
  X,
  Mail,
  Archive,
  MailOpen,
  History,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { NotificationExtended, NotificationType, NotificationFilter } from '@/types/notifications'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/app/actions/notifications'
import { toast } from 'sonner'
import { NotificationSettings } from './notification-settings'

export function NotificationsContent() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [notifications, setNotifications] = useState<NotificationExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('unread')
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, []) // 한 번만 로드

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      // 개발 환경에서는 무조건 Mock 데이터 사용
      const isDevelopment = true // 또는 process.env.NODE_ENV === 'development'
      
      if (isDevelopment) {
        // 임시 Mock 데이터 - 스크린샷과 일치하도록 수정
        const mockNotifications: NotificationExtended[] = [
          {
            id: '1',
            user_id: 'mock',
            type: 'info',
            title: '새로운 작업일지가 제출되었습니다',
            message: '김철수님이 서울 강남구 현장의 작업일지를 제출했습니다. 확인해주세요.',
            is_read: false,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            data: {}
          },
          {
            id: '2',
            user_id: 'mock',
            type: 'warning',
            title: 'NPC-1000 재고 부족 경고',
            message: '서울 강남구 현장의 NPC-1000 재고가 150kg 남았습니다. 추가 주문이 필요합니다.',
            is_read: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            data: {}
          },
          {
            id: '3',
            user_id: 'mock',
            type: 'system',
            title: '시스템 점검 안내',
            message: '2025-08-03 02:00~04:00에 시스템 점검이 예정되어 있습니다.',
            is_read: false,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            data: {}
          },
          {
            id: '4',
            user_id: 'mock',
            type: 'success',
            title: '작업일지 승인 완료',
            message: '2025-08-01일자 작업일지가 승인되었습니다.',
            is_read: true,
            read_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            data: {}
          },
          {
            id: '5',
            user_id: 'mock',
            type: 'error',
            title: '작업일지 반려',
            message: '2025-07-31일자 작업일지가 반려되었습니다. 사유: 작업 내용 누락',
            is_read: true,
            read_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            data: {}
          }
        ]
        setNotifications(mockNotifications)
      } else {
        // 프로덕션 환경에서만 실제 데이터 사용
        const result = await getNotifications()
        if (result.success && result.data) {
          setNotifications(result.data)
        } else {
          setNotifications([])
        }
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      console.error('Failed to load notifications:', error)
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
        toast.success('알림을 읽음 처리했습니다.')
      }
    } catch (error) {
      toast.error('알림 읽음 처리에 실패했습니다.')
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setSelectedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        toast.success('알림이 삭제되었습니다.')
      } else {
        toast.error(result.error || '알림 삭제에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 삭제에 실패했습니다.')
      console.error('Failed to delete notification:', error)
    }
  }

  const handleMarkAllRead = async () => {
    setBulkActionLoading(true)
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
        toast.success(`${result.count}개의 알림을 읽음 처리했습니다.`)
      } else {
        toast.error(result.error || '알림 읽음 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 읽음 처리에 실패했습니다.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return

    setBulkActionLoading(true)
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id))
    
    try {
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)))
        setSelectedNotifications(new Set())
        toast.success(`${successCount}개의 알림이 삭제되었습니다.`)
      }
      
      if (successCount < selectedNotifications.size) {
        toast.error(`일부 알림 삭제에 실패했습니다.`)
      }
    } catch (error) {
      toast.error('알림 삭제에 실패했습니다.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "h-5 w-5"
    switch (type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-500 dark:text-green-400")} />
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-500 dark:text-yellow-400")} />
      case 'error':
        return <AlertCircle className={cn(iconClass, "text-red-500 dark:text-red-400")} />
      case 'system':
        return <Info className={cn(iconClass, "text-purple-500 dark:text-purple-400")} />
      case 'approval':
        return <CheckCircle className={cn(iconClass, "text-blue-500 dark:text-blue-400")} />
      default:
        return <Info className={cn(iconClass, "text-gray-500 dark:text-gray-400")} />
    }
  }

  const getTypeBadge = (type: NotificationType) => {
    const variants = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      system: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      approval: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      info: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }

    const labels = {
      success: '성공',
      warning: '경고',
      error: '오류',
      system: '시스템',
      approval: '승인',
      info: '정보'
    }

    return (
      <Badge className={cn('px-2 py-0.5 text-xs font-medium', variants[type])}>
        {labels[type]}
      </Badge>
    )
  }

  const filteredNotifications = notifications.filter(notification => {
    // 검색어 필터
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 읽음 상태 필터
    let matchesReadFilter = true
    if (readFilter === 'read') {
      matchesReadFilter = notification.read
    } else if (readFilter === 'unread') {
      matchesReadFilter = !notification.read
    }
    // readFilter === 'all'인 경우는 모든 알림을 표시
    
    // 타입 필터
    let matchesTypeFilter = true
    if (typeFilter && typeFilter !== 'all') {
      matchesTypeFilter = notification.type === typeFilter
    }
    
    return matchesSearch && matchesReadFilter && matchesTypeFilter
  })


  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount = notifications.filter(n => n.is_read).length
  const totalCount = notifications.length

  // Error State
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            알림을 불러올 수 없습니다
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {error}
          </p>
          <Button
            onClick={loadNotifications}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          알림
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={bulkActionLoading || unreadCount === 0}
            className="h-8 px-3 text-xs"
          >
            {bulkActionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3 mr-1" />
            )}
            모두읽음
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="active" className="text-sm">
          <Bell className="h-4 w-4 mr-2" />
          활성 알림
        </TabsTrigger>
        <TabsTrigger value="all" className="text-sm">
          <Archive className="h-4 w-4 mr-2" />
          모든 알림
        </TabsTrigger>
        <TabsTrigger value="history" className="text-sm">
          <History className="h-4 w-4 mr-2" />
          알림 기록
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="active" className="space-y-2.5">
      {/* Compact Filter Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-md mb-2.5">
          <button
            onClick={() => setReadFilter('all')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              readFilter === 'all' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <Archive className="w-3 h-3" />
              <span className="hidden sm:inline">전체</span>
              <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs px-1 py-0">
                {totalCount}
              </Badge>
            </span>
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              readFilter === 'unread' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <Mail className="w-3 h-3" />
              <span className="hidden sm:inline">읽지않음</span>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs px-1 py-0">
                {unreadCount}
              </Badge>
            </span>
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              readFilter === 'read' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <MailOpen className="w-3 h-3" />
              <span className="hidden sm:inline">읽음</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-1 py-0">
                {readCount}
              </Badge>
            </span>
          </button>
        </div>

        {/* Search and Filters Row */}
        <div className="flex gap-2 items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="알림 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 h-8 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded text-sm"
              maxLength={100}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                aria-label="검색어 지우기"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Type Filter */}
          <div className="w-24 sm:w-32">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                <SelectItem value="all">모든 유형</SelectItem>
                <SelectItem value="info">정보</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="warning">경고</SelectItem>
                <SelectItem value="error">오류</SelectItem>
                <SelectItem value="approval">승인</SelectItem>
                <SelectItem value="system">시스템</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedNotifications.size}개 선택됨
          </span>
          <Button
            variant="outline"
            size="compact"
            onClick={handleBulkDelete}
            disabled={bulkActionLoading}
            className="h-7 px-2.5 text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">삭제</span>
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">로딩중...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <BellOff className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {searchTerm ? '검색 결과가 없습니다' : '알림이 없습니다'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? '다른 검색어로 시도해보세요' 
                : '새로운 알림이 도착하면 여기에 표시됩니다'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className={cn(
                  "group flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                  !notification.is_read && "bg-blue-50/30 dark:bg-blue-950/20 border-l-3 border-blue-500"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedNotifications.has(notification.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleNotificationSelection(notification.id)
                  }}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 flex-shrink-0"
                />
                
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleMarkAsRead(notification)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className={cn(
                          "font-medium text-sm line-clamp-1 flex-1",
                          notification.is_read 
                            ? "text-gray-700 dark:text-gray-300" 
                            : "text-gray-900 dark:text-gray-100"
                        )}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getTypeBadge(notification.type)}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className={cn(
                        "text-xs line-clamp-2 mb-1",
                        notification.is_read 
                          ? "text-gray-500 dark:text-gray-400" 
                          : "text-gray-600 dark:text-gray-300"
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ko
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="compact"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </TabsContent>
      
      <TabsContent value="all" className="space-y-2.5">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">모든 알림 보기는 준비 중입니다.</p>
        </div>
      </TabsContent>
      
      <TabsContent value="history">
        <NotificationHistory />
      </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}