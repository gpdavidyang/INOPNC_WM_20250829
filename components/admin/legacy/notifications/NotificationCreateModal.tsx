'use client'


interface NotificationCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface NotificationForm {
  title: string
  message: string
  type: 'info' | 'warning' | 'error'
  targetType: 'all' | 'role' | 'user'
  targetRole: string
  targetUserId: string
  actionUrl: string
}

const notificationTypes = [
  { value: 'info', label: '정보', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'warning', label: '경고', color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'error', label: '긴급', color: 'text-red-600', bg: 'bg-red-50' }
]

const targetRoles = [
  { value: 'worker', label: '작업자' },
  { value: 'site_manager', label: '현장관리자' },
  { value: 'customer_manager', label: '파트너사' },
  { value: 'admin', label: '시스템관리자' }
]

export default function NotificationCreateModal({ isOpen, onClose, onSuccess }: NotificationCreateModalProps) {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetRole: 'worker',
    targetUserId: '',
    actionUrl: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.message) return

    setLoading(true)
    try {
      const payload: unknown = {
        title: form.title,
        message: form.message,
        type: form.type,
        action_url: form.actionUrl || null
      }

      // 대상 설정
      if (form.targetType === 'role') {
        payload.target_role = form.targetRole
      } else if (form.targetType === 'user') {
        payload.target_user_id = form.targetUserId
      }
      // 'all'인 경우는 기본값 (null)

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '알림 생성에 실패했습니다')
      }

      // 성공
      setForm({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetRole: 'worker',
        targetUserId: '',
        actionUrl: ''
      })
      
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error creating notification:', error)
      alert(error instanceof Error ? error.message : '알림 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof NotificationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  새 알림 생성
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  사용자들에게 알림을 전송합니다
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="알림 제목을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용 *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="알림 내용을 입력하세요"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* 알림 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                알림 유형
              </label>
              <div className="grid grid-cols-3 gap-3">
                {notificationTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('type', type.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      form.type === type.value
                        ? `${type.bg} border-current ${type.color}`
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{type.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 대상 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                알림 대상
              </label>
              <div className="space-y-4">
                {/* 대상 타입 선택 */}
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="all"
                      checked={form.targetType === 'all'}
                      onChange={(e) => handleChange('targetType', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">모든 사용자</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="role"
                      checked={form.targetType === 'role'}
                      onChange={(e) => handleChange('targetType', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">역할별</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="user"
                      checked={form.targetType === 'user'}
                      onChange={(e) => handleChange('targetType', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">특정 사용자</span>
                  </label>
                </div>

                {/* 역할별 선택 */}
                {form.targetType === 'role' && (
                  <select
                    value={form.targetRole}
                    onChange={(e) => handleChange('targetRole', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {targetRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* 특정 사용자 선택 */}
                {form.targetType === 'user' && (
                  <input
                    type="text"
                    value={form.targetUserId}
                    onChange={(e) => handleChange('targetUserId', e.target.value)}
                    placeholder="사용자 ID를 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {/* 액션 URL (선택사항) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                액션 URL (선택사항)
              </label>
              <input
                type="url"
                value={form.actionUrl}
                onChange={(e) => handleChange('actionUrl', e.target.value)}
                placeholder="클릭 시 이동할 URL (예: /dashboard/materials)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !form.title || !form.message}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>전송 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>알림 전송</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}