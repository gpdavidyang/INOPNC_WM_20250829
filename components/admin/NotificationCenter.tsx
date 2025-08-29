'use client'

import { useState, useEffect } from 'react'
import { Profile, NotificationType } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/custom-select'
import { 
  Bell, 
  BellOff,
  Send,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Users,
  User,
  Filter,
  Search,
  Clock,
  Eye,
  EyeOff,
  MessageSquare,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface NotificationCenterProps {
  profile: Profile
}

interface SystemNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  recipient_id?: string
  recipient_name?: string
  recipient_type: 'all' | 'user' | 'role' | 'site'
  is_read: boolean
  created_at: string
  created_by: string
  created_by_name: string
}

interface NotificationStats {
  total: number
  read: number
  unread: number
  by_type: {
    info: number
    success: number
    warning: number
    error: number
  }
}

export default function NotificationCenter({ profile }: NotificationCenterProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  const [activeTab, setActiveTab] = useState<'history' | 'send' | 'settings'>('history')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Notification history state
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  
  // Stats
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    read: 0,
    unread: 0,
    by_type: {
      info: 0,
      success: 0,
      warning: 0,
      error: 0
    }
  })
  
  // Send notification form
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'info' as NotificationType,
    recipient_type: 'all' as 'all' | 'user' | 'role' | 'site',
    recipient_id: '',
    is_emergency: false
  })
  
  // Push settings
  const [pushSettings, setPushSettings] = useState({
    enabled: true,
    emergency_only: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  })
  
  // Load notification history
  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call - replace with actual API
      const mockData: SystemNotification[] = [
        {
          id: '1',
          title: '시스템 점검 완료',
          message: '예정된 시스템 점검이 완료되었습니다.',
          type: 'success',
          recipient_type: 'all',
          is_read: true,
          created_at: new Date().toISOString(),
          created_by: profile.id,
          created_by_name: '시스템 관리자'
        },
        {
          id: '2',
          title: '새로운 사용자 가입',
          message: '새로운 사용자가 시스템에 가입했습니다.',
          type: 'info',
          recipient_type: 'role',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          created_by: profile.id,
          created_by_name: '시스템'
        },
        {
          id: '3',
          title: '보안 경고',
          message: '비정상적인 로그인 시도가 감지되었습니다.',
          type: 'warning',
          recipient_type: 'all',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          created_by: profile.id,
          created_by_name: '보안 시스템'
        }
      ]
      
      setNotifications(mockData)
      setTotalPages(1)
      
      // Calculate stats
      const newStats: NotificationStats = {
        total: mockData.length,
        read: mockData.filter(n => n.is_read).length,
        unread: mockData.filter(n => !n.is_read).length,
        by_type: {
          info: mockData.filter(n => n.type === 'info').length,
          success: mockData.filter(n => n.type === 'success').length,
          warning: mockData.filter(n => n.type === 'warning').length,
          error: mockData.filter(n => n.type === 'error').length
        }
      }
      setStats(newStats)
      
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('알림 내역을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (activeTab === 'history') {
      loadNotifications()
    }
  }, [activeTab, currentPage, searchTerm, typeFilter, readFilter])
  
  // Send notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    
    try {
      // Validate form
      if (!sendForm.title || !sendForm.message) {
        throw new Error('제목과 메시지를 입력해주세요.')
      }
      
      // TODO: Implement actual send API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form
      setSendForm({
        title: '',
        message: '',
        type: 'info',
        recipient_type: 'all',
        recipient_id: '',
        is_emergency: false
      })
      
      // Show success message
      alert('알림이 성공적으로 발송되었습니다.')
      
      // Refresh notification list
      setActiveTab('history')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 발송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }
  
  // Save push settings
  const handleSaveSettings = async () => {
    try {
      // TODO: Implement actual settings save API
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('설정이 저장되었습니다.')
    } catch (err) {
      setError('설정 저장에 실패했습니다.')
    }
  }
  
  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      // TODO: Implement actual API
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }
  
  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return
    
    try {
      // TODO: Implement actual API
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }
  
  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }
  
  // Get notification badge color
  const getNotificationBadgeClass = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            알림 내역
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            알림 발송
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            푸시 설정
          </button>
        </nav>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">전체 알림</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">읽지 않음</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                </div>
                <BellOff className="h-8 w-8 text-red-400" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">성공 알림</p>
                  <p className="text-2xl font-bold text-green-600">{stats.by_type.success}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">경고 알림</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.by_type.warning}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </Card>
          </div>
          
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="알림 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | '')}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 유형</option>
                <option value="info">정보</option>
                <option value="success">성공</option>
                <option value="warning">경고</option>
                <option value="error">오류</option>
              </select>
              
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as 'all' | 'read' | 'unread')}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">모든 알림</option>
                <option value="read">읽음</option>
                <option value="unread">읽지 않음</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          
          {/* Notification List */}
          <Card className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                알림이 없습니다.
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationBadgeClass(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium`}>
                          {notification.title}
                        </h4>
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mt-1`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(notification.created_at).toLocaleString('ko-KR')}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {notification.created_by_name}
                          </span>
                          <span className="flex items-center">
                            {notification.recipient_type === 'all' ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                전체
                              </>
                            ) : notification.recipient_type === 'user' ? (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                {notification.recipient_name || '개인'}
                              </>
                            ) : (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                {notification.recipient_type}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      )}
      
      {/* Send Tab */}
      {activeTab === 'send' && (
        <Card className="p-6">
          <form onSubmit={handleSendNotification} className="space-y-6">
            <div>
              <Label htmlFor="title">알림 제목 *</Label>
              <Input
                id="title"
                value={sendForm.title}
                onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                placeholder="알림 제목을 입력하세요"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="message">알림 메시지 *</Label>
              <Textarea
                id="message"
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                placeholder="알림 메시지를 입력하세요"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">알림 유형</Label>
                <select
                  id="type"
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as NotificationType })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="info">정보</option>
                  <option value="success">성공</option>
                  <option value="warning">경고</option>
                  <option value="error">오류</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="recipient_type">수신 대상</Label>
                <select
                  id="recipient_type"
                  value={sendForm.recipient_type}
                  onChange={(e) => setSendForm({ ...sendForm, recipient_type: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">전체</option>
                  <option value="user">특정 사용자</option>
                  <option value="role">역할별</option>
                  <option value="site">현장별</option>
                </select>
              </div>
            </div>
            
            {sendForm.recipient_type !== 'all' && (
              <div>
                <Label htmlFor="recipient_id">
                  {sendForm.recipient_type === 'user' && '사용자 선택'}
                  {sendForm.recipient_type === 'role' && '역할 선택'}
                  {sendForm.recipient_type === 'site' && '현장 선택'}
                </Label>
                <Input
                  id="recipient_id"
                  value={sendForm.recipient_id}
                  onChange={(e) => setSendForm({ ...sendForm, recipient_id: e.target.value })}
                  placeholder="수신 대상을 선택하세요"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_emergency"
                checked={sendForm.is_emergency}
                onCheckedChange={(checked) => setSendForm({ ...sendForm, is_emergency: checked })}
              />
              <Label htmlFor="is_emergency" className="flex items-center cursor-pointer">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                긴급 알림으로 발송
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSendForm({
                  title: '',
                  message: '',
                  type: 'info',
                  recipient_type: 'all',
                  recipient_id: '',
                  is_emergency: false
                })}
              >
                초기화
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    알림 발송
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
                푸시 알림 설정
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push_enabled" className="text-base">푸시 알림 활성화</Label>
                    <p className="text-sm text-gray-500">모든 푸시 알림을 받습니다</p>
                  </div>
                  <Switch
                    id="push_enabled"
                    checked={pushSettings.enabled}
                    onCheckedChange={(checked) => setPushSettings({ ...pushSettings, enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergency_only" className="text-base">긴급 알림만 받기</Label>
                    <p className="text-sm text-gray-500">긴급 알림만 푸시로 받습니다</p>
                  </div>
                  <Switch
                    id="emergency_only"
                    checked={pushSettings.emergency_only}
                    onCheckedChange={(checked) => setPushSettings({ ...pushSettings, emergency_only: checked })}
                    disabled={!pushSettings.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="quiet_hours" className="text-base">방해 금지 시간</Label>
                    <p className="text-sm text-gray-500">설정한 시간에는 알림을 받지 않습니다</p>
                  </div>
                  <Switch
                    id="quiet_hours"
                    checked={pushSettings.quiet_hours_enabled}
                    onCheckedChange={(checked) => setPushSettings({ ...pushSettings, quiet_hours_enabled: checked })}
                    disabled={!pushSettings.enabled}
                  />
                </div>
                
                {pushSettings.quiet_hours_enabled && (
                  <div className="ml-14 flex items-center space-x-2">
                    <Input
                      type="time"
                      value={pushSettings.quiet_hours_start}
                      onChange={(e) => setPushSettings({ ...pushSettings, quiet_hours_start: e.target.value })}
                      className="w-32"
                    />
                    <span>~</span>
                    <Input
                      type="time"
                      value={pushSettings.quiet_hours_end}
                      onChange={(e) => setPushSettings({ ...pushSettings, quiet_hours_end: e.target.value })}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings}>
                <Settings className="h-4 w-4 mr-2" />
                설정 저장
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}