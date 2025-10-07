'use client'

interface Organization {
  id: string
  name: string
  type: string
  description?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  profiles?: Array<{
    id: string
    full_name: string
    email: string
    phone?: string
    role: string
  }>
}

export default function OrganizationPartnerList() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const supabase = createClient()

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('organizations')
        .select(
          `
          *,
          profiles (
            id,
            full_name,
            email,
            phone,
            role
          )
        `
        )
        .eq('type', 'branch_office') // Only show organizations (legacy)

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
        )
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      setOrganizations(data || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [searchTerm, statusFilter])

  const handleToggleStatus = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !org.is_active })
        .eq('id', org.id)

      if (error) throw error

      await loadOrganizations()
    } catch (error) {
      console.error('Failed to update organization status:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm('정말로 이 시공업체를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase.from('organizations').delete().eq('id', orgId)

      if (error) throw error

      await loadOrganizations()
    } catch (error) {
      console.error('Failed to delete organization:', error)
      alert('시공업체 삭제에 실패했습니다.')
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        활성
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <XCircle className="h-3 w-3 mr-1" />
        비활성
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">시공업체 관리</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            협력업체(시공업체)를 관리합니다
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
          <Plus className="h-4 w-4 mr-2" />새 시공업체 등록
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="회사명, 설명, 주소로 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">시공업체 목록</h3>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium">카드</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="text-sm font-medium">리스트</span>
            </button>
          </div>
        </div>
      </div>

      {/* Organizations Display */}
      {loading ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="animate-pulse">
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : organizations.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {searchTerm || statusFilter !== 'all'
              ? '검색 결과가 없습니다'
              : '등록된 시공업체가 없습니다'}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all'
              ? '다른 검색 조건을 시도해보세요'
              : '새 시공업체를 등록해보세요'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        // List View (Table)
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  시공업체명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {organizations.map(org => (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </div>
                        {org.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {org.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(org.is_active)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {org.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                        {org.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {org.profiles && org.profiles.length > 0 ? (
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {org.profiles[0].full_name}
                        </div>
                        {org.profiles[0].email && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {org.profiles[0].email}
                          </div>
                        )}
                        {org.profiles.length > 1 && (
                          <div className="text-xs text-gray-400">
                            외 {org.profiles.length - 1}명
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">담당자 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {org.address || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(org)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {org.is_active ? '비활성화' : '활성화'}
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Card View (existing implementation)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map(org => (
            <div
              key={org.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                    {org.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {org.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(org.is_active)}</div>
              </div>

              <div className="space-y-2">
                {org.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{org.address}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {org.phone}
                  </div>
                )}
                {org.profiles && org.profiles.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    담당자: {org.profiles.length}명
                  </div>
                )}
              </div>

              {/* Contact Persons */}
              {org.profiles && org.profiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    담당자
                  </p>
                  <div className="space-y-1">
                    {org.profiles.slice(0, 2).map(profile => (
                      <div key={profile.id} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{profile.full_name}</span>
                        {profile.email && (
                          <span className="block text-gray-500">{profile.email}</span>
                        )}
                      </div>
                    ))}
                    {org.profiles.length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        외 {org.profiles.length - 2}명
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={() => handleToggleStatus(org)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {org.is_active ? '비활성화' : '활성화'}
                </button>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Edit className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && organizations.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {organizations.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 시공업체</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {organizations.filter(o => o.is_active).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">활성 시공업체</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">
                {organizations.filter(o => !o.is_active).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">비활성 시공업체</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
