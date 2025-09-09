'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Edit, 
  Save, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  Building2,
  Calendar,
  User,
  Users,
  FileImage,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import WorkerManagementTab from './WorkerManagementTab'
import AttachmentsTab from './AttachmentsTab'
import PhotosTab from './PhotosTab'
import ReceiptsTab from './ReceiptsTab'
import MarkupTab from './MarkupTab'
import { useWorkOptions } from '@/hooks/use-work-options'

interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  component_name?: string
  work_process?: string
  work_section?: string
  total_workers: number
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
  created_by: string
  site_id: string
  sites?: {
    id: string
    name: string
    address: string
  }
  profiles?: {
    full_name: string
    email: string
  }
}

interface PhotoFile {
  id: string
  filename: string
  file_path: string
  file_type: 'photo_before' | 'photo_after' | 'receipt' | 'document' | 'other'
  file_size: number
  mime_type: string
  description?: string
  created_at: string
}

interface DailyReportDetailModalProps {
  report: DailyReport
  onClose: () => void
  onUpdated: () => void
}

const statusLabels = {
  draft: '임시저장',
  submitted: '제출됨'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800'
}

export default function DailyReportDetailModal({ report: initialReport, onClose, onUpdated }: DailyReportDetailModalProps) {
  const [report, setReport] = useState(initialReport)
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'workers' | 'attachments' | 'photos' | 'receipts' | 'markup'>('info')
  const [actualWorkersCount, setActualWorkersCount] = useState<number>(0)
  const [loadingWorkers, setLoadingWorkers] = useState(true)
  
  // Tab-specific edit states
  const [tabEditStates, setTabEditStates] = useState({
    info: false,
    workers: false,
    attachments: false,
    photos: false,
    receipts: false,
    markup: false
  })
  
  // Load work options from database
  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()

  const [editData, setEditData] = useState({
    work_date: report.work_date,
    member_name: report.member_name,
    process_type: report.process_type,
    component_name: report.component_name || '',
    work_process: report.work_process || '',
    work_section: report.work_section || '',
    total_workers: report.total_workers,
    npc1000_incoming: report.npc1000_incoming,
    npc1000_used: report.npc1000_used,
    npc1000_remaining: report.npc1000_remaining,
    issues: report.issues,
    status: report.status
  })

  useEffect(() => {
    if (activeTab === 'attachments' || activeTab === 'photos' || activeTab === 'receipts' || activeTab === 'markup') {
      fetchPhotos()
    }
  }, [activeTab])

  useEffect(() => {
    fetchActualWorkers()
  }, [])

  const fetchActualWorkers = async () => {
    try {
      setLoadingWorkers(true)
      
      // Use API route instead of direct Supabase
      const response = await fetch(`/api/admin/daily-reports/workers?reportId=${report.id}`, {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const result = await response.json()
        const workers = result.data || []
        setActualWorkersCount(workers.length)
      }
    } catch (error) {
      console.error('Error fetching actual workers count:', error)
      setActualWorkersCount(0)
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleWorkersUpdate = (totalWorkers: number) => {
    setEditData(prev => ({ ...prev, total_workers: totalWorkers }))
    setActualWorkersCount(totalWorkers)
  }
  
  const handleTabEditToggle = (tab: typeof activeTab) => {
    setTabEditStates(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }))
  }
  
  const handleTabSaveComplete = () => {
    // Reset edit mode for current tab after save
    setTabEditStates(prev => ({
      ...prev,
      [activeTab]: false
    }))
  }

  const fetchPhotos = async () => {
    setLoadingPhotos(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_documents')
        .select('*')
        .eq('daily_report_id', report.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${report.id}/${Date.now()}.${fileExt}`

    try {
      const supabase = createClient()
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('daily-reports')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get file type based on extension
      let fileType: PhotoFile['file_type'] = 'other'
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt?.toLowerCase() || '')) {
        fileType = 'photo_after'
      } else if (['pdf', 'doc', 'docx'].includes(fileExt?.toLowerCase() || '')) {
        fileType = 'document'
      }

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('daily_documents')
        .insert({
          daily_report_id: report.id,
          filename: file.name,
          file_path: fileName,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          created_by: report.created_by
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Refresh photos list
      fetchPhotos()
      alert('파일이 업로드되었습니다.')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('파일 업로드 중 오류가 발생했습니다.')
    }
  }

  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('daily-reports')
        .remove([filePath])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete from database
      const { error: dbError } = await supabase
        .from('daily_documents')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Refresh photos list
      fetchPhotos()
      alert('파일이 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('파일 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      // First, update the report
      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({
          work_date: editData.work_date,
          member_name: editData.member_name,
          process_type: editData.process_type,
          component_name: editData.component_name || null,
          work_process: editData.work_process || null,
          work_section: editData.work_section || null,
          total_workers: editData.total_workers,
          npc1000_incoming: editData.npc1000_incoming,
          npc1000_used: editData.npc1000_used,
          npc1000_remaining: editData.npc1000_remaining,
          issues: editData.issues,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id)

      if (updateError) throw updateError

      // Then fetch the updated report with site info
      const { data: updatedReport, error: fetchError } = await supabase
        .from('daily_reports')
        .select(`
          *,
          sites(name, address)
        `)
        .eq('id', report.id)
        .single()

      if (fetchError) {
        console.error('Error fetching updated report:', fetchError)
        // Even if fetching fails, the update was successful
        // Just update with the edit data
        setReport(prev => ({
          ...prev,
          ...editData
        }))
      } else if (updatedReport) {
        setReport(prev => ({
          ...prev,
          ...updatedReport
        }))
      }

      handleTabSaveComplete()
      onUpdated()
      alert('작업일지가 수정되었습니다.')
    } catch (error) {
      console.error('Error updating report:', error)
      alert('작업일지 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getFileTypeLabel = (type: PhotoFile['file_type']) => {
    switch (type) {
      case 'photo_before':
        return '작업 전'
      case 'photo_after':
        return '작업 후'
      case 'receipt':
        return '영수증'
      case 'document':
        return '문서'
      default:
        return '기타'
    }
  }

  const getFileTypeColor = (type: PhotoFile['file_type']) => {
    switch (type) {
      case 'photo_before':
        return 'bg-yellow-100 text-yellow-800'
      case 'photo_after':
        return 'bg-green-100 text-green-800'
      case 'receipt':
        return 'bg-purple-100 text-purple-800'
      case 'document':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              작업일지 상세보기
            </h2>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[editData.status]}`}>
              {statusLabels[editData.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              작업일지 정보
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'workers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 inline-block mr-2" />
              작업자 관리 ({loadingWorkers ? '...' : actualWorkersCount}명)
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              첨부파일 ({photos.filter(p => p.file_type !== 'photo_before' && p.file_type !== 'photo_after' && p.file_type !== 'receipt').length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              사진 ({photos.filter(p => p.file_type === 'photo_before' || p.file_type === 'photo_after').length})
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'receipts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              영수증정보 ({photos.filter(p => p.file_type === 'receipt').length})
            </button>
            <button
              onClick={() => setActiveTab('markup')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'markup'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              도면마킹
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Main Information Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    {/* Site Information */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        현장 정보
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/6">현장명</td>
                      <td className="px-4 py-3 text-sm text-gray-900 w-1/3">{report.sites?.name}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/6">주소</td>
                      <td className="px-4 py-3 text-sm text-gray-900 w-1/3">{report.sites?.address}</td>
                    </tr>

                    {/* Work Information */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        작업 정보
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작업일</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="date"
                            value={editData.work_date}
                            onChange={(e) => setEditData(prev => ({ ...prev, work_date: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작업책임자</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="text"
                            value={editData.member_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, member_name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          report.member_name
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">공정 유형</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="text"
                            value={editData.process_type}
                            onChange={(e) => setEditData(prev => ({ ...prev, process_type: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          report.process_type
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">공수</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {loadingWorkers ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            조회 중...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {actualWorkersCount}명
                              </div>
                              {actualWorkersCount !== report.total_workers && (
                                <div className="text-xs text-gray-500">
                                  기록된 공수: {report.total_workers}명
                                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    불일치
                                  </span>
                                </div>
                              )}
                            </div>
                            {actualWorkersCount === 0 && (
                              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                작업자 정보 없음
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Work Details */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        작업 내역
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">부재명</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <div>
                            <CustomSelect
                              value={editData.component_name?.startsWith('기타:') ? '기타' : editData.component_name || ''}
                              onValueChange={(value) => {
                                if (value === '기타') {
                                  setEditData(prev => ({ ...prev, component_name: '기타:' }))
                                } else {
                                  setEditData(prev => ({ ...prev, component_name: value }))
                                }
                              }}
                            >
                              <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
                                <CustomSelectValue placeholder="선택하세요" />
                              </CustomSelectTrigger>
                              <CustomSelectContent className="bg-white border border-gray-300">
                                {componentTypes.map((type) => (
                                  <CustomSelectItem key={type.id} value={type.option_label}>
                                    {type.option_label}
                                  </CustomSelectItem>
                                ))}
                              </CustomSelectContent>
                            </CustomSelect>
                            {editData.component_name?.startsWith('기타') && (
                              <input
                                type="text"
                                value={editData.component_name.replace('기타:', '')}
                                onChange={(e) => setEditData(prev => ({ ...prev, component_name: '기타:' + e.target.value }))}
                                className="w-full mt-2 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="기타 부재명 입력"
                              />
                            )}
                          </div>
                        ) : (
                          report.component_name || '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작업공정</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <div>
                            <CustomSelect
                              value={editData.work_process?.startsWith('기타:') ? '기타' : editData.work_process || ''}
                              onValueChange={(value) => {
                                if (value === '기타') {
                                  setEditData(prev => ({ ...prev, work_process: '기타:' }))
                                } else {
                                  setEditData(prev => ({ ...prev, work_process: value }))
                                }
                              }}
                            >
                              <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
                                <CustomSelectValue placeholder="선택하세요" />
                              </CustomSelectTrigger>
                              <CustomSelectContent className="bg-white border border-gray-300">
                                {processTypes.map((type) => (
                                  <CustomSelectItem key={type.id} value={type.option_label}>
                                    {type.option_label}
                                  </CustomSelectItem>
                                ))}
                              </CustomSelectContent>
                            </CustomSelect>
                            {editData.work_process?.startsWith('기타') && (
                              <input
                                type="text"
                                value={editData.work_process.replace('기타:', '')}
                                onChange={(e) => setEditData(prev => ({ ...prev, work_process: '기타:' + e.target.value }))}
                                className="w-full mt-2 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="기타 작업공정 입력"
                              />
                            )}
                          </div>
                        ) : (
                          report.work_process || '-'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작업구간</td>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="text"
                            value={editData.work_section}
                            onChange={(e) => setEditData(prev => ({ ...prev, work_section: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="작업구간 입력"
                          />
                        ) : (
                          report.work_section || '-'
                        )}
                      </td>
                    </tr>

                    {/* Material Status */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        자재 현황 (NPC-1000)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">입고량</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="number"
                            value={editData.npc1000_incoming}
                            onChange={(e) => setEditData(prev => ({ ...prev, npc1000_incoming: parseInt(e.target.value) || 0 }))}
                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            min="0"
                          />
                        ) : (
                          report.npc1000_incoming.toLocaleString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">사용량</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="number"
                            value={editData.npc1000_used}
                            onChange={(e) => setEditData(prev => ({ ...prev, npc1000_used: parseInt(e.target.value) || 0 }))}
                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            min="0"
                          />
                        ) : (
                          report.npc1000_used.toLocaleString()
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">잔여량</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tabEditStates.info ? (
                          <input
                            type="number"
                            value={editData.npc1000_remaining}
                            onChange={(e) => setEditData(prev => ({ ...prev, npc1000_remaining: parseInt(e.target.value) || 0 }))}
                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            min="0"
                          />
                        ) : (
                          report.npc1000_remaining.toLocaleString()
                        )}
                      </td>
                      {tabEditStates.info && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">상태</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <select
                              value={editData.status}
                              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="draft">임시저장</option>
                              <option value="submitted">제출됨</option>
                            </select>
                          </td>
                        </>
                      )}
                    </tr>

                    {/* Issues */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        특이사항
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-3">
                        {tabEditStates.info ? (
                          <textarea
                            value={editData.issues}
                            onChange={(e) => setEditData(prev => ({ ...prev, issues: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="특이사항을 입력하세요..."
                          />
                        ) : (
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">
                            {report.issues || '특이사항 없음'}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Metadata */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-900">
                        작성 정보
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작성자</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {report.profiles?.full_name} ({report.profiles?.email})
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작성일시</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">최종 수정일시</td>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(report.updated_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <WorkerManagementTab
              reportId={report.id}
              siteId={report.site_id}
              isEditing={tabEditStates.workers}
              onWorkersUpdate={handleWorkersUpdate}
              onSaveComplete={handleTabSaveComplete}
            />
          )}

          {activeTab === 'attachments' && (
            <AttachmentsTab
              reportId={report.id}
              isEditing={tabEditStates.attachments}
              onSaveComplete={handleTabSaveComplete}
            />
          )}

          {activeTab === 'photos' && (
            <PhotosTab
              reportId={report.id}
              isEditing={tabEditStates.photos}
              onSaveComplete={handleTabSaveComplete}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsTab
              reportId={report.id}
              isEditing={tabEditStates.receipts}
              onSaveComplete={handleTabSaveComplete}
            />
          )}

          {activeTab === 'markup' && (
            <MarkupTab
              reportId={report.id}
              isEditing={tabEditStates.markup}
              onSaveComplete={handleTabSaveComplete}
              reportData={report}
            />
          )}
        </div>

        {/* Footer with Tab-specific Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Tab-specific edit button */}
            <div>
              {activeTab === 'info' && (
                <button
                  onClick={() => handleTabEditToggle('info')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.info
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.info ? '편집 취소' : '정보 편집'}
                </button>
              )}
              {activeTab === 'workers' && (
                <button
                  onClick={() => handleTabEditToggle('workers')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.workers
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.workers ? '편집 모드 종료' : '작업자 편집'}
                </button>
              )}
              {activeTab === 'attachments' && (
                <button
                  onClick={() => handleTabEditToggle('attachments')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.attachments
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.attachments ? '편집 모드 종료' : '첨부파일 편집'}
                </button>
              )}
              {activeTab === 'photos' && (
                <button
                  onClick={() => handleTabEditToggle('photos')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.photos
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.photos ? '편집 모드 종료' : '사진 편집'}
                </button>
              )}
              {activeTab === 'receipts' && (
                <button
                  onClick={() => handleTabEditToggle('receipts')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.receipts
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.receipts ? '편집 모드 종료' : '영수증 편집'}
                </button>
              )}
              {activeTab === 'markup' && (
                <button
                  onClick={() => handleTabEditToggle('markup')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    tabEditStates.markup
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  {tabEditStates.markup ? '편집 모드 종료' : '도면마킹 편집'}
                </button>
              )}
            </div>
            
            {/* Save/Close buttons */}
            <div className="flex gap-3">
            {tabEditStates.info ? (
              <>
                <button
                  onClick={() => handleTabEditToggle('info')}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}