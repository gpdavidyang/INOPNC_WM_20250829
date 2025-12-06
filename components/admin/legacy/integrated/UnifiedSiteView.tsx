'use client'

interface UnifiedSiteViewProps {
  siteId: string
}

interface IntegratedSiteData {
  site: unknown
  customers: unknown[]
  primary_customer: unknown
  daily_reports: unknown[]
  documents: Record<string, any[]>
  documents_by_category: Record<string, any[]>
  statistics: unknown
  recent_activities: unknown[]
  assigned_workers: unknown[]
  document_counts: Record<string, number>
  document_category_counts: Record<string, number>
}

export default function UnifiedSiteView({ siteId }: UnifiedSiteViewProps) {
  const [data, setData] = useState<IntegratedSiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchIntegratedData()
  }, [siteId])

  const fetchIntegratedData = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/integrated`)
      if (response.ok) {
        const integratedData = await response.json()
        setData(integratedData)
      }
    } catch (error) {
      console.error('Error fetching integrated site data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>
  }

  const tabs = [
    { id: 'overview', label: '개요', icon: Building2 },
    { id: 'reports', label: '작업일지', icon: FileText, count: data.daily_reports.length },
    { id: 'workers', label: '작업자', icon: Users, count: data.assigned_workers.length },
    {
      id: 'documents',
      label: '문서',
      icon: Image,
      count: data.document_category_counts
        ? Object.values(data.document_category_counts).reduce((sum, count) => sum + count, 0)
        : Object.values(data.document_counts).reduce((sum, count) => sum + count, 0),
    },
    { id: 'customers', label: '고객사', icon: Briefcase, count: data.customers.length },
  ]

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: unknown) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-50 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.site.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {data.site.address}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(data.site.start_date), 'yyyy.MM.dd', { locale: ko })}
                </div>
              </div>
              {data.primary_customer && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">발주사:</span>
                  <span className="ml-1 font-medium text-blue-600">
                    {data.primary_customer.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/admin/sites/${siteId}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              편집
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="총 작업일지"
          value={data.statistics.total_reports}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="투입 작업자"
          value={data.statistics.total_workers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="업로드 문서"
          value={data.statistics.total_documents}
          icon={Image}
          color="purple"
        />
        <StatCard title="고객사" value={data.customers.length} icon={Briefcase} color="orange" />
      </div>

      {/* Document Category Statistics (Admin View) */}
      {data.document_category_counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="공유문서함"
            value={data.statistics.shared_documents || data.document_category_counts.shared || 0}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="도면마킹문서함"
            value={data.statistics.markup_documents || data.document_category_counts.markup || 0}
            icon={Image}
            color="purple"
          />
          <StatCard
            title="필수제출서류함"
            value={
              data.statistics.required_documents || data.document_category_counts.required || 0
            }
            icon={Shield}
            color="green"
          />
          <StatCard
            title="기성청구문서함"
            value={data.statistics.invoice_documents || data.document_category_counts.invoice || 0}
            icon={Package}
            color="orange"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Site Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">현장 정보</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현장관리자:</span>
                      <span className="font-medium">{data.site.manager_name || '미지정'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">안전관리자:</span>
                      <span className="font-medium">
                        {data.site.safety_manager_name || '미지정'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">상태:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          data.site.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {data.site.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
                  <div className="space-y-3">
                    {data.recent_activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(activity.work_date), 'MM/dd')} -{' '}
                              {activity.member_name}
                            </p>
                            <p className="text-xs text-gray-500">{activity.process_type}</p>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/admin/daily-reports/${activity.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">작업일지 목록</h3>
                <Link
                  href={`/dashboard/admin/daily-reports/new?site_id=${siteId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />새 작업일지
                </Link>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업책임자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공정
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        인원
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.daily_reports.map(report => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(report.work_date), 'yyyy.MM.dd', { locale: ko })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.member_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.process_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.total_workers}명
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === 'submitted'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.status === 'submitted' ? '제출됨' : '임시'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/admin/daily-reports/${report.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/dashboard/admin/daily-reports/${report.id}/edit`}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">투입 작업자 현황</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.assigned_workers.map(worker => (
                  <div key={worker.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{worker.full_name}</h4>
                        <p className="text-sm text-gray-600">{worker.role}</p>
                        <p className="text-xs text-gray-500">
                          {worker.latest_trade_type} · {worker.latest_skill_level}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {worker.assignment_count}회
                        </p>
                        <p className="text-xs text-gray-500">참여</p>
                      </div>
                    </div>
                    {worker.phone && (
                      <div className="mt-2 flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        {worker.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">문서함 통합 관리</h3>

              {/* Document Category Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-900">
                    {data.document_category_counts?.shared || 0}
                  </p>
                  <p className="text-sm text-blue-700">공유문서함</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-900">
                    {data.document_category_counts?.markup || 0}
                  </p>
                  <p className="text-sm text-purple-700">도면마킹문서함</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-2xl font-bold text-green-900">
                    {data.document_category_counts?.required || 0}
                  </p>
                  <p className="text-sm text-green-700">필수제출서류함</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                  <p className="text-2xl font-bold text-orange-900">
                    {data.document_category_counts?.invoice || 0}
                  </p>
                  <p className="text-sm text-orange-700">기성청구문서함</p>
                </div>
              </div>

              {/* Document Categories */}
              {data.documents_by_category &&
                Object.entries(data.documents_by_category).map(([category, docs]) => {
                  const categoryConfig = {
                    shared: {
                      name: '공유문서함',
                      color: 'blue',
                      description: '현장 관련 모든 사용자가 접근 가능',
                    },
                    markup: {
                      name: '도면마킹문서함',
                      color: 'purple',
                      description: '현장별 도면 및 마킹 자료',
                    },
                    required: {
                      name: '필수제출서류함',
                      color: 'green',
                      description: '작업자-현장관리자-본사관리자 공유',
                    },
                    invoice: {
                      name: '기성청구문서함',
                      color: 'orange',
                      description: '파트너사-본사관리자 공유',
                    },
                  }
                  const config = categoryConfig[category as keyof typeof categoryConfig] || {
                    name: category,
                    color: 'gray',
                    description: '',
                  }

                  return (
                    <div key={category} className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className={`font-semibold text-lg text-${config.color}-900`}>
                            {config.name} ({docs.length})
                          </h4>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                        <Shield className={`h-5 w-5 text-${config.color}-600`} />
                      </div>

                      <div
                        className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-${config.color}-50 rounded-lg border border-${config.color}-200`}
                      >
                        {docs.slice(0, 12).map(doc => (
                          <div
                            key={doc.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded mb-2">
                              {doc.document_type === 'photo' ? (
                                <img
                                  src={doc.file_url}
                                  alt={doc.title || doc.file_name}
                                  className="w-full h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-16 flex items-center justify-center">
                                  <FileText className={`h-8 w-8 text-${config.color}-500`} />
                                </div>
                              )}
                            </div>
                            <p
                              className="text-xs text-gray-900 font-medium truncate"
                              title={doc.title || doc.file_name}
                            >
                              {doc.title || doc.file_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                            {doc.profiles?.full_name && (
                              <p className="text-xs text-gray-400 mt-1">
                                업로더: {doc.profiles.full_name}
                              </p>
                            )}
                          </div>
                        ))}
                        {docs.length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>등록된 문서가 없습니다</p>
                          </div>
                        )}
                      </div>

                      {docs.length > 12 && (
                        <div className="text-center mt-4">
                          <button
                            className={`text-${config.color}-600 hover:text-${config.color}-800 text-sm font-medium`}
                          >
                            {docs.length - 12}개 더 보기 →
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Legacy Documents (for backward compatibility) */}
              {data.documents && Object.keys(data.documents).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4">기타 문서 (분류되지 않음)</h4>
                  {Object.entries(data.documents).map(([type, docs]) => (
                    <div key={type} className="mb-6">
                      <h5 className="font-medium text-gray-600 mb-3 capitalize">
                        {type} ({docs.length})
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {docs.slice(0, 6).map(doc => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg p-2">
                            <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded mb-2">
                              {doc.document_type === 'photo' ? (
                                <img
                                  src={doc.file_url}
                                  alt={doc.title || doc.file_name}
                                  className="w-full h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-16 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">고객사 정보</h3>
              <div className="space-y-4">
                {data.customers.map(customer => (
                  <div key={customer.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            customer.is_primary_customer ? 'bg-blue-50' : 'bg-gray-100'
                          }`}
                        >
                          <Briefcase
                            className={`h-6 w-6 ${
                              customer.is_primary_customer ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{customer.name}</h4>
                            {customer.is_primary_customer && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                주 발주사
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {customer.relationship_type} · {customer.company_type}
                          </p>
                          {customer.contact_person && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                담당자: {customer.contact_person}
                              </div>
                              {customer.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-4 w-4 mr-2" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {customer.contract_amount && (
                          <p className="text-lg font-bold text-gray-900">
                            {(customer.contract_amount / 100000000).toLocaleString()}억원
                          </p>
                        )}
                        {customer.contract_start_date && customer.contract_end_date && (
                          <p className="text-sm text-gray-600">
                            {format(new Date(customer.contract_start_date), 'yyyy.MM.dd')} ~
                            {format(new Date(customer.contract_end_date), 'yyyy.MM.dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
