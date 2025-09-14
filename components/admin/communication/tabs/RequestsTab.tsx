'use client'


interface RequestsTabProps {
  profile: Profile
}

interface HeadquartersRequest {
  id: string
  request_date: string
  requester_id: string
  requester_name: string
  requester_email: string
  requester_role: string
  site_id?: string
  site_name?: string
  category: 'general' | 'technical' | 'administrative' | 'complaint' | 'suggestion' | 'other'
  subject: string
  content: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  assigned_to_name?: string
  response?: string
  response_date?: string
  resolved_date?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export default function RequestsTab({ profile }: RequestsTabProps) {
  const [requests, setRequests] = useState<HeadquartersRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<HeadquartersRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterUrgency, setFilterUrgency] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [responseForm, setResponseForm] = useState({
    response: '',
    status: 'in_progress' as 'in_progress' | 'resolved' | 'closed'
  })

  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [filterStatus, filterCategory, filterUrgency])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('headquarters_requests')
        .select(`
          *,
          profiles!requester_id(full_name, email, role),
          sites!site_id(name),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      if (filterCategory) {
        query = query.eq('category', filterCategory)
      }

      if (filterUrgency) {
        query = query.eq('urgency', filterUrgency)
      }

      const { data, error } = await query

      if (!error && data) {
        const formattedData: HeadquartersRequest[] = data.map(item => ({
          ...item,
          requester_name: (item as unknown).profiles?.full_name || '알 수 없음',
          requester_email: (item as unknown).profiles?.email || '',
          requester_role: (item as unknown).profiles?.role || 'worker',
          site_name: (item as unknown).sites?.name || '',
          assigned_to_name: (item as unknown).assigned_profile?.full_name || ''
        }))
        setRequests(formattedData)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (request: HeadquartersRequest) => {
    setSelectedRequest(request)
    setResponseForm({
      response: request.response || '',
      status: request.status === 'pending' ? 'in_progress' : request.status
    })
    setShowDetailModal(true)
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    try {
      const updateData: unknown = {
        status: responseForm.status,
        response: responseForm.response,
        response_date: new Date().toISOString(),
        assigned_to: profile.id,
        updated_at: new Date().toISOString()
      }

      if (responseForm.status === 'resolved' || responseForm.status === 'closed') {
        updateData.resolved_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('headquarters_requests')
        .update(updateData)
        .eq('id', selectedRequest.id)

      if (!error) {
        alert('요청사항이 처리되었습니다.')
        setShowDetailModal(false)
        setSelectedRequest(null)
        await loadRequests()
      }
    } catch (error) {
      console.error('Failed to process request:', error)
      alert('요청 처리에 실패했습니다.')
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: '일반',
      technical: '기술지원',
      administrative: '행정',
      complaint: '불만사항',
      suggestion: '제안',
      other: '기타'
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      technical: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      administrative: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
      complaint: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      suggestion: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      other: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
    }
    return colors[category] || colors.other
  }

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: '낮음' },
      medium: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '보통' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', label: '높음' },
      critical: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '긴급' }
    }
    const badge = badges[urgency as keyof typeof badges] || badges.medium
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: '대기중', icon: Clock },
      in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '처리중', icon: TrendingUp },
      resolved: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: '해결됨', icon: CheckCircle },
      closed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: '종료', icon: XCircle }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      partner: '파트너사',
      customer_manager: '고객관리자',
      admin: '관리자'
    }
    return labels[role] || role
  }

  const filteredRequests = requests.filter(request =>
    searchTerm === '' ||
    request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status !== 'closed').length
  }

  return (
    <div className="p-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">전체 요청</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">대기중</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">처리중</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">해결됨</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.resolved}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">긴급 처리</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.critical}</p>
          {stats.critical > 0 && <AlertCircle className="h-4 w-4 text-red-500 mt-1" />}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용, 요청자 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="in_progress">처리중</option>
            <option value="resolved">해결됨</option>
            <option value="closed">종료</option>
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 카테고리</option>
            <option value="general">일반</option>
            <option value="technical">기술지원</option>
            <option value="administrative">행정</option>
            <option value="complaint">불만사항</option>
            <option value="suggestion">제안</option>
            <option value="other">기타</option>
          </select>
        </div>

        <div>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 긴급도</option>
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="critical">긴급</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">요청일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">요청자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">제목</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">긴급도</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">담당자</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  요청사항이 없습니다.
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {request.request_date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {request.requester_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleLabel(request.requester_role)}
                        {request.site_name && ` · ${request.site_name}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(request.category)}`}>
                      {getCategoryLabel(request.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="truncate max-w-xs" title={request.subject}>
                      {request.subject}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getUrgencyBadge(request.urgency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.assigned_to_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewDetail(request)}
                      className="text-blue-600 hover:text-blue-800"
                      title="상세보기"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  요청사항 상세
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Request Details */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">요청일</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.request_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">카테고리</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedRequest.category)}`}>
                      {getCategoryLabel(selectedRequest.category)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">요청자</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.requester_name} ({getRoleLabel(selectedRequest.requester_role)})
                    </p>
                    <p className="text-sm text-gray-500">{selectedRequest.requester_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">현장</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.site_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">긴급도</p>
                    {getUrgencyBadge(selectedRequest.urgency)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">제목</p>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">
                    {selectedRequest.subject}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">요청 내용</p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedRequest.content}
                    </p>
                  </div>
                </div>

                {/* Previous Response */}
                {selectedRequest.response && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">이전 응답</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedRequest.response}
                      </p>
                      {selectedRequest.response_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(selectedRequest.response_date).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Response Form */}
                {selectedRequest.status !== 'closed' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      응답 작성
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          처리 상태
                        </label>
                        <select
                          value={responseForm.status}
                          onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value as unknown })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="in_progress">처리중</option>
                          <option value="resolved">해결됨</option>
                          <option value="closed">종료</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          응답 내용
                        </label>
                        <textarea
                          value={responseForm.response}
                          onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="응답 내용을 입력하세요..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedRequest(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                닫기
              </button>
              {selectedRequest.status !== 'closed' && (
                <button
                  onClick={handleProcessRequest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  응답 저장
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}