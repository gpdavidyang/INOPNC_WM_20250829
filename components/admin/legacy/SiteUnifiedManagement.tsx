'use client'

import AssignWorkerModal from './modals/AssignWorkerModal'

interface SiteUnifiedManagementProps {
  site: Site
  onBack: () => void
  onSiteUpdate: (updatedSite: Site) => void
  onRefresh: () => void
}

interface SiteUnifiedManagementState {
  activeTab: 'info' | 'edit' | 'workers'
  assignments: SiteAssignment[]
  availableUsers: Profile[]
  isLoading: boolean
}

export default function SiteUnifiedManagement({
  site,
  onBack,
  onSiteUpdate,
  onRefresh,
}: SiteUnifiedManagementProps) {
  const [state, setState] = useState<SiteUnifiedManagementState>({
    activeTab: 'info',
    assignments: [],
    availableUsers: [],
    isLoading: false,
  })

  const updateState = (updates: Partial<SiteUnifiedManagementState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Load site assignments when switching to workers tab
  const loadSiteAssignments = async () => {
    if (state.activeTab !== 'workers') return

    updateState({ isLoading: true })
    try {
      const result = await getSiteAssignments(site.id)
      if (result.success) {
        updateState({ assignments: result.data || [] })
      } else {
        toast({
          title: '오류',
          description: result.error || '현장 배정 정보를 불러오지 못했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading site assignments:', error)
      toast({
        title: '오류',
        description: '현장 배정 정보를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Handle tab changes
  const handleTabChange = (value: string) => {
    const tabValue = value as 'info' | 'edit' | 'workers'
    updateState({ activeTab: tabValue })
  }

  // Load assignments when tab changes to workers
  useEffect(() => {
    if (state.activeTab === 'workers') {
      loadSiteAssignments()
    }
  }, [state.activeTab])

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            현장 목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              site.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : site.status === 'inactive'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}
          >
            {site.status === 'active' ? '활성' : site.status === 'inactive' ? '비활성' : '완료'}
          </span>
        </div>
      </div>

      {/* Main content with tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={state.activeTab}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              현장 정보
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              정보 수정
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              작업자 배정
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="info" className="h-full mt-0">
              <SiteInfoTab site={site} onRefresh={onRefresh} />
            </TabsContent>

            <TabsContent value="edit" className="h-full mt-0">
              <SiteEditTab site={site} onSiteUpdate={onSiteUpdate} onRefresh={onRefresh} />
            </TabsContent>

            <TabsContent value="workers" className="h-full mt-0">
              <WorkerAssignmentTab
                site={site}
                assignments={state.assignments}
                availableUsers={state.availableUsers}
                isLoading={state.isLoading}
                onRefresh={loadSiteAssignments}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Site Info Tab - Read-only table layout
function SiteInfoTab({ site, onRefresh }: { site: Site; onRefresh: () => void }) {
  return (
    <div className="p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* All Information in Single Comprehensive Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Section: 기본 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    기본 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 w-1/6">
                  현장명
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white w-1/3">
                  {site.name}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 w-1/6">
                  상태
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white w-1/3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      site.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : site.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {site.status === 'active'
                      ? '활성'
                      : site.status === 'inactive'
                        ? '비활성'
                        : '완료'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  주소
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white" colSpan={3}>
                  {site.address}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  설명
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white" colSpan={3}>
                  {site.description || '-'}
                </td>
              </tr>

              {/* Section: 일정 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    일정 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  시작일
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  종료일
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : '-'}
                </td>
              </tr>

              {/* Section: 담당자 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    담당자 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  현장관리자
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.manager_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  연락처
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {(site as any).manager_phone || site.construction_manager_phone || '-'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  안전관리자
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.safety_manager_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  연락처
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.safety_manager_phone || '-'}
                </td>
              </tr>

              {/* Section: 숙소 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    숙소 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  숙소명
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.accommodation_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  숙소 주소
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.accommodation_address || '-'}
                </td>
              </tr>

              {/* Section: 작업 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    작업 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  부재명
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.component_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  작업공정
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.work_process || '-'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  작업구간
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white" colSpan={3}>
                  {site.work_section || '-'}
                </td>
              </tr>

              {/* Section: 시스템 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  시스템 정보
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  생성일
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.created_at ? new Date(site.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  수정일
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {site.updated_at ? new Date(site.updated_at).toLocaleDateString('ko-KR') : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Site Edit Tab - Editable table layout
function SiteEditTab({
  site,
  onSiteUpdate,
  onRefresh,
}: {
  site: Site
  onSiteUpdate: (site: Site) => void
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({
    name: site.name || '',
    address: site.address || '',
    description: site.description || '',
    status: site.status || 'active',
    start_date: site.start_date ? new Date(site.start_date).toISOString().split('T')[0] : '',
    end_date: site.end_date ? new Date(site.end_date).toISOString().split('T')[0] : '',
    manager_name: site.manager_name || '',
    construction_manager_phone:
      (site as any).manager_phone || site.construction_manager_phone || '',
    safety_manager_name: site.safety_manager_name || '',
    safety_manager_phone: site.safety_manager_phone || '',
    accommodation_name: site.accommodation_name || '',
    accommodation_address: site.accommodation_address || '',
    work_process: site.work_process || '',
    work_section: site.work_section || '',
    component_name: site.component_name || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update form data when site prop changes
  useEffect(() => {
    setFormData({
      name: site.name || '',
      address: site.address || '',
      description: site.description || '',
      status: site.status || 'active',
      start_date: site.start_date ? new Date(site.start_date).toISOString().split('T')[0] : '',
      end_date: site.end_date ? new Date(site.end_date).toISOString().split('T')[0] : '',
      manager_name: site.manager_name || '',
      construction_manager_phone:
        (site as any).manager_phone || site.construction_manager_phone || '',
      safety_manager_name: site.safety_manager_name || '',
      safety_manager_phone: site.safety_manager_phone || '',
      accommodation_name: site.accommodation_name || '',
      accommodation_address: site.accommodation_address || '',
      work_process: site.work_process || '',
      work_section: site.work_section || '',
      component_name: site.component_name || '',
    })
    setHasChanges(false)
  }, [site])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.start_date) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const updateData = {
        id: site.id,
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        status: formData.status as unknown,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        manager_name: formData.manager_name || null,
        construction_manager_phone: formData.construction_manager_phone || null,
        safety_manager_name: formData.safety_manager_name || null,
        safety_manager_phone: formData.safety_manager_phone || null,
        accommodation_name: formData.accommodation_name || null,
        accommodation_address: formData.accommodation_address || null,
        work_process: formData.work_process || null,
        work_section: formData.work_section || null,
        component_name: formData.component_name || null,
      }

      const result = await updateSite(updateData)

      if (result.success && result.data) {
        toast({
          title: '성공',
          description: '현장 정보가 성공적으로 업데이트되었습니다.',
        })
        onSiteUpdate(result.data)
        setHasChanges(false)
        onRefresh()
      } else {
        toast({
          title: '오류',
          description: result.error || '현장 정보 업데이트에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: '오류',
        description: '현장 정보 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: site.name || '',
      address: site.address || '',
      description: site.description || '',
      status: site.status || 'active',
      start_date: site.start_date ? new Date(site.start_date).toISOString().split('T')[0] : '',
      end_date: site.end_date ? new Date(site.end_date).toISOString().split('T')[0] : '',
      manager_name: site.manager_name || '',
      construction_manager_phone: site.construction_manager_phone || '',
      safety_manager_name: site.safety_manager_name || '',
      safety_manager_phone: site.safety_manager_phone || '',
      accommodation_name: site.accommodation_name || '',
      accommodation_address: site.accommodation_address || '',
      work_process: site.work_process || '',
      work_section: site.work_section || '',
      component_name: site.component_name || '',
    })
    setHasChanges(false)
  }

  return (
    <div className="p-6 overflow-auto">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        {/* All Information in Single Comprehensive Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Section: 기본 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    기본 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 w-1/6">
                  현장명 <span className="text-red-500">*</span>
                </td>
                <td className="px-6 py-4 w-1/3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 w-1/6">
                  상태
                </td>
                <td className="px-6 py-4 w-1/3">
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="completed">완료</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  주소 <span className="text-red-500">*</span>
                </td>
                <td className="px-6 py-4" colSpan={3}>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  설명
                </td>
                <td className="px-6 py-4" colSpan={3}>
                  <textarea
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </td>
              </tr>

              {/* Section: 일정 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    일정 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  시작일 <span className="text-red-500">*</span>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  종료일
                </td>
                <td className="px-6 py-4">
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => handleInputChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </td>
              </tr>

              {/* Section: 담당자 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    담당자 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  현장관리자
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={e => handleInputChange('manager_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="이름"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  연락처
                </td>
                <td className="px-6 py-4">
                  <input
                    type="tel"
                    value={formData.construction_manager_phone}
                    onChange={e => handleInputChange('construction_manager_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="010-0000-0000"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  안전관리자
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.safety_manager_name}
                    onChange={e => handleInputChange('safety_manager_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="이름"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  연락처
                </td>
                <td className="px-6 py-4">
                  <input
                    type="tel"
                    value={formData.safety_manager_phone}
                    onChange={e => handleInputChange('safety_manager_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="010-0000-0000"
                  />
                </td>
              </tr>

              {/* Section: 숙소 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    숙소 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  숙소명
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.accommodation_name}
                    onChange={e => handleInputChange('accommodation_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="숙소명"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  숙소 주소
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.accommodation_address}
                    onChange={e => handleInputChange('accommodation_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="숙소 주소"
                  />
                </td>
              </tr>

              {/* Section: 작업 정보 */}
              <tr className="bg-gray-50 dark:bg-gray-900">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    작업 정보
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  부재명
                </td>
                <td className="px-6 py-4">
                  <div>
                    <CustomSelect
                      value={
                        formData.component_name?.startsWith('기타:')
                          ? '기타'
                          : formData.component_name || 'none'
                      }
                      onValueChange={value => {
                        if (value === '기타') {
                          handleInputChange('component_name', '기타:')
                        } else if (value === 'none') {
                          handleInputChange('component_name', '')
                        } else {
                          handleInputChange('component_name', value)
                        }
                      }}
                    >
                      <CustomSelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                        <CustomSelectValue placeholder="선택하세요" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white border border-gray-300">
                        <CustomSelectItem value="none">없음</CustomSelectItem>
                        <CustomSelectItem value="슬라브">슬라브</CustomSelectItem>
                        <CustomSelectItem value="거더">거더</CustomSelectItem>
                        <CustomSelectItem value="기둥">기둥</CustomSelectItem>
                        <CustomSelectItem value="기타">기타</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                    {formData.component_name?.startsWith('기타') && (
                      <input
                        type="text"
                        value={formData.component_name.replace('기타:', '')}
                        onChange={e =>
                          handleInputChange('component_name', '기타:' + e.target.value)
                        }
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        placeholder="기타 부재명 입력"
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  작업공정
                </td>
                <td className="px-6 py-4">
                  <div>
                    <CustomSelect
                      value={
                        formData.work_process?.startsWith('기타:')
                          ? '기타'
                          : formData.work_process || 'none'
                      }
                      onValueChange={value => {
                        if (value === '기타') {
                          handleInputChange('work_process', '기타:')
                        } else if (value === 'none') {
                          handleInputChange('work_process', '')
                        } else {
                          handleInputChange('work_process', value)
                        }
                      }}
                    >
                      <CustomSelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                        <CustomSelectValue placeholder="선택하세요" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white border border-gray-300">
                        <CustomSelectItem value="none">없음</CustomSelectItem>
                        <CustomSelectItem value="균일">균일</CustomSelectItem>
                        <CustomSelectItem value="면">면</CustomSelectItem>
                        <CustomSelectItem value="마감">마감</CustomSelectItem>
                        <CustomSelectItem value="기타">기타</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                    {formData.work_process?.startsWith('기타') && (
                      <input
                        type="text"
                        value={formData.work_process.replace('기타:', '')}
                        onChange={e => handleInputChange('work_process', '기타:' + e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        placeholder="기타 작업공정 입력"
                      />
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                  작업구간
                </td>
                <td className="px-6 py-4" colSpan={3}>
                  <input
                    type="text"
                    value={formData.work_section}
                    onChange={e => handleInputChange('work_section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="예: A동"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            초기화
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? '저장 중...' : '변경사항 저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Worker Assignment Tab
function WorkerAssignmentTab({
  site,
  assignments,
  availableUsers,
  isLoading,
  onRefresh,
}: {
  site: Site
  assignments: SiteAssignment[]
  availableUsers: Profile[]
  isLoading: boolean
  onRefresh: () => void
}) {
  const [showAssignModal, setShowAssignModal] = useState(false)

  const handleAssignmentSuccess = () => {
    setShowAssignModal(false)
    onRefresh()
  }

  const handleRemoveAssignment = async (userId: string) => {
    if (!confirm('정말로 이 작업자를 현장에서 해제하시겠습니까?')) {
      return
    }

    try {
      const { removeUserFromSite } = await import('@/app/actions/admin/sites')
      const result = await removeUserFromSite(site.id, userId)

      if (result.success) {
        toast({
          title: '성공',
          description: '작업자가 현장에서 해제되었습니다.',
        })
        onRefresh()
      } else {
        toast({
          title: '오류',
          description: result.error || '작업자 해제에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      toast({
        title: '오류',
        description: '작업자 해제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">배정된 작업자</h2>
        <Button onClick={() => setShowAssignModal(true)}>
          <Users className="h-4 w-4 mr-2" />
          작업자 배정
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">작업자 정보를 불러오는 중...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">배정된 작업자가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div>
                <p className="font-medium">{assignment.profile?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.role === 'worker'
                    ? '작업자'
                    : assignment.role === 'site_manager'
                      ? '현장관리자'
                      : '감독관'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveAssignment(assignment.user_id)}
              >
                해제
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && (
        <AssignWorkerModal
          siteId={site.id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  )
}
