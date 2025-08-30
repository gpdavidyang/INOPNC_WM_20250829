'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Building2, User, Users, Package, AlertCircle, Save, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createDailyReport } from '@/app/actions/admin/daily-reports'
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
  name: string
  role: string
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
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])

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
        worker_ids: selectedWorkers
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
                    value={formData.site_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, site_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="현장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
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