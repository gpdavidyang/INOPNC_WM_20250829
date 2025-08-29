'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  History,
  FileText,
  Filter,
  Search
} from 'lucide-react'
import { 
  sendEmailNotification,
  sendBulkEmailNotifications,
  getEmailTemplates,
  getEmailNotificationHistory,
  EmailNotificationData,
  BulkEmailData
} from '@/app/actions/admin/email-notifications'
import { UserRole, EmailNotificationStatus, EmailNotificationType, EmailNotificationPriority } from '@/types'

export default function EmailNotifications() {
  const [activeTab, setActiveTab] = useState<'send' | 'bulk' | 'templates' | 'history'>('send')
  const [templates, setTemplates] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalHistory, setTotalHistory] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyFilter, setHistoryFilter] = useState<EmailNotificationStatus | ''>('')

  // Single email form state
  const [singleEmail, setSingleEmail] = useState({
    recipient_email: '',
    recipient_name: '',
    subject: '',
    content: '',
    notification_type: 'system_notification' as EmailNotificationType,
    priority: 'normal' as EmailNotificationPriority
  })

  // Bulk email form state
  const [bulkEmail, setBulkEmail] = useState({
    subject: '',
    content: '',
    notification_type: 'system_notification' as EmailNotificationType,
    priority: 'normal' as EmailNotificationPriority,
    role_filter: [] as UserRole[],
    site_filter: [] as string[]
  })

  useEffect(() => {
    loadTemplates()
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, historyPage, historyFilter])

  const loadTemplates = async () => {
    try {
      const result = await getEmailTemplates()
      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadHistory = async () => {
    setLoading(true)
    try {
      const result = await getEmailNotificationHistory(
        historyPage,
        10,
        historyFilter || undefined
      )
      if (result.success) {
        setHistory(result.data?.notifications || [])
        setTotalHistory(result.data?.total || 0)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendSingle = async () => {
    if (!singleEmail.recipient_email || !singleEmail.subject || !singleEmail.content) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const emailData: EmailNotificationData = {
        ...singleEmail,
        sender_id: 'current-admin-id' // This would come from session
      }

      const result = await sendEmailNotification(emailData)
      if (result.success) {
        alert(result.message)
        setSingleEmail({
          recipient_email: '',
          recipient_name: '',
          subject: '',
          content: '',
          notification_type: 'system_notification',
          priority: 'normal'
        })
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendBulk = async () => {
    if (!bulkEmail.subject || !bulkEmail.content) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    if (bulkEmail.role_filter.length === 0 && bulkEmail.site_filter.length === 0) {
      alert('역할 또는 현장을 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const bulkData: BulkEmailData = {
        recipients: [], // Will be filtered by role/site
        ...bulkEmail
      }

      const result = await sendBulkEmailNotifications(bulkData)
      if (result.success) {
        alert(result.message)
        setBulkEmail({
          subject: '',
          content: '',
          notification_type: 'system_notification',
          priority: 'normal',
          role_filter: [],
          site_filter: []
        })
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('대량 이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const useTemplate = (template: any) => {
    if (activeTab === 'send') {
      setSingleEmail({
        ...singleEmail,
        subject: template.subject,
        content: template.content,
        notification_type: template.type
      })
    } else if (activeTab === 'bulk') {
      setBulkEmail({
        ...bulkEmail,
        subject: template.subject,
        content: template.content,
        notification_type: template.type
      })
    }
  }

  const getStatusBadge = (status: EmailNotificationStatus) => {
    const statusConfig = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
      sent: { text: '발송완료', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      failed: { text: '발송실패', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
      scheduled: { text: '예약됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: Clock }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const getPriorityBadge = (priority: EmailNotificationPriority) => {
    const priorityConfig = {
      low: { text: '낮음', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
      normal: { text: '보통', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      high: { text: '높음', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
      urgent: { text: '긴급', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = priorityConfig[priority]
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">이메일 알림 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">사용자에게 이메일 알림을 발송하고 이력을 관리합니다</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'send', label: '개별 발송', icon: Mail },
            { key: 'bulk', label: '대량 발송', icon: Users },
            { key: 'templates', label: '템플릿', icon: FileText },
            { key: 'history', label: '발송 이력', icon: History }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {/* Single Email Send */}
        {activeTab === 'send' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">개별 이메일 발송</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  수신자 이메일 *
                </label>
                <input
                  type="email"
                  value={singleEmail.recipient_email}
                  onChange={(e) => setSingleEmail({ ...singleEmail, recipient_email: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  수신자 이름 *
                </label>
                <input
                  type="text"
                  value={singleEmail.recipient_name}
                  onChange={(e) => setSingleEmail({ ...singleEmail, recipient_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  알림 타입
                </label>
                <select
                  value={singleEmail.notification_type}
                  onChange={(e) => setSingleEmail({ ...singleEmail, notification_type: e.target.value as EmailNotificationType })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="system_notification">시스템 공지</option>
                  <option value="welcome">환영 메시지</option>
                  <option value="password_reset">비밀번호 재설정</option>
                  <option value="account_update">계정 변경</option>
                  <option value="document_reminder">서류 제출 알림</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  value={singleEmail.priority}
                  onChange={(e) => setSingleEmail({ ...singleEmail, priority: e.target.value as EmailNotificationPriority })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={singleEmail.subject}
                onChange={(e) => setSingleEmail({ ...singleEmail, subject: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="이메일 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용 *
              </label>
              <textarea
                value={singleEmail.content}
                onChange={(e) => setSingleEmail({ ...singleEmail, content: e.target.value })}
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="이메일 내용을 입력하세요"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendSingle}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {loading ? '발송 중...' : '이메일 발송'}
              </button>
            </div>
          </div>
        )}

        {/* Bulk Email Send */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">대량 이메일 발송</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  대상 역할
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'worker', label: '작업자' },
                    { value: 'site_manager', label: '현장관리자' },
                    { value: 'customer_manager', label: '파트너사' },
                    { value: 'admin', label: '관리자' }
                  ].map(role => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkEmail.role_filter.includes(role.value as UserRole)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkEmail({
                              ...bulkEmail,
                              role_filter: [...bulkEmail.role_filter, role.value as UserRole]
                            })
                          } else {
                            setBulkEmail({
                              ...bulkEmail,
                              role_filter: bulkEmail.role_filter.filter(r => r !== role.value)
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  value={bulkEmail.priority}
                  onChange={(e) => setBulkEmail({ ...bulkEmail, priority: e.target.value as EmailNotificationPriority })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={bulkEmail.subject}
                onChange={(e) => setBulkEmail({ ...bulkEmail, subject: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="이메일 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용 *
              </label>
              <textarea
                value={bulkEmail.content}
                onChange={(e) => setBulkEmail({ ...bulkEmail, content: e.target.value })}
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="이메일 내용을 입력하세요"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendBulk}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Users className="h-4 w-4" />
                {loading ? '발송 중...' : '대량 발송'}
              </button>
            </div>
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">이메일 템플릿</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h4>
                    <button
                      onClick={() => useTemplate(template)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      사용하기
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-3">{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">발송 이력</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as any)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">모든 상태</option>
                  <option value="pending">대기중</option>
                  <option value="sent">발송완료</option>
                  <option value="failed">발송실패</option>
                  <option value="scheduled">예약됨</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{notification.subject}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            받는이: {notification.recipient_name} ({notification.recipient_email})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(notification.priority)}
                        {getStatusBadge(notification.status)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>타입: {notification.notification_type}</span>
                      <span>
                        {notification.sent_at ? 
                          `발송일: ${new Date(notification.sent_at).toLocaleDateString('ko-KR')}` :
                          `생성일: ${new Date(notification.created_at).toLocaleDateString('ko-KR')}`
                        }
                      </span>
                    </div>
                    {notification.error_message && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                        오류: {notification.error_message}
                      </div>
                    )}
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    발송 이력이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}