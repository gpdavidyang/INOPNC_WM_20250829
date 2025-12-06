'use client'

interface UnifiedUserViewProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  status: string
  avatar_url?: string
  created_at: string
  last_login_at?: string
}

interface IntegratedUserData {
  user: UserProfile
  assigned_sites: unknown[]
  daily_reports: unknown[]
  worker_assignments: unknown[]
  documents: Record<string, any[]>
  statistics: {
    total_sites: number
    total_reports: number
    total_assignments: number
    total_documents: number
  }
}

export default function UnifiedUserView({ userId, isOpen, onClose }: UnifiedUserViewProps) {
  const [data, setData] = useState<IntegratedUserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchIntegratedData()
    }
  }, [userId, isOpen])

  const fetchIntegratedData = async () => {
    setLoading(true)
    setError(null)

    try {
      // This is a placeholder API endpoint - would need to be implemented
      const response = await fetch(`/api/admin/users/${userId}/integrated`)
      if (!response.ok) {
        throw new Error('Failed to fetch integrated user data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.')
      console.error('Error fetching integrated user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자'
      case 'site_manager':
        return '현장 담당자'
      case 'worker':
        return '작업자'
      case 'client':
        return '고객'
      default:
        return role
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">정지</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <span>사용자 통합 보기</span>
              {data?.user && getStatusBadge(data.user.status)}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : data ? (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="sites">담당 현장</TabsTrigger>
                <TabsTrigger value="reports">작업일지</TabsTrigger>
                <TabsTrigger value="assignments">작업 배정</TabsTrigger>
                <TabsTrigger value="documents">문서</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 overflow-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {data.user.avatar_url ? (
                        <img
                          src={data.user.avatar_url}
                          alt={data.user.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">{data.user.full_name}</h3>
                        <p className="text-gray-600">{getRoleLabel(data.user.role)}</p>
                        {getStatusBadge(data.user.status)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{data.user.email}</span>
                      </div>
                      {data.user.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{data.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          가입일: {new Date(data.user.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {data.user.last_login_at && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            최근 로그인:{' '}
                            {new Date(data.user.last_login_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Summary */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      활동 요약
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {data.statistics.total_sites}
                        </div>
                        <div className="text-sm text-gray-600">담당 현장</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {data.statistics.total_reports}
                        </div>
                        <div className="text-sm text-gray-600">작성 일지</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {data.statistics.total_assignments}
                        </div>
                        <div className="text-sm text-gray-600">작업 배정</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {data.statistics.total_documents}
                        </div>
                        <div className="text-sm text-gray-600">업로드 문서</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">최근 활동</h3>
                  <div className="space-y-3">
                    {data.daily_reports.slice(0, 5).map((report, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">작업일지 작성</p>
                            <p className="text-xs text-gray-600">
                              {report.work_date} • {report.member_name}
                            </p>
                          </div>
                        </div>
                        <Badge variant={report.status === 'submitted' ? 'default' : 'secondary'}>
                          {report.status === 'submitted' ? '제출됨' : '임시'}
                        </Badge>
                      </div>
                    ))}
                    {data.daily_reports.length === 0 && (
                      <p className="text-center text-gray-500 py-4">최근 활동이 없습니다.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Sites Tab */}
              <TabsContent value="sites" className="flex-1 overflow-auto">
                {data.assigned_sites && data.assigned_sites.length > 0 ? (
                  <div className="space-y-4">
                    {data.assigned_sites.map((site, index) => (
                      <div key={index} className="bg-white rounded-lg border p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <div>
                              <h3 className="font-semibold">{site.name}</h3>
                              <p className="text-sm text-gray-600">{site.address}</p>
                            </div>
                          </div>
                          <Badge
                            className={
                              site.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : site.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {site.status === 'active'
                              ? '진행중'
                              : site.status === 'completed'
                                ? '완료'
                                : '비활성'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">시작일: </span>
                            <span>{site.start_date}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">종료일: </span>
                            <span>{site.end_date || '진행중'}</span>
                          </div>
                          {site.assignment_role && (
                            <div>
                              <span className="text-gray-600">역할: </span>
                              <span>{site.assignment_role}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>담당하는 현장이 없습니다.</p>
                  </div>
                )}
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="flex-1 overflow-auto">
                {data.daily_reports && data.daily_reports.length > 0 ? (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">작성한 작업일지</h3>
                    </div>
                    <div className="divide-y">
                      {data.daily_reports.map((report, index) => (
                        <div key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{report.work_date}</p>
                                <p className="text-sm text-gray-600">
                                  {report.member_name} • {report.process_type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={report.status === 'submitted' ? 'default' : 'secondary'}
                              >
                                {report.status === 'submitted' ? '제출됨' : '임시'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {report.total_workers}명
                              </span>
                            </div>
                          </div>
                          {report.site_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>{report.site_name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>작성한 작업일지가 없습니다.</p>
                  </div>
                )}
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="flex-1 overflow-auto">
                {data.worker_assignments && data.worker_assignments.length > 0 ? (
                  <div className="space-y-4">
                    {data.worker_assignments.map((assignment, index) => (
                      <div key={index} className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="font-medium">{assignment.site_name}</p>
                              <p className="text-sm text-gray-600">{assignment.work_date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{assignment.trade_type || '일반'}</Badge>
                            <Badge variant="outline">{assignment.skill_level || '견습'}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">출근 여부: </span>
                            <span
                              className={assignment.is_present ? 'text-green-600' : 'text-red-600'}
                            >
                              {assignment.is_present ? '출근' : '결근'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">근무시간: </span>
                            <span>{assignment.labor_hours || 0}시간</span>
                          </div>
                          <div>
                            <span className="text-gray-600">연장시간: </span>
                            <span>{assignment.overtime_hours || 0}시간</span>
                          </div>
                          <div>
                            <span className="text-gray-600">시급: </span>
                            <span>
                              {assignment.hourly_rate
                                ? `${assignment.hourly_rate.toLocaleString()}원`
                                : '미지정'}
                            </span>
                          </div>
                        </div>
                        {assignment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-600">메모: </span>
                            {assignment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>작업 배정 내역이 없습니다.</p>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {Object.entries(data.documents || {}).map(([type, docs]) => (
                    <div key={type} className="bg-white rounded-lg border">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold capitalize">
                            {type === 'photo'
                              ? '사진'
                              : type === 'receipt'
                                ? '영수증'
                                : type === 'document'
                                  ? '문서'
                                  : type}
                          </h3>
                          <Badge variant="outline">{docs.length}개</Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        {docs.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {docs.map((doc, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {doc.title || doc.file_name}
                                  </h4>
                                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                {doc.description && (
                                  <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                                )}
                                <div className="text-xs text-gray-500">
                                  {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {type} 문서가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {Object.keys(data.documents || {}).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>업로드한 문서가 없습니다.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
