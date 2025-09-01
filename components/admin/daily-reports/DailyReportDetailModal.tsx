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
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">작업인원</td>
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
                                실제: {actualWorkersCount}명
                              </div>
                              {actualWorkersCount !== report.total_workers && (
                                <div className="text-xs text-gray-500">
                                  기록: {report.total_workers}명
                                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    불일치
                                  </span>
                                </div>
                              )}
                            </div>
                            {actualWorkersCount === 0 && (
                              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                작업자 상세 정보 없음
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
                                <CustomSelectItem value="슬라브">슬라브</CustomSelectItem>
                                <CustomSelectItem value="거더">거더</CustomSelectItem>
                                <CustomSelectItem value="기둥">기둥</CustomSelectItem>
                                <CustomSelectItem value="기타">기타</CustomSelectItem>
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
                                <CustomSelectItem value="균일">균일</CustomSelectItem>
                                <CustomSelectItem value="면">면</CustomSelectItem>
                                <CustomSelectItem value="마감">마감</CustomSelectItem>
                                <CustomSelectItem value="기타">기타</CustomSelectItem>
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
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  파일 업로드
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  이미지, PDF, Word 문서를 업로드할 수 있습니다.
                </p>
              </div>

              {/* Photos List */}
              {loadingPhotos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">파일을 불러오는 중...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8">
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">첨부된 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.filter(p => p.file_type !== 'photo_before' && p.file_type !== 'photo_after' && p.file_type !== 'receipt').map((photo) => (
                    <div
                      key={photo.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {photo.filename}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(photo.file_size)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFileTypeColor(photo.file_type)}`}>
                          {getFileTypeLabel(photo.file_type)}
                        </span>
                      </div>
                      
                      {photo.description && (
                        <p className="text-xs text-gray-600 mb-2">{photo.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {format(new Date(photo.created_at), 'yyyy.MM.dd HH:mm')}
                        </p>
                        <div className="flex gap-1">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id, photo.file_path)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-8">
              {/* Before Work Photos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-yellow-600" />
                    작업 전 사진
                  </h3>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {photos.filter(p => p.file_type === 'photo_before').length}장
                  </span>
                </div>
                
                {loadingPhotos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : photos.filter(p => p.file_type === 'photo_before').length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">작업 전 사진이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.filter(p => p.file_type === 'photo_before').map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <FileImage className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <button
                              className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                              title="보기"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                              title="다운로드"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id, photo.file_path)}
                              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{photo.filename}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(photo.created_at), 'MM.dd HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After Work Photos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-green-600" />
                    작업 후 사진
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {photos.filter(p => p.file_type === 'photo_after').length}장
                  </span>
                </div>
                
                {loadingPhotos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : photos.filter(p => p.file_type === 'photo_after').length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">작업 후 사진이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.filter(p => p.file_type === 'photo_after').map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <FileImage className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <button
                              className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                              title="보기"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                              title="다운로드"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id, photo.file_path)}
                              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{photo.filename}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(photo.created_at), 'MM.dd HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">사진 업로드 안내</p>
                <p>작업 전/후 사진은 작업일지 작성 시 구분하여 업로드해주세요.</p>
                <p>업로드된 사진은 자동으로 분류되어 표시됩니다.</p>
              </div>
            </div>
          )}

          {activeTab === 'receipts' && (
            <div className="space-y-6">
              {/* Receipt Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-purple-600" />
                    영수증 요약
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    총 {photos.filter(p => p.file_type === 'receipt').length}건
                  </span>
                </div>
                {photos.filter(p => p.file_type === 'receipt').length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">총 영수증 수</p>
                      <p className="text-xl font-bold text-gray-900">
                        {photos.filter(p => p.file_type === 'receipt').length}건
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">총 용량</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatFileSize(photos.filter(p => p.file_type === 'receipt').reduce((sum, p) => sum + p.file_size, 0))}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">최초 등록일</p>
                      <p className="text-sm font-medium text-gray-900">
                        {photos.filter(p => p.file_type === 'receipt').length > 0 
                          ? format(new Date(Math.min(...photos.filter(p => p.file_type === 'receipt').map(p => new Date(p.created_at).getTime()))), 'MM.dd')
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">최근 등록일</p>
                      <p className="text-sm font-medium text-gray-900">
                        {photos.filter(p => p.file_type === 'receipt').length > 0
                          ? format(new Date(Math.max(...photos.filter(p => p.file_type === 'receipt').map(p => new Date(p.created_at).getTime()))), 'MM.dd')
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Receipts List */}
              {loadingPhotos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">영수증을 불러오는 중...</p>
                </div>
              ) : photos.filter(p => p.file_type === 'receipt').length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">등록된 영수증이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-1">작업일지 작성 시 영수증을 첨부해주세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">영수증 목록</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photos.filter(p => p.file_type === 'receipt').map((receipt, index) => (
                      <div
                        key={receipt.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex">
                          {/* Receipt Preview */}
                          <div className="w-32 h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileImage className="h-12 w-12 text-gray-400" />
                          </div>
                          
                          {/* Receipt Details */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    #{index + 1}
                                  </span>
                                  영수증
                                </p>
                                <p className="text-sm text-gray-600 mt-1 truncate">
                                  {receipt.filename}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-500">
                              <p>크기: {formatFileSize(receipt.file_size)}</p>
                              <p>등록일: {format(new Date(receipt.created_at), 'yyyy.MM.dd HH:mm')}</p>
                            </div>
                            
                            {receipt.description && (
                              <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                                {receipt.description}
                              </p>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <button
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-3 w-3" />
                                다운로드
                              </button>
                              <button
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                                title="보기"
                              >
                                <Eye className="h-3 w-3" />
                                보기
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(receipt.id, receipt.file_path)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Guide */}
              <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
                <p className="font-medium mb-1">영수증 관리 안내</p>
                <ul className="space-y-1 ml-4">
                  <li>• 작업일지 작성 시 영수증 첨부 섹션에서 업로드 가능합니다.</li>
                  <li>• 영수증은 자재 구매, 식대, 기타 경비 등의 증빙자료로 사용됩니다.</li>
                  <li>• 영수증 원본은 별도 보관하시기 바랍니다.</li>
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'markup' && (
            <div className="space-y-6">
              {/* Markup Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-purple-600" />
                    도면마킹 요약
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    총 {photos.filter(p => p.file_type === 'document' || (p.file_type === 'other' && (p.filename?.toLowerCase().includes('drawing') || p.filename?.toLowerCase().includes('도면') || p.filename?.toLowerCase().includes('blueprint') || p.filename?.toLowerCase().includes('.dwg') || p.filename?.toLowerCase().includes('.pdf')))).length}건
                  </span>
                </div>
                
                {/* Summary Statistics */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">총 도면 수</p>
                      <p className="text-xl font-bold text-gray-900">
                        {photos.filter(p => p.file_type === 'document' || (p.file_type === 'other' && (p.filename?.toLowerCase().includes('drawing') || p.filename?.toLowerCase().includes('도면') || p.filename?.toLowerCase().includes('blueprint') || p.filename?.toLowerCase().includes('.dwg') || p.filename?.toLowerCase().includes('.pdf')))).length}건
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">첨부파일</p>
                      <p className="text-xl font-bold text-gray-900">
                        {photos.filter(p => p.file_type === 'document' || p.file_type === 'other').length}건
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">작업 사진</p>
                      <p className="text-xl font-bold text-gray-900">
                        {photos.filter(p => p.file_type === 'photo_before' || p.file_type === 'photo_after').length}건
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">작업일</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(report.work_date), 'MM.dd')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Drawing Documents List */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-4">도면 문서 목록</h4>
                
                {photos.filter(p => p.file_type === 'document' || (p.file_type === 'other' && (p.filename?.toLowerCase().includes('drawing') || p.filename?.toLowerCase().includes('도면') || p.filename?.toLowerCase().includes('blueprint') || p.filename?.toLowerCase().includes('.dwg') || p.filename?.toLowerCase().includes('.pdf')))).length > 0 ? (
                  <div className="grid gap-4">
                    {photos.filter(p => p.file_type === 'document' || (p.file_type === 'other' && (p.filename?.toLowerCase().includes('drawing') || p.filename?.toLowerCase().includes('도면') || p.filename?.toLowerCase().includes('blueprint') || p.filename?.toLowerCase().includes('.dwg') || p.filename?.toLowerCase().includes('.pdf')))).map((drawing) => (
                      <div key={drawing.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {/* Preview Image */}
                          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <FileImage className="h-12 w-12 text-gray-400" />
                          </div>
                          
                          {/* Document Info */}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{drawing.filename}</h4>
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              <p>크기: {formatFileSize(drawing.file_size)}</p>
                              <p>등록일: {format(new Date(drawing.created_at), 'yyyy.MM.dd HH:mm')}</p>
                            </div>
                            
                            {drawing.description && (
                              <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                                {drawing.description}
                              </p>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <button
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-3 w-3" />
                                다운로드
                              </button>
                              <button
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
                                title="마킹 도구로 열기"
                              >
                                <Edit className="h-3 w-3" />
                                마킹 도구로 열기
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">등록된 도면마킹 문서가 없습니다</p>
                    <p className="text-sm text-gray-400 mt-1">작업일지 작성 시 도면을 첨부하면 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
              
              {/* Markup Guide */}
              <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
                <p className="font-medium mb-1">도면마킹 관리 안내</p>
                <ul className="space-y-1 ml-4">
                  <li>• 작업일지 작성 시 도면마킹문서함에서 도면을 선택할 수 있습니다.</li>
                  <li>• 선택된 도면은 작업 진행 상황을 표시하는 용도로 사용됩니다.</li>
                  <li>• 마킹 도구로 열기를 통해 도면에 추가 마킹을 할 수 있습니다.</li>
                </ul>
              </div>
            </div>
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