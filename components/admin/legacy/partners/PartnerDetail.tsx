'use client'


interface Partner {
  id: string
  company_name: string
  business_number?: string
  company_type: 'general_contractor' | 'subcontractor' | 'supplier' | 'consultant'
  trade_type?: string[]
  representative_name?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  bank_name?: string
  bank_account?: string
  credit_rating?: string
  contract_start_date?: string
  contract_end_date?: string
  status: 'active' | 'suspended' | 'terminated'
  notes?: string
  created_at: string
  updated_at: string
}

interface Site {
  id: string
  name: string
  address: string
  contract_amount?: number
  work_scope?: string
  start_date: string
  end_date?: string
  status: string
}

interface PartnerDetailProps {
  partner: Partner
  profile: Profile
  onEdit: (partner: Partner) => void
  onClose: () => void
}

export default function PartnerDetail({ partner, profile, onEdit, onClose }: PartnerDetailProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'sites' | 'contracts'>('info')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPartnerSites()
  }, [partner.id])

  const loadPartnerSites = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_partners')
        .select(`
          contract_amount,
          work_scope,
          start_date,
          end_date,
          status,
          sites (
            id,
            name,
            address
          )
        `)
        .eq('partner_company_id', partner.id)
        .order('start_date', { ascending: false })

      if (error) throw error

      const formattedSites = data?.map(item => ({
        id: item.sites.id,
        name: item.sites.name,
        address: item.sites.address,
        contract_amount: item.contract_amount,
        work_scope: item.work_scope,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status
      })) || []

      setSites(formattedSites)
    } catch (error) {
      console.error('Failed to load partner sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompanyTypeLabel = (type: string) => {
    const typeLabels = {
      general_contractor: '종합건설업',
      subcontractor: '전문건설업',
      supplier: '자재공급업체',
      consultant: '설계/감리'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      suspended: { label: '중단', className: 'bg-yellow-100 text-yellow-800' },
      terminated: { label: '종료', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const tabs = [
    { id: 'info', label: '기본 정보', icon: Building2 },
    { id: 'sites', label: '배정 현장', icon: MapPin },
    { id: 'contracts', label: '계약 정보', icon: FileText }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {partner.company_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getCompanyTypeLabel(partner.company_type)}
              </span>
              {getStatusBadge(partner.status)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(partner)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            수정
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sites.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">배정 현장</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sites.reduce((sum, site) => sum + (site.contract_amount || 0), 0) > 0
                  ? formatCurrency(sites.reduce((sum, site) => sum + (site.contract_amount || 0), 0))
                  : '-'
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 계약금액</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(partner.contract_start_date)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">계약 시작일</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {partner.trade_type?.length || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">전문 분야</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as unknown)}
                  className={`flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
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

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      회사명
                    </label>
                    <p className="text-gray-900 dark:text-white">{partner.company_name}</p>
                  </div>
                  {partner.business_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        사업자번호
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.business_number}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      회사 구분
                    </label>
                    <p className="text-gray-900 dark:text-white">{getCompanyTypeLabel(partner.company_type)}</p>
                  </div>
                  {partner.representative_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        대표자명
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.representative_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 연락처 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">연락처 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {partner.contact_person && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        담당자명
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.contact_person}</p>
                    </div>
                  )}
                  {partner.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        연락처
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.phone}</p>
                    </div>
                  )}
                  {partner.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        이메일
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.email}</p>
                    </div>
                  )}
                  {partner.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        주소
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 전문 분야 */}
              {partner.trade_type && partner.trade_type.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">전문 분야</h3>
                  <div className="flex flex-wrap gap-2">
                    {partner.trade_type.map((trade, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 메모 */}
              {partner.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">메모</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{partner.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">배정 현장 ({sites.length})</h3>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  현장 배정
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : sites.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    배정된 현장이 없습니다
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    현장을 배정하여 작업을 시작하세요
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sites.map((site) => (
                    <div key={site.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{site.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{site.address}</p>
                          {site.work_scope && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              작업 범위: {site.work_scope}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          {getStatusBadge(site.status)}
                          {site.contract_amount && (
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {formatCurrency(site.contract_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>시작일: {formatDate(site.start_date)}</span>
                        {site.end_date && (
                          <span>종료일: {formatDate(site.end_date)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6">
              {/* 금융 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">금융 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {partner.bank_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        은행명
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.bank_name}</p>
                    </div>
                  )}
                  {partner.bank_account && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        계좌번호
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.bank_account}</p>
                    </div>
                  )}
                  {partner.credit_rating && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        신용등급
                      </label>
                      <p className="text-gray-900 dark:text-white">{partner.credit_rating}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 계약 기간 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">계약 기간</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      계약 시작일
                    </label>
                    <p className="text-gray-900 dark:text-white">{formatDate(partner.contract_start_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      계약 종료일
                    </label>
                    <p className="text-gray-900 dark:text-white">{formatDate(partner.contract_end_date)}</p>
                  </div>
                </div>
              </div>

              {/* 현장별 계약 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">현장별 계약 정보</h3>
                {sites.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">계약 정보가 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            현장명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            계약금액
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            작업범위
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            기간
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sites.map((site) => (
                          <tr key={site.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {site.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(site.contract_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {site.work_scope || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(site.start_date)} ~ {formatDate(site.end_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(site.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}