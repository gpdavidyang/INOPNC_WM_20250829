'use client'

import EmptyState from '@/components/ui/empty-state'
import { t } from '@/lib/ui/strings'

import NotificationCreateModal from './NotificationCreateModal'

interface NotificationCenterProps {
  profile: Profile
}

interface SystemNotification {
  id: string
  type: 'announcement' | 'request' | 'approval' | 'document' | 'material' | 'salary' | 'system'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  source: string
  target_user_id?: string
  target_role?: string
  is_read: boolean
  is_archived: boolean
  created_at: string
  read_at?: string
  action_url?: string
  metadata?: unknown
}

const notificationTypes = [
  { value: 'all', label: '전체', icon: Bell },
  { value: 'announcement', label: '공지사항', icon: Bell },
  { value: 'request', label: '요청사항', icon: MessageSquare },
  { value: 'approval', label: '승인대기', icon: UserPlus },
  { value: 'document', label: '문서', icon: FileText },
  { value: 'material', label: '자재', icon: Package },
  { value: 'salary', label: '급여', icon: DollarSign },
  { value: 'system', label: '시스템', icon: Settings },
]

const priorityConfig = {
  low: { label: '낮음', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  medium: { label: '보통', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  high: {
    label: '높음',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  critical: { label: '긴급', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function NotificationCenter({ profile }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<SystemNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const supabase = createClient()

  // 데이터 변환 헬퍼 함수들
  const getNotificationTypeFromString = (type: string): SystemNotification['type'] => {
    switch (type) {
      case 'info':
        return 'announcement'
      case 'warning':
        return 'request'
      case 'error':
        return 'system'
      default:
        return 'announcement'
    }
  }

  const getNotificationPriorityFromType = (type: string): SystemNotification['priority'] => {
    switch (type) {
      case 'error':
        return 'critical'
      case 'warning':
        return 'high'
      case 'info':
        return 'medium'
      default:
        return 'low'
    }
  }

  const getCategoryFromType = (type: string): string => {
    switch (type) {
      case 'error':
        return '시스템'
      case 'warning':
        return '경고'
      case 'info':
        return '공지사항'
      default:
        return '일반'
    }
  }

  // 통계 데이터
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    critical: notifications.filter(n => n.priority === 'critical' && !n.is_read).length,
    high: notifications.filter(n => n.priority === 'high' && !n.is_read).length,
    archived: notifications.filter(n => n.is_archived).length,
  }

  useEffect(() => {
    fetchNotifications()

    // 실시간 구독 설정
    const channel = supabase
      .channel('notification_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        console.log('Notification change detected:', payload)
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, selectedType, selectedPriority, showUnreadOnly, searchTerm])

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      // 실제 알림 데이터 가져오기
      const response = await fetch('/api/notifications?limit=50')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications')
      }

      // 데이터 변환
      const transformedNotifications: SystemNotification[] = result.data.map(
        (notification: unknown) => ({
          id: notification.id,
          type: getNotificationTypeFromString(notification.type),
          title: notification.title,
          message: notification.message,
          priority: getNotificationPriorityFromType(notification.type),
          category: getCategoryFromType(notification.type),
          source: notification.user_id ? 'User System' : 'System Admin',
          target_user_id: notification.user_id,
          is_read: notification.is_read || false,
          is_archived: false,
          created_at: notification.created_at,
          read_at: notification.read_at,
          action_url: notification.action_url,
          metadata: notification.metadata,
        })
      )

      setNotifications(transformedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)

      // 에러 시 기본 목 데이터
      const mockNotifications: SystemNotification[] = [
        {
          id: '1',
          type: 'announcement',
          title: '시스템 정기 점검 안내',
          message: '매주 일요일 새벽 2시-4시 시스템 점검이 진행됩니다.',
          priority: 'medium',
          category: '시스템',
          source: 'System Admin',
          is_read: false,
          is_archived: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          type: 'request',
          title: '자재 출고 요청 승인 필요',
          message: '강남 A현장에서 NPC-1000 500개 출고 요청',
          priority: 'high',
          category: '자재관리',
          source: 'Site Manager',
          is_read: false,
          is_archived: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          action_url: '/dashboard/admin/materials',
        },
        {
          id: '3',
          type: 'approval',
          title: '신규 가입 승인 대기',
          message: '홍길동님의 가입 승인이 필요합니다.',
          priority: 'high',
          category: '사용자관리',
          source: 'Registration System',
          is_read: true,
          is_archived: false,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          read_at: new Date(Date.now() - 3600000).toISOString(),
          action_url: '/dashboard/admin/approvals',
        },
        {
          id: '4',
          type: 'document',
          title: '새 문서 업로드됨',
          message: '작업지시서가 업로드되었습니다.',
          priority: 'low',
          category: '문서관리',
          source: 'Document System',
          is_read: true,
          is_archived: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read_at: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: '5',
          type: 'salary',
          title: '급여 명세서 생성 완료',
          message: '2024년 1월 급여 명세서가 생성되었습니다.',
          priority: 'medium',
          category: '급여관리',
          source: 'Payroll System',
          is_read: false,
          is_archived: false,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          action_url: '/dashboard/admin/salary',
        },
        {
          id: '6',
          type: 'system',
          title: '보안 업데이트 완료',
          message: '시스템 보안 패치가 성공적으로 적용되었습니다.',
          priority: 'low',
          category: '시스템',
          source: 'Security System',
          is_read: true,
          is_archived: true,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          read_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]

      setNotifications(mockNotifications)
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // 타입 필터
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType)
    }

    // 우선순위 필터
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority)
    }

    // 읽지 않은 알림만
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.is_read)
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 보관함 제외
    filtered = filtered.filter(n => !n.is_archived)

    // 최신순 정렬
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredNotifications(filtered)
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }))
    )
  }

  const archiveNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_archived: true } : n))
    )
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setTimeout(() => setRefreshing(false), 500)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return Bell
      case 'request':
        return MessageSquare
      case 'approval':
        return UserPlus
      case 'document':
        return FileText
      case 'material':
        return Package
      case 'salary':
        return DollarSign
      case 'system':
        return Settings
      default:
        return Bell
    }
  }

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">통합 알림 센터</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              모든 시스템 알림을 한 곳에서 관리하세요
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>새 알림</span>
            </button>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">전체</p>
                <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </span>
              </div>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-1 sm:mt-0" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 truncate">
                  읽지 않음
                </p>
                <span className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.unread}
                </span>
              </div>
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-1 sm:mt-0" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 truncate">긴급</p>
                <span className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.critical}
                </span>
              </div>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-1 sm:mt-0" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 truncate">
                  높음
                </p>
                <span className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.high}
                </span>
              </div>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-1 sm:mt-0" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  보관됨
                </p>
                <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.archived}
                </span>
              </div>
              <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-1 sm:mt-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-4">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 필터 옵션 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">모든 타입</option>
                {notificationTypes.slice(1).map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">모든 우선순위</option>
              <option value="critical">긴급</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={e => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">읽지 않은 알림만</span>
            </label>

            {stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="ml-auto px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                모두 읽음 표시
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500">알림을 불러오는 중...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState description="표시할 알림이 없습니다." />
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map(notification => {
              const Icon = getNotificationIcon(notification.type)
              const priority = priorityConfig[notification.priority]

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification)
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${priority.bg} ${priority.border} border`}>
                      <Icon className={`h-5 w-5 ${priority.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">{notification.category}</span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.source && (
                              <span className="text-xs text-gray-500">
                                from {notification.source}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {notification.action_url && (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 알림 상세 모달 */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${priorityConfig[selectedNotification.priority].bg} ${priorityConfig[selectedNotification.priority].border} border`}
                  >
                    {(() => {
                      const Icon = getNotificationIcon(selectedNotification.type)
                      return (
                        <Icon
                          className={`h-6 w-6 ${priorityConfig[selectedNotification.priority].color}`}
                        />
                      )
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedNotification.title}
                    </h2>
                    <div className="flex items-center space-x-3 mt-1">
                      <span
                        className={`text-sm ${priorityConfig[selectedNotification.priority].color}`}
                      >
                        {priorityConfig[selectedNotification.priority].label}
                      </span>
                      <span className="text-sm text-gray-500">{selectedNotification.category}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedNotification.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    내용
                  </h3>
                  <p className="text-gray-900 dark:text-white">{selectedNotification.message}</p>
                </div>

                {selectedNotification.source && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      발신자
                    </h3>
                    <p className="text-gray-900 dark:text-white">{selectedNotification.source}</p>
                  </div>
                )}

                {selectedNotification.read_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      읽은 시간
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedNotification.read_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t dark:border-gray-700">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        archiveNotification(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                    >
                      <Archive className="h-4 w-4" />
                      <span>보관</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteNotification(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>삭제</span>
                    </button>
                  </div>

                  {selectedNotification.action_url && (
                    <a
                      href={selectedNotification.action_url}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <span>바로가기</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 알림 생성 모달 */}
      <NotificationCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchNotifications()
          setCreateModalOpen(false)
        }}
      />
    </div>
  )
}
