'use client'

import { useState, useEffect } from 'react'
import { Site, Profile, SiteAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Edit, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getSiteAssignments } from '@/app/actions/admin/sites'
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
  onRefresh
}: SiteUnifiedManagementProps) {
  const [state, setState] = useState<SiteUnifiedManagementState>({
    activeTab: 'info',
    assignments: [],
    availableUsers: [],
    isLoading: false
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
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading site assignments:', error)
      toast({
        title: '오류',
        description: '현장 배정 정보를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            현장 목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            site.status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : site.status === 'inactive'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
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
              <SiteInfoTab 
                site={site}
                onRefresh={onRefresh}
              />
            </TabsContent>

            <TabsContent value="edit" className="h-full mt-0">
              <SiteEditTab 
                site={site}
                onSiteUpdate={onSiteUpdate}
                onRefresh={onRefresh}
              />
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

// Placeholder components to be implemented in subsequent phases
function SiteInfoTab({ site, onRefresh }: { site: Site; onRefresh: () => void }) {
  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl">
        {/* Basic Site Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">현장명</label>
                <p className="text-sm mt-1 font-medium">{site.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">주소</label>
                <p className="text-sm mt-1">{site.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">상태</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    site.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : site.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {site.status === 'active' ? '활성' : site.status === 'inactive' ? '비활성' : '완료'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">시작일</label>
                <p className="text-sm mt-1">
                  {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">종료일</label>
                <p className="text-sm mt-1">
                  {site.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">생성일</label>
                <p className="text-sm mt-1">
                  {site.created_at ? new Date(site.created_at).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Management Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            관리자 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">현장관리자</label>
                <p className="text-sm mt-1 font-medium">{site.manager_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">건설관리자 연락처</label>
                <p className="text-sm mt-1">{site.construction_manager_phone || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">안전관리자</label>
                <p className="text-sm mt-1 font-medium">{site.safety_manager_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">안전관리자 연락처</label>
                <p className="text-sm mt-1">{site.safety_manager_phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            숙소 정보
          </h2>
          <div className="bg-card p-6 rounded-lg border space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">숙소명</label>
              <p className="text-sm mt-1 font-medium">{site.accommodation_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">숙소 주소</label>
              <p className="text-sm mt-1">{site.accommodation_address || '-'}</p>
            </div>
          </div>
        </div>

        {/* Work Information */}
        {(site.work_process || site.work_section || site.component_name) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              작업 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card p-6 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-muted-foreground">부재명</label>
                <p className="text-sm mt-1">{site.component_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">작업공정</label>
                <p className="text-sm mt-1">{site.work_process || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">작업구간</label>
                <p className="text-sm mt-1">{site.work_section || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {site.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">설명</h2>
            <div className="bg-card p-6 rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{site.description}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onRefresh} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>
    </div>
  )
}

function SiteEditTab({ 
  site, 
  onSiteUpdate, 
  onRefresh 
}: { 
  site: Site; 
  onSiteUpdate: (site: Site) => void; 
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
    construction_manager_phone: site.construction_manager_phone || '',
    safety_manager_name: site.safety_manager_name || '',
    safety_manager_phone: site.safety_manager_phone || '',
    accommodation_name: site.accommodation_name || '',
    accommodation_address: site.accommodation_address || '',
    work_process: site.work_process || '',
    work_section: site.work_section || '',
    component_name: site.component_name || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false) // Start with no changes

  // Update form data when site prop changes (important for after successful update)
  useEffect(() => {
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
      component_name: site.component_name || ''
    })
    setHasChanges(false) // Reset changes flag when site data is updated
  }, [site])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.address || !formData.start_date) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { updateSite } = await import('@/app/actions/admin/sites')
      
      // Prepare update data - ensure empty strings are converted to null for optional fields
      const updateData = {
        id: site.id,
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        status: formData.status,
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
        component_name: formData.component_name || null
      }
      
      console.log('[SITE-UPDATE] Updating site with data:', updateData)
      
      const result = await updateSite(updateData)

      console.log('[SITE-UPDATE] Update result:', result)

      if (result.success && result.data) {
        console.log('[SITE-UPDATE] Update successful, refreshing data')
        
        // Update local state with the returned data
        onSiteUpdate(result.data)
        
        // Reset the form with new data
        setFormData({
          name: result.data.name || '',
          address: result.data.address || '',
          description: result.data.description || '',
          status: result.data.status || 'active',
          start_date: result.data.start_date ? new Date(result.data.start_date).toISOString().split('T')[0] : '',
          end_date: result.data.end_date ? new Date(result.data.end_date).toISOString().split('T')[0] : '',
          manager_name: result.data.manager_name || '',
          construction_manager_phone: result.data.construction_manager_phone || '',
          safety_manager_name: result.data.safety_manager_name || '',
          safety_manager_phone: result.data.safety_manager_phone || '',
          accommodation_name: result.data.accommodation_name || '',
          accommodation_address: result.data.accommodation_address || '',
          work_process: result.data.work_process || '',
          work_section: result.data.work_section || '',
          component_name: result.data.component_name || ''
        })
        
        setHasChanges(false)
        
        // Trigger parent refresh to update the list
        onRefresh()
        
        toast({
          title: '성공',
          description: result.message || '현장 정보가 성공적으로 업데이트되었습니다.',
          variant: 'default'
        })
      } else {
        console.error('[SITE-UPDATE] Update failed:', result.error)
        toast({
          title: '오류',
          description: result.error || '현장 정보 업데이트에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('[SITE-UPDATE] Site update error:', error)
      toast({
        title: '오류',
        description: '현장 정보 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive'
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
      component_name: site.component_name || ''
    })
    setHasChanges(false)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            현장 정보 수정
          </h2>
          {hasChanges && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              변경사항 있음
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">현장명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">주소 *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">시작일 *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">종료일</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="현장에 대한 추가 설명을 입력하세요..."
                />
              </div>
            </div>
          </div>

          {/* Management Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              관리자 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">현장관리자</label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => handleInputChange('manager_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="현장관리자 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">건설관리자 연락처</label>
                <input
                  type="tel"
                  value={formData.construction_manager_phone}
                  onChange={(e) => handleInputChange('construction_manager_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">안전관리자</label>
                <input
                  type="text"
                  value={formData.safety_manager_name}
                  onChange={(e) => handleInputChange('safety_manager_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="안전관리자 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">안전관리자 연락처</label>
                <input
                  type="tel"
                  value={formData.safety_manager_phone}
                  onChange={(e) => handleInputChange('safety_manager_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
          </div>

          {/* Accommodation Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              숙소 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">숙소명</label>
                <input
                  type="text"
                  value={formData.accommodation_name}
                  onChange={(e) => handleInputChange('accommodation_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="숙소 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">숙소 주소</label>
                <input
                  type="text"
                  value={formData.accommodation_address}
                  onChange={(e) => handleInputChange('accommodation_address', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="숙소 주소"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              작업 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">부재명</label>
                <input
                  type="text"
                  value={formData.component_name}
                  onChange={(e) => handleInputChange('component_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="부재명"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">작업공정</label>
                <input
                  type="text"
                  value={formData.work_process}
                  onChange={(e) => handleInputChange('work_process', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="작업 공정"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">작업구간</label>
                <input
                  type="text"
                  value={formData.work_section}
                  onChange={(e) => handleInputChange('work_section', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="작업 구간"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isSubmitting}
            >
              초기화
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onRefresh}
              disabled={isSubmitting}
            >
              새로고침
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-24"
              onClick={(e) => {
                // Log for debugging
                console.log('Save button clicked', {
                  hasChanges,
                  isSubmitting,
                  formData
                })
                // Allow default form submission
              }}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkerAssignmentTab({ 
  site, 
  assignments, 
  availableUsers, 
  isLoading, 
  onRefresh 
}: { 
  site: Site; 
  assignments: SiteAssignment[]; 
  availableUsers: Profile[]; 
  isLoading: boolean; 
  onRefresh: () => void 
}) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<SiteAssignment | null>(null)
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false)
  
  const handleRemoveUser = async (assignment: SiteAssignment) => {
    if (!assignment.user_id) return
    
    try {
      const { removeUserFromSite } = await import('@/app/actions/admin/sites')
      const result = await removeUserFromSite(site.id, assignment.user_id)
      
      if (result.success) {
        toast({
          title: '성공',
          description: result.message || '사용자가 현장에서 해제되었습니다.',
          variant: 'default'
        })
        onRefresh()
      } else {
        toast({
          title: '오류',
          description: result.error || '사용자 해제에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Remove user error:', error)
      toast({
        title: '오류',
        description: '사용자 해제 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleRoleChange = async (assignment: SiteAssignment, newRole: string) => {
    if (!assignment.user_id) return
    
    try {
      const { updateSiteAssignmentRole } = await import('@/app/actions/admin/sites')
      const result = await updateSiteAssignmentRole(site.id, assignment.user_id, newRole)
      
      if (result.success) {
        toast({
          title: '성공',
          description: result.message || '사용자 역할이 변경되었습니다.',
          variant: 'default'
        })
        onRefresh()
        setIsRoleChangeModalOpen(false)
        setSelectedAssignment(null)
      } else {
        toast({
          title: '오류',
          description: result.error || '역할 변경에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Role change error:', error)
      toast({
        title: '오류',
        description: '역할 변경 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case 'worker': return '작업자'
      case 'site_manager': return '현장관리자'
      case 'supervisor': return '관리자'
      case 'customer_manager': return '파트너사 담당자'
      default: return role || '미정'
    }
  }

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case 'worker': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'site_manager': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'supervisor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'customer_manager': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              작업자 배정 관리
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              현장에 배정된 작업자를 관리하고 새로운 작업자를 배정할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRefresh} disabled={isLoading} size="sm" variant="outline">
              {isLoading ? (
                <>
                  <ArrowLeft className="h-4 w-4 animate-spin mr-2" />
                  로딩 중...
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  새로고침
                </>
              )}
            </Button>
            <Button onClick={() => setIsAssignModalOpen(true)} size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              작업자 배정
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">전체 배정자</span>
              </div>
              <p className="text-2xl font-bold mt-1">{assignments.length}명</p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">작업자</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {assignments.filter(a => a.role === 'worker').length}명
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">현장관리자</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {assignments.filter(a => a.role === 'site_manager').length}명
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">관리자</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {assignments.filter(a => a.role === 'supervisor').length}명
              </p>
            </div>
          </div>
        )}
        
        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowLeft className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">배정 정보를 불러오는 중...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">배정된 작업자가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              새로운 작업자를 배정하여 현장 관리를 시작하세요.
            </p>
            <Button onClick={() => setIsAssignModalOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              첫 번째 작업자 배정
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="flex items-center justify-between p-6 bg-card rounded-lg border hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {assignment.profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-lg">
                        {assignment.profile?.full_name || '이름 없음'}
                      </h4>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(assignment.role)}`}>
                        {getRoleLabel(assignment.role)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{assignment.profile?.email}</p>
                      {assignment.profile?.phone && (
                        <p>{assignment.profile.phone}</p>
                      )}
                      <div className="flex items-center gap-4">
                        {assignment.assigned_date && (
                          <span>배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setIsRoleChangeModalOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    역할 변경
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`${assignment.profile?.full_name || '사용자'}를 현장에서 해제하시겠습니까?`)) {
                        handleRemoveUser(assignment)
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    해제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assign Worker Modal */}
        {isAssignModalOpen && (
          <AssignWorkerModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            siteId={site.id}
            siteName={site.name}
            onSuccess={onRefresh}
          />
        )}

        {/* Role Change Modal */}
        {isRoleChangeModalOpen && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg border max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">역할 변경</h3>
              <p className="text-muted-foreground mb-4">
                <span className="font-medium">{selectedAssignment.profile?.full_name}</span>의 역할을 변경하세요.
              </p>
              <div className="space-y-2">
                {[
                  { value: 'worker', label: '작업자' },
                  { value: 'site_manager', label: '현장관리자' },
                  { value: 'supervisor', label: '관리자' }
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(selectedAssignment, role.value)}
                    className={`w-full text-left p-3 rounded-md border hover:bg-muted transition-colors ${
                      selectedAssignment.role === role.value ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {role.label}
                    {selectedAssignment.role === role.value && (
                      <span className="text-xs text-muted-foreground ml-2">(현재)</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRoleChangeModalOpen(false)
                    setSelectedAssignment(null)
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}