'use client'
import { createClient } from '@/lib/supabase/client'


export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserWithSites | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'sites' | 'workLogs' | 'documents'>('info')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [statistics, setStatistics] = useState({
    total_sites: 0,
    total_work_hours: 0,
    total_daily_reports: 0,
    total_documents: 0,
    active_sites: 0
  })

  useEffect(() => {
    loadUser()
    loadStatistics()
  }, [userId])

  const loadUser = async () => {
    setLoading(true)
    try {
      const result = await getUser(userId)
      if (result.success && result.data) {
        setUser(result.data)
      } else {
        toast.error(result.error || '사용자 정보를 불러오는데 실패했습니다.')
        router.push('/dashboard/admin/users')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      toast.error('사용자 정보를 불러오는데 실패했습니다.')
      router.push('/dashboard/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const supabase = createClient()
      
      // Get total work hours from work_records
      const { data: attendanceData } = await supabase
        .from('work_records')
        .select('work_hours')
        .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
      
      const totalWorkHours = attendanceData?.reduce((sum: number, record: unknown) => sum + (record.work_hours || 0), 0) || 0
      
      // Get total daily reports count
      const { count: reportsCount } = await supabase
        .from('daily_reports')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
      
      // Get submitted documents count
      const { count: documentsCount } = await supabase
        .from('user_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      setStatistics(prev => ({
        ...prev,
        total_work_hours: totalWorkHours,
        total_daily_reports: reportsCount || 0,
        total_documents: documentsCount || 0
      }))
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const handleUpdateUser = async (formData: unknown) => {
    if (!user) return
    
    setEditLoading(true)
    try {
      const result = await updateUser({
        id: user.id,
        ...formData
      })
      
      if (result.success) {
        toast.success('사용자 정보가 수정되었습니다.')
        setShowEditModal(false)
        loadUser()
      } else {
        toast.error(result.error || '수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('수정 중 오류가 발생했습니다.')
    } finally {
      setEditLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user) return
    
    if (!confirm(`${user.full_name}님의 비밀번호를 재설정하시겠습니까?`)) {
      return
    }

    try {
      const result = await resetUserPassword(user.id)
      if (result.success && result.data) {
        alert(`비밀번호가 재설정되었습니다.\n새 임시 비밀번호: ${result.data}`)
      } else {
        toast.error(result.error || '비밀번호 재설정에 실패했습니다.')
      }
    } catch (error) {
      toast.error('비밀번호 재설정 중 오류가 발생했습니다.')
    }
  }

  const handleStatusToggle = async () => {
    if (!user) return
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '활성화' : '비활성화'
    
    if (!confirm(`${user.full_name}님을 ${statusText}하시겠습니까?`)) {
      return
    }

    try {
      const result = await updateUserStatus([user.id], newStatus)
      if (result.success) {
        toast.success(`사용자가 ${statusText}되었습니다.`)
        loadUser()
      } else {
        toast.error(result.error || `${statusText}에 실패했습니다.`)
      }
    } catch (error) {
      toast.error(`${statusText} 중 오류가 발생했습니다.`)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: AlertCircle },
      suspended: { text: '정지', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
      admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
      system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.worker
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Shield className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            사용자 정보를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link 
              href="/dashboard/admin/users"
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              사용자 관리
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{user.full_name}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.full_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status || 'active')}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                편집
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-4 sm:px-6 lg:px-8">
            {[
              { key: 'info', label: '기본 정보', icon: User },
              { key: 'sites', label: '현장 및 출력', icon: Building, count: statistics?.total_work_hours },
              { key: 'workLogs', label: '작업일지', icon: FileText, count: statistics?.total_daily_reports },
              { key: 'documents', label: '필수 제출 서류', icon: ClipboardCheck, count: statistics?.total_documents }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as unknown)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                      {tab.key === 'sites' ? tab.count.toFixed(1) : tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'info' && (
          <UserBasicInfoTab 
            user={user} 
            statistics={statistics}
            onEdit={() => setShowEditModal(true)}
          />
        )}

        {activeTab === 'sites' && (
          <UserSitesPrintsTab userId={userId} userName={user.full_name} />
        )}

        {activeTab === 'workLogs' && (
          <UserWorkLogsTab userId={userId} userName={user.full_name} />
        )}

        {activeTab === 'documents' && (
          <UserDocumentsTab userId={userId} userName={user.full_name} />
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && user && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateUser}
          loading={editLoading}
          userData={user}
        />
      )}
    </div>
  )
}

// Edit User Modal Component
function EditUserModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  userData
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: unknown) => void
  loading: boolean
  userData: UserWithSites
}) {
  const [formData, setFormData] = useState({
    full_name: userData.full_name || '',
    email: userData.email || '',
    phone: userData.phone || '',
    role: userData.role || 'worker',
    status: userData.status || 'active',
    organization_id: userData.organization?.id || ''
  })
  
  const [organizations, setOrganizations] = useState<Array<{
    id: string
    name: string
    description: string
  }>>([])
  const [organizationsLoading, setOrganizationsLoading] = useState(false)

  useEffect(() => {
    setFormData({
      full_name: userData.full_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'worker',
      status: userData.status || 'active',
      organization_id: userData.organization?.id || ''
    })
    
    // 조직 목록 로드
    loadOrganizations()
  }, [userData])
  
  const loadOrganizations = async () => {
    setOrganizationsLoading(true)
    try {
      const response = await fetch('/api/organizations')
      const result = await response.json()
      
      if (result.success) {
        setOrganizations(result.data)
      } else {
        console.error('Failed to load organizations:', result.error)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setOrganizationsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.email) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">사용자 정보 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">닫기</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              역할
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="worker">작업자</option>
              <option value="site_manager">현장관리자</option>
              <option value="customer_manager">파트너사</option>
              <option value="admin">관리자</option>
              <option value="system_admin">시스템관리자</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상태
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="suspended">정지</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              소속 조직
            </label>
            <select
              id="organization_id"
              name="organization_id"
              value={formData.organization_id}
              onChange={handleChange}
              disabled={organizationsLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">조직을 선택하세요</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {organizationsLoading && (
              <p className="text-sm text-gray-500 mt-1">조직 목록을 불러오는 중...</p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}