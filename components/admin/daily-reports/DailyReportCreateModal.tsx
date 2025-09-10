'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Building2, User, Users, Package, AlertCircle, Save, FileText, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createDailyReport } from '@/app/actions/admin/daily-reports'
import { getUsers } from '@/app/actions/admin/users'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/custom-select'

interface Site {
  id: string
  name: string
  address?: string
  manager_name?: string
  safety_manager_name?: string
  work_process?: string
  work_section?: string
  component_name?: string
}

interface Worker {
  id: string
  full_name: string
  role: string
  phone?: string
  email?: string
}

interface WorkerDetail {
  user_id: string | null
  name: string
  role?: string
  phone?: string
}

interface DailyReportCreateModalProps {
  sites: Site[]
  onClose: () => void
  onCreated: () => void
}

export default function DailyReportCreateModal({ sites, onClose, onCreated }: DailyReportCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    work_date: format(new Date(), 'yyyy-MM-dd'),
    site_id: '',
    member_name: '',
    process_type: '',
    component_name: '',
    work_process: '',
    work_section: '',
    total_workers: 0,
    npc1000_incoming: 0,
    npc1000_used: 0,
    npc1000_remaining: 0,
    issues: '',
    status: 'draft' as 'draft' | 'submitted'
  })
  
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
  const [workerDetails, setWorkerDetails] = useState<WorkerDetail[]>([])
  const [workerInputMode, setWorkerInputMode] = useState<'select' | 'manual'>('select')
  const [manualWorkerName, setManualWorkerName] = useState('')
  const [manualWorkerRole, setManualWorkerRole] = useState('')
  const [manualWorkerPhone, setManualWorkerPhone] = useState('')

  useEffect(() => {
    if (formData.site_id) {
      const site = sites.find(s => s.id === formData.site_id)
      setSelectedSite(site || null)
      
      // Auto-fill site-related fields
      if (site) {
        setFormData(prev => ({
          ...prev,
          component_name: site.component_name || prev.component_name,
          work_process: site.work_process || prev.work_process,
          work_section: site.work_section || prev.work_section
        }))
      }
    }
  }, [formData.site_id, sites])

  // Load available workers for selected site
  useEffect(() => {
    const loadWorkers = async () => {
      if (!formData.site_id) {
        setAvailableWorkers([])
        return
      }
      
      try {
        // Fetch workers assigned to this site
        const response = await fetch(`/api/admin/sites/${formData.site_id}/workers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          const allWorkers = data.data || []
          
          // Filter to show workers, site managers, and admins (exclude customer_managers and system_admins)
          const filteredWorkers = allWorkers.filter((worker: any) => 
            worker.role === 'worker' || 
            worker.role === 'site_manager' || 
            worker.role === 'admin'
          )
          
          setAvailableWorkers(filteredWorkers)
        } else {
          console.error(`Failed to load workers: ${response.status} ${response.statusText}`)
          setAvailableWorkers([])
        }
      } catch (error) {
        console.error('Failed to load workers:', error)
        setAvailableWorkers([])
      }
    }
    loadWorkers()
  }, [formData.site_id])

  const addWorkerFromSelect = (userId: string) => {
    const worker = availableWorkers.find(w => w.id === userId)
    if (worker && !workerDetails.find(w => w.user_id === userId)) {
      setWorkerDetails([...workerDetails, {
        user_id: userId,
        name: worker.full_name,
        role: worker.role,
        phone: worker.phone
      }])
    }
  }

  const addManualWorker = () => {
    if (!manualWorkerName.trim()) {
      alert('작업자 이름을 입력해주세요.')
      return
    }
    
    setWorkerDetails([...workerDetails, {
      user_id: null,
      name: manualWorkerName,
      role: manualWorkerRole,
      phone: manualWorkerPhone
    }])
    
    // Clear manual input fields
    setManualWorkerName('')
    setManualWorkerRole('')
    setManualWorkerPhone('')
  }

  const removeWorker = (index: number) => {
    setWorkerDetails(workerDetails.filter((_, i) => i !== index))
  }

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!formData.site_id || !formData.member_name || !formData.work_date) {
      alert('필수 정보를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await createDailyReport({
        ...formData,
        status,
        worker_details: workerDetails
      })

      if (result.success) {
        alert(status === 'draft' ? '작업일지가 임시저장되었습니다.' : '작업일지가 제출되었습니다.')
        onCreated()
        onClose()
      } else {
        alert('작업일지 생성에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating daily report:', error)
      alert('작업일지 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">새 작업일지 작성</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    작업일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.work_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, work_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현장 선택 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.site_id || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, site_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="현장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.length === 0 ? (
                        <SelectItem value="no-sites" disabled>
                          등록된 현장이 없습니다
                        </SelectItem>
                      ) : (
                        sites.map(site => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    작업책임자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.member_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, member_name: e.target.value }))}
                    placeholder="작업책임자 이름"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공정 타입 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.process_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, process_type: e.target.value }))}
                    placeholder="예: 콘크리트 타설"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">작업 상세</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">부재명</label>
                  <input
                    type="text"
                    value={formData.component_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, component_name: e.target.value }))}
                    placeholder="예: 기둥, 슬라브"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">작업공정</label>
                  <input
                    type="text"
                    value={formData.work_process}
                    onChange={(e) => setFormData(prev => ({ ...prev, work_process: e.target.value }))}
                    placeholder="예: 면, 균열"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">작업구간</label>
                  <input
                    type="text"
                    value={formData.work_section}
                    onChange={(e) => setFormData(prev => ({ ...prev, work_section: e.target.value }))}
                    placeholder="예: 지하 2층, A구역"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Worker Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">작업자 입력</h3>
              
              {/* Input Mode Selection */}
              <div className="mb-4">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="select"
                      checked={workerInputMode === 'select'}
                      onChange={(e) => setWorkerInputMode('select')}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">작업자 선택</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="manual"
                      checked={workerInputMode === 'manual'}
                      onChange={(e) => setWorkerInputMode('manual')}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">직접 입력</span>
                  </label>
                </div>
              </div>

              {/* Worker Selection or Manual Input */}
              {workerInputMode === 'select' ? (
                <div className="flex gap-2 mb-4">
                  <Select
                    value={undefined}
                    onValueChange={addWorkerFromSelect}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="작업자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkers.length === 0 ? (
                        <SelectItem value="no-workers" disabled>
                          {!formData.site_id ? '먼저 현장을 선택해주세요' : '배정된 작업자가 없습니다'}
                        </SelectItem>
                      ) : (
                        availableWorkers.map(worker => (
                          <SelectItem 
                            key={worker.id} 
                            value={worker.id}
                            disabled={workerDetails.some(w => w.user_id === worker.id)}
                          >
                            {worker.full_name} ({
                              worker.role === 'worker' ? '작업자' : 
                              worker.role === 'site_manager' ? '현장관리자' : 
                              worker.role === 'admin' ? '관리자' : 
                              worker.role
                            })
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input
                    type="text"
                    value={manualWorkerName}
                    onChange={(e) => setManualWorkerName(e.target.value)}
                    placeholder="작업자 이름 *"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={manualWorkerRole}
                    onChange={(e) => setManualWorkerRole(e.target.value)}
                    placeholder="역할 (예: 작업자)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={manualWorkerPhone}
                      onChange={(e) => setManualWorkerPhone(e.target.value)}
                      placeholder="전화번호"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addManualWorker}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      추가
                    </button>
                  </div>
                </div>
              )}

              {/* Worker List */}
              {workerDetails.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">등록된 작업자 ({workerDetails.length}명)</h4>
                  <div className="space-y-2">
                    {workerDetails.map((worker, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{worker.name}</span>
                          {worker.role && (
                            <span className="text-xs text-gray-500">({worker.role})</span>
                          )}
                          {worker.phone && (
                            <span className="text-xs text-gray-500">{worker.phone}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWorker(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Workers and Materials */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">인원 및 자재</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">총 작업인원</label>
                  <input
                    type="number"
                    value={formData.total_workers}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_workers: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NPC1000 입고</label>
                  <input
                    type="number"
                    value={formData.npc1000_incoming}
                    onChange={(e) => setFormData(prev => ({ ...prev, npc1000_incoming: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NPC1000 사용</label>
                  <input
                    type="number"
                    value={formData.npc1000_used}
                    onChange={(e) => setFormData(prev => ({ ...prev, npc1000_used: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NPC1000 잔량</label>
                  <input
                    type="number"
                    value={formData.npc1000_remaining}
                    onChange={(e) => setFormData(prev => ({ ...prev, npc1000_remaining: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Issues */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">특이사항</h3>
              <textarea
                value={formData.issues}
                onChange={(e) => setFormData(prev => ({ ...prev, issues: e.target.value }))}
                rows={4}
                placeholder="작업 중 발생한 이슈나 특이사항을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            취소
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              임시저장
            </button>
            <button
              onClick={() => handleSubmit('submitted')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <FileText className="h-4 w-4" />
              작업일지 제출
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}