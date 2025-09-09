'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, TrendingUp, Calendar, Building2, Search, Filter, 
  Download, PlusCircle, Edit, Eye, Trash2, CheckCircle, 
  XCircle, AlertTriangle, BarChart3, Factory, Save, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface ProductionManagementTabProps {
  profile: Profile
}

interface MaterialProduction {
  id: string
  site_id: string
  material_id: string
  production_number: string
  produced_quantity: number
  production_date: string
  batch_number: string | null
  quality_status: 'pending' | 'approved' | 'rejected'
  quality_notes: string | null
  produced_by: string | null
  verified_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  site?: { id: string; name: string }
  material?: { id: string; name: string; code: string; unit: string }
  producer?: { id: string; full_name: string }
  verifier?: { id: string; full_name: string }
}

interface Site {
  id: string
  name: string
}

interface Material {
  id: string
  code: string
  name: string
  unit: string
}

export default function ProductionManagementTab({ profile }: ProductionManagementTabProps) {
  const [productions, setProductions] = useState<MaterialProduction[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProduction, setSelectedProduction] = useState<MaterialProduction | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    site_id: '',
    material_id: '',
    produced_quantity: '',
    production_date: new Date().toISOString().split('T')[0],
    batch_number: '',
    quality_status: 'pending' as 'pending' | 'approved' | 'rejected',
    quality_notes: '',
    notes: ''
  })

  const supabase = createClient()

  // Fetch data
  useEffect(() => {
    fetchProductions()
    fetchSites()
    fetchMaterials()
  }, [selectedSite, selectedStatus, selectedDateRange])

  const fetchProductions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('material_productions')
        .select(`
          *,
          site:sites(id, name),
          material:materials(id, code, name, unit),
          producer:profiles!material_productions_produced_by_fkey(id, full_name),
          verifier:profiles!material_productions_verified_by_fkey(id, full_name)
        `)
        .order('production_date', { ascending: false })

      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('quality_status', selectedStatus)
      }

      // Date range filter
      const now = new Date()
      if (selectedDateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        query = query.gte('production_date', weekAgo.toISOString().split('T')[0])
      } else if (selectedDateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        query = query.gte('production_date', monthAgo.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error
      setProductions(data || [])
    } catch (error) {
      console.error('Error fetching productions:', error)
      toast.error('생산 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, code, name, unit')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const generateProductionNumber = () => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `PROD-${today}-${random}`
  }

  const handleAdd = () => {
    setFormData({
      site_id: '',
      material_id: '',
      produced_quantity: '',
      production_date: new Date().toISOString().split('T')[0],
      batch_number: '',
      quality_status: 'pending',
      quality_notes: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  const handleEdit = (production: MaterialProduction) => {
    setSelectedProduction(production)
    setFormData({
      site_id: production.site_id,
      material_id: production.material_id,
      produced_quantity: production.produced_quantity.toString(),
      production_date: production.production_date,
      batch_number: production.batch_number || '',
      quality_status: production.quality_status,
      quality_notes: production.quality_notes || '',
      notes: production.notes || ''
    })
    setShowEditModal(true)
  }

  const handleDetail = (production: MaterialProduction) => {
    setSelectedProduction(production)
    setShowDetailModal(true)
  }

  const submitProduction = async () => {
    try {
      if (!formData.site_id || !formData.material_id || !formData.produced_quantity) {
        toast.error('필수 정보를 모두 입력해주세요.')
        return
      }

      const quantity = parseFloat(formData.produced_quantity)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      const productionData = {
        site_id: formData.site_id,
        material_id: formData.material_id,
        production_number: generateProductionNumber(),
        produced_quantity: quantity,
        production_date: formData.production_date,
        batch_number: formData.batch_number || null,
        quality_status: formData.quality_status,
        quality_notes: formData.quality_notes || null,
        produced_by: profile.id,
        notes: formData.notes || null
      }

      const { error } = await supabase
        .from('material_productions')
        .insert([productionData])

      if (error) throw error

      toast.success('생산 기록이 추가되었습니다.')
      setShowAddModal(false)
      fetchProductions()
    } catch (error) {
      console.error('Error adding production:', error)
      toast.error('생산 기록 추가에 실패했습니다.')
    }
  }

  const updateProduction = async () => {
    if (!selectedProduction) return

    try {
      const quantity = parseFloat(formData.produced_quantity)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      const updates = {
        site_id: formData.site_id,
        material_id: formData.material_id,
        produced_quantity: quantity,
        production_date: formData.production_date,
        batch_number: formData.batch_number || null,
        quality_status: formData.quality_status,
        quality_notes: formData.quality_notes || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('material_productions')
        .update(updates)
        .eq('id', selectedProduction.id)

      if (error) throw error

      toast.success('생산 기록이 수정되었습니다.')
      setShowEditModal(false)
      setSelectedProduction(null)
      fetchProductions()
    } catch (error) {
      console.error('Error updating production:', error)
      toast.error('생산 기록 수정에 실패했습니다.')
    }
  }

  const filteredProductions = productions.filter(production =>
    searchTerm === '' || 
    production.production_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.site?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">승인됨</Badge>
      case 'rejected':
        return <Badge variant="destructive">반려됨</Badge>
      case 'pending':
      default:
        return <Badge variant="secondary">검토중</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const totalProduction = filteredProductions.reduce((sum, prod) => sum + prod.produced_quantity, 0)
  const approvedProduction = filteredProductions.filter(p => p.quality_status === 'approved').reduce((sum, prod) => sum + prod.produced_quantity, 0)
  const pendingCount = filteredProductions.filter(p => p.quality_status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 생산량</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProduction.toLocaleString()}</p>
              </div>
              <Factory className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">승인된 생산량</p>
                <p className="text-2xl font-bold text-green-600">{approvedProduction.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">검토 대기</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">생산 기록</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredProductions.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="생산번호, 자재명, 현장명, 배치번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 현장</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">검토중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="rejected">반려됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1주일</SelectItem>
              <SelectItem value="month">1개월</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={handleAdd} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            생산 기록 추가
          </Button>
        </div>
      </div>

      {/* Productions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">현장</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">자재</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">배치번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">품질상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산자</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : filteredProductions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">생산 기록이 없습니다.</td>
                  </tr>
                ) : (
                  filteredProductions.map((production) => (
                    <tr key={production.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {production.production_number}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {production.site?.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {production.material?.name || '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {production.material?.code || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {production.produced_quantity.toLocaleString()} {production.material?.code?.includes('NPC-1000') ? '말' : (production.material?.unit || 'kg')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(production.production_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {production.batch_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(production.quality_status)}
                          <span className="ml-2">{getStatusBadge(production.quality_status)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {production.producer?.name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetail(production)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(production)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Production Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>생산 기록 추가</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>현장 *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>자재 *</Label>
              <Select value={formData.material_id} onValueChange={(value) => setFormData({...formData, material_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="자재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>{material.name} ({material.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>생산량 *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.produced_quantity}
                onChange={(e) => setFormData({...formData, produced_quantity: e.target.value})}
                placeholder="생산량 입력"
              />
            </div>
            <div>
              <Label>생산일 *</Label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              />
            </div>
            <div>
              <Label>배치번호</Label>
              <Input
                value={formData.batch_number}
                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                placeholder="배치번호 입력"
              />
            </div>
            <div>
              <Label>품질상태</Label>
              <Select value={formData.quality_status} onValueChange={(value) => setFormData({...formData, quality_status: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">검토중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">반료됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>품질 비고</Label>
              <Textarea
                value={formData.quality_notes}
                onChange={(e) => setFormData({...formData, quality_notes: e.target.value})}
                placeholder="품질 검사 결과나 비고사항"
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={submitProduction}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Production Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>생산 기록 수정</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>현장 *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>자재 *</Label>
              <Select value={formData.material_id} onValueChange={(value) => setFormData({...formData, material_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="자재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>{material.name} ({material.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>생산량 *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.produced_quantity}
                onChange={(e) => setFormData({...formData, produced_quantity: e.target.value})}
                placeholder="생산량 입력"
              />
            </div>
            <div>
              <Label>생산일 *</Label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              />
            </div>
            <div>
              <Label>배치번호</Label>
              <Input
                value={formData.batch_number}
                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                placeholder="배치번호 입력"
              />
            </div>
            <div>
              <Label>품질상태</Label>
              <Select value={formData.quality_status} onValueChange={(value) => setFormData({...formData, quality_status: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">검토중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">반료됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>품질 비고</Label>
              <Textarea
                value={formData.quality_notes}
                onChange={(e) => setFormData({...formData, quality_notes: e.target.value})}
                placeholder="품질 검사 결과나 비고사항"
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>취소</Button>
            <Button onClick={updateProduction}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>생산 기록 상세</DialogTitle>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산번호</Label>
                    <p className="text-lg font-medium">{selectedProduction.production_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">현장</Label>
                    <p className="text-lg">{selectedProduction.site?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">자재</Label>
                    <p className="text-lg">{selectedProduction.material?.name} ({selectedProduction.material?.code})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산량</Label>
                    <p className="text-lg">{selectedProduction.produced_quantity.toLocaleString()} {selectedProduction.material?.unit}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산일</Label>
                    <p className="text-lg">{formatDate(selectedProduction.production_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">배치번호</Label>
                    <p className="text-lg">{selectedProduction.batch_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">품질상태</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedProduction.quality_status)}
                      {getStatusBadge(selectedProduction.quality_status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산자</Label>
                    <p className="text-lg">{selectedProduction.producer?.name || '-'}</p>
                  </div>
                </div>
              </div>
              
              {selectedProduction.quality_notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">품질 비고</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {selectedProduction.quality_notes}
                  </p>
                </div>
              )}
              
              {selectedProduction.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">비고</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {selectedProduction.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">생성일</Label>
                  <p className="text-sm">{formatDate(selectedProduction.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">수정일</Label>
                  <p className="text-sm">{formatDate(selectedProduction.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}