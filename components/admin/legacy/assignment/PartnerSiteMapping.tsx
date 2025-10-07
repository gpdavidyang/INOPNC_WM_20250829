'use client'

import React, { useState, useEffect } from 'react'

interface PartnerCompany {
  id: string
  company_name: string
  business_number: string
  representative_name: string
}

interface Site {
  id: string
  name: string
  address: string
  status: string
  manager_name?: string
}

interface PartnerSiteMapping {
  id: string
  partner_company_id: string
  site_id: string
  start_date: string
  end_date?: string
  is_active: boolean
  notes?: string
  partner_company: PartnerCompany
  site: Site
  assigned_users_count: number
}

interface PartnerSiteMappingProps {
  onUpdate?: () => void
}

export default function PartnerSiteMapping({ onUpdate }: PartnerSiteMappingProps) {
  const [mappings, setMappings] = useState<PartnerSiteMapping[]>([])
  const [partners, setPartners] = useState<PartnerCompany[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMapping, setEditingMapping] = useState<PartnerSiteMapping | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    partner_company_id: '',
    site_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  })

  useEffect(() => {
    loadMappings()
    loadPartners()
    loadSites()
  }, [])

  const loadMappings = async () => {
    try {
      const response = await fetch('/api/admin/assignment/partner-site-mappings')
      const result = await response.json()

      if (result.success) {
        setMappings(result.data)
      } else {
        toast.error('파트너사-현장 매핑을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('Failed to load mappings:', error)
      toast.error('매핑 데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/admin/partner-companies')
      const result = await response.json()

      if (result.success) {
        const partnerList = result.data?.partner_companies || result.data || []
        setPartners(partnerList)
      }
    } catch (error) {
      console.error('Failed to load partners:', error)
    }
  }

  const loadSites = async () => {
    try {
      const response = await fetch('/api/admin/sites?status=active')
      const result = await response.json()

      if (result.success) {
        const siteList = result.data?.sites || result.data || []
        setSites(siteList)
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const handleCreateMapping = async () => {
    try {
      const response = await fetch('/api/admin/assignment/partner-site-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        await loadMappings()
        setShowCreateModal(false)
        resetForm()
        toast.success('파트너사-현장 매핑이 생성되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '매핑 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to create mapping:', error)
      toast.error('매핑 생성 중 오류가 발생했습니다')
    }
  }

  const handleUpdateMapping = async () => {
    if (!editingMapping) return

    try {
      const response = await fetch(
        `/api/admin/assignment/partner-site-mappings/${editingMapping.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      const result = await response.json()

      if (result.success) {
        await loadMappings()
        setEditingMapping(null)
        resetForm()
        toast.success('파트너사-현장 매핑이 수정되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '매핑 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to update mapping:', error)
      toast.error('매핑 수정 중 오류가 발생했습니다')
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('정말로 이 매핑을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/assignment/partner-site-mappings/${mappingId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadMappings()
        toast.success('파트너사-현장 매핑이 삭제되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '매핑 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to delete mapping:', error)
      toast.error('매핑 삭제 중 오류가 발생했습니다')
    }
  }

  const handleToggleMapping = async (mappingId: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `/api/admin/assignment/partner-site-mappings/${mappingId}/toggle`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !isActive }),
        }
      )

      const result = await response.json()

      if (result.success) {
        await loadMappings()
        toast.success(isActive ? '매핑이 비활성화되었습니다' : '매핑이 활성화되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '매핑 상태 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to toggle mapping:', error)
      toast.error('매핑 상태 변경 중 오류가 발생했습니다')
    }
  }

  const resetForm = () => {
    setFormData({
      partner_company_id: '',
      site_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
    })
  }

  const openEditModal = (mapping: PartnerSiteMapping) => {
    setEditingMapping(mapping)
    setFormData({
      partner_company_id: mapping.partner_company_id,
      site_id: mapping.site_id,
      start_date: mapping.start_date,
      end_date: mapping.end_date || '',
      notes: mapping.notes || '',
    })
  }

  const filteredMappings = mappings.filter(mapping => {
    const searchLower = searchTerm.toLowerCase()
    return (
      mapping.partner_company.company_name.toLowerCase().includes(searchLower) ||
      mapping.site.name.toLowerCase().includes(searchLower) ||
      mapping.site.address.toLowerCase().includes(searchLower)
    )
  })

  const groupedMappings = filteredMappings.reduce(
    (acc, mapping) => {
      const partnerName = mapping.partner_company.company_name
      if (!acc[partnerName]) {
        acc[partnerName] = []
      }
      acc[partnerName].push(mapping)
      return acc
    },
    {} as Record<string, PartnerSiteMapping[]>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            파트너사-현장 매핑 관리
            <MappingTooltip />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            파트너사가 담당하는 현장을 매핑하여 효율적인 배정 관리를 할 수 있습니다
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />새 매핑 추가
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="파트너사명 또는 현장명으로 검색..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mappings List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedMappings).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              매핑이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              파트너사와 현장을 매핑하여 체계적인 배정 관리를 시작하세요
            </p>
            <Button onClick={() => setShowCreateModal(true)}>첫 매핑 추가하기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMappings).map(([partnerName, partnerMappings]) => (
            <Card key={partnerName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {partnerName}
                  <Badge variant="secondary">{partnerMappings.length}개 현장</Badge>
                </CardTitle>
                <CardDescription>
                  {partnerMappings[0].partner_company.representative_name} 대표 | 사업자번호:{' '}
                  {partnerMappings[0].partner_company.business_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerMappings.map(mapping => (
                    <div
                      key={mapping.id}
                      className={`p-4 border rounded-lg transition-all ${
                        mapping.is_active
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {mapping.site.name}
                            </span>
                            <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                              {mapping.is_active ? '활성' : '비활성'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {mapping.site.address}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(mapping.start_date).toLocaleDateString('ko-KR')}
                              {mapping.end_date &&
                                ` ~ ${new Date(mapping.end_date).toLocaleDateString('ko-KR')}`}
                            </div>
                            {mapping.assigned_users_count > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                배정된 사용자: {mapping.assigned_users_count}명
                              </div>
                            )}
                          </div>
                          {mapping.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                              {mapping.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleMapping(mapping.id, mapping.is_active)}
                            title={mapping.is_active ? '비활성화' : '활성화'}
                          >
                            {mapping.is_active ? (
                              <Unlink className="h-4 w-4" />
                            ) : (
                              <Link className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(mapping)}
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMapping(mapping.id)}
                            title="삭제"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || editingMapping !== null}
        onOpenChange={open => {
          if (!open) {
            setShowCreateModal(false)
            setEditingMapping(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMapping ? '매핑 수정' : '새 파트너사-현장 매핑'}</DialogTitle>
            <DialogDescription>
              파트너사와 현장을 연결하여 체계적인 배정 관리를 할 수 있습니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="partner_company_id">파트너사</Label>
              <Select
                value={formData.partner_company_id}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, partner_company_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="업체를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="site_id">현장</Label>
              <Select
                value={formData.site_id}
                onValueChange={value => setFormData(prev => ({ ...prev, site_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="현장을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} - {site.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">시작일</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">종료일 (선택)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">메모 (선택)</Label>
              <Input
                placeholder="매핑 관련 메모"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setEditingMapping(null)
                resetForm()
              }}
            >
              취소
            </Button>
            <Button onClick={editingMapping ? handleUpdateMapping : handleCreateMapping}>
              {editingMapping ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
