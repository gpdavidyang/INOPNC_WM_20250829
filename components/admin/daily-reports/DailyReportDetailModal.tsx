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

interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
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

export default function DailyReportDetailModal({ report, onClose, onUpdated }: DailyReportDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'photos'>('info')
  
  const [editData, setEditData] = useState({
    work_date: report.work_date,
    member_name: report.member_name,
    process_type: report.process_type,
    total_workers: report.total_workers,
    npc1000_incoming: report.npc1000_incoming,
    npc1000_used: report.npc1000_used,
    npc1000_remaining: report.npc1000_remaining,
    issues: report.issues,
    status: report.status
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    setLoadingPhotos(true)
    try {
      // Generate realistic sample data based on the actual daily report
      const mockPhotos: PhotoFile[] = generateSamplePhotos(report.id, report.work_date, report.member_name, report.process_type)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPhotos(mockPhotos)
    } catch (error) {
      console.error('Error fetching photos:', error)
    }
    setLoadingPhotos(false)
  }

  // Generate sample photo data based on report details
  const generateSamplePhotos = (reportId: string, workDate: string, memberName: string, processType: string): PhotoFile[] => {
    const basePhotos = []
    const dateStr = workDate.replace(/-/g, '')
    
    // Always include before/after photos
    basePhotos.push({
      id: `${reportId}_before`,
      filename: `${processType}_작업전_${dateStr}_${memberName}.jpg`,
      file_path: `/uploads/daily_reports/${reportId}/before_${dateStr}.jpg`,
      file_type: 'photo_before' as const,
      file_size: Math.floor(Math.random() * 2000000) + 1000000, // 1-3MB
      mime_type: 'image/jpeg',
      description: `${processType} 작업 시작 전 현장 상태`,
      created_at: new Date(workDate + 'T08:00:00').toISOString()
    })
    
    basePhotos.push({
      id: `${reportId}_after`,
      filename: `${processType}_작업후_${dateStr}_${memberName}.jpg`,
      file_path: `/uploads/daily_reports/${reportId}/after_${dateStr}.jpg`,
      file_type: 'photo_after' as const,
      file_size: Math.floor(Math.random() * 2000000) + 1000000,
      mime_type: 'image/jpeg',
      description: `${processType} 작업 완료 후 현장 상태`,
      created_at: new Date(workDate + 'T17:00:00').toISOString()
    })

    // Add receipts for some reports
    if (Math.random() > 0.4) {
      basePhotos.push({
        id: `${reportId}_receipt_1`,
        filename: `자재구매_영수증_${dateStr}.jpg`,
        file_path: `/uploads/daily_reports/${reportId}/receipt_${dateStr}.jpg`,
        file_type: 'receipt' as const,
        file_size: Math.floor(Math.random() * 1000000) + 500000,
        mime_type: 'image/jpeg',
        description: `${processType} 관련 자재 구매 영수증`,
        created_at: new Date(workDate + 'T12:30:00').toISOString()
      })
    }

    // Add progress photos for longer processes
    if (['기초', '골조', '마감'].includes(processType)) {
      basePhotos.push({
        id: `${reportId}_progress_1`,
        filename: `${processType}_진행과정_${dateStr}.jpg`,
        file_path: `/uploads/daily_reports/${reportId}/progress_${dateStr}.jpg`,
        file_type: 'other' as const,
        file_size: Math.floor(Math.random() * 1500000) + 800000,
        mime_type: 'image/jpeg',
        description: `${processType} 작업 진행 과정 사진`,
        created_at: new Date(workDate + 'T14:00:00').toISOString()
      })
    }

    // Add equipment photos
    if (Math.random() > 0.6) {
      basePhotos.push({
        id: `${reportId}_equipment`,
        filename: `장비현황_${dateStr}.jpg`,
        file_path: `/uploads/daily_reports/${reportId}/equipment_${dateStr}.jpg`,
        file_type: 'other' as const,
        file_size: Math.floor(Math.random() * 1200000) + 600000,
        mime_type: 'image/jpeg',
        description: '현장 장비 사용 현황',
        created_at: new Date(workDate + 'T10:00:00').toISOString()
      })
    }

    // Add safety document
    if (Math.random() > 0.7) {
      basePhotos.push({
        id: `${reportId}_safety`,
        filename: `안전점검표_${dateStr}.pdf`,
        file_path: `/uploads/daily_reports/${reportId}/safety_${dateStr}.pdf`,
        file_type: 'document' as const,
        file_size: Math.floor(Math.random() * 500000) + 100000,
        mime_type: 'application/pdf',
        description: '일일 안전점검표',
        created_at: new Date(workDate + 'T18:00:00').toISOString()
      })
    }

    return basePhotos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({
          work_date: editData.work_date,
          member_name: editData.member_name,
          process_type: editData.process_type,
          total_workers: editData.total_workers,
          npc1000_incoming: editData.npc1000_incoming,
          npc1000_used: editData.npc1000_used,
          npc1000_remaining: editData.npc1000_remaining,
          issues: editData.issues,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id)

      if (error) throw error

      setIsEditing(false)
      onUpdated() // Refresh parent list
      alert('작업일지가 수정되었습니다.')
    } catch (error) {
      console.error('Error updating report:', error)
      alert('작업일지 수정 중 오류가 발생했습니다.')
    }
    setSaving(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id)

      if (error) throw error

      setEditData(prev => ({ ...prev, status: newStatus as any }))
      onUpdated()
      alert(`작업일지 상태가 "${statusLabels[newStatus as keyof typeof statusLabels]}"로 변경되었습니다.`)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // In a real implementation, you would upload to Supabase storage
    console.log('Uploading photos:', files)
    alert('사진 업로드 기능은 개발 중입니다.')
  }

  const handlePhotoDelete = async (photoId: string) => {
    if (!confirm('사진을 삭제하시겠습니까?')) return

    try {
      // Remove from state for demo
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      alert('사진이 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('사진 삭제 중 오류가 발생했습니다.')
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              작업일지 상세보기
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[editData.status]}`}>
              {statusLabels[editData.status]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                편집
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
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
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              첨부파일 관리 ({photos.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Site Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  현장 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">현장명:</span>
                    <span className="ml-2 font-medium">{report.sites?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">주소:</span>
                    <span className="ml-2">{report.sites?.address}</span>
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">작업 정보</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">작업일</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.work_date}
                        onChange={(e) => setEditData(prev => ({ ...prev, work_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{format(new Date(report.work_date), 'yyyy.MM.dd (E)', { locale: ko })}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">작업자명</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.member_name}
                        onChange={(e) => setEditData(prev => ({ ...prev, member_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{report.member_name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">공정</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.process_type}
                        onChange={(e) => setEditData(prev => ({ ...prev, process_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span>{report.process_type}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">작업인원</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.total_workers}
                        onChange={(e) => setEditData(prev => ({ ...prev, total_workers: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{report.total_workers}명</span>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">임시저장</option>
                        <option value="submitted">제출됨</option>
                        <option value="approved">승인됨</option>
                        <option value="rejected">반려됨</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">자재 현황 (NPC-1000)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">입고량</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.npc1000_incoming}
                        onChange={(e) => setEditData(prev => ({ ...prev, npc1000_incoming: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    ) : (
                      <span>{report.npc1000_incoming}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사용량</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.npc1000_used}
                        onChange={(e) => setEditData(prev => ({ ...prev, npc1000_used: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    ) : (
                      <span>{report.npc1000_used}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">잔여량</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.npc1000_remaining}
                        onChange={(e) => setEditData(prev => ({ ...prev, npc1000_remaining: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    ) : (
                      <span>{report.npc1000_remaining}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">특이사항</label>
                {isEditing ? (
                  <textarea
                    value={editData.issues}
                    onChange={(e) => setEditData(prev => ({ ...prev, issues: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="특이사항을 입력하세요..."
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                    {report.issues || '특이사항 없음'}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">작성 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">작성자:</span>
                    <span className="ml-2">{report.profiles?.full_name} ({report.profiles?.email})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">작성일:</span>
                    <span className="ml-2">{format(new Date(report.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">수정일:</span>
                    <span className="ml-2">{format(new Date(report.updated_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">파일 업로드</p>
                  <p className="text-gray-600">클릭하거나 파일을 드래그하여 업로드하세요</p>
                  <p className="text-sm text-gray-500 mt-2">사진 파일(JPG, PNG), 문서 파일(PDF), 영수증 등을 업로드할 수 있습니다.</p>
                </label>
              </div>

              {/* Photos Grid */}
              {loadingPhotos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">파일을 불러오는 중...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-12">
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">업로드된 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group files by type */}
                  {['photo_before', 'photo_after', 'receipt', 'document', 'other'].map(fileType => {
                    const typeFiles = photos.filter(p => p.file_type === fileType)
                    if (typeFiles.length === 0) return null
                    
                    const typeLabels = {
                      photo_before: '작업 전 사진',
                      photo_after: '작업 후 사진', 
                      receipt: '영수증',
                      document: '문서',
                      other: '기타 파일'
                    }
                    
                    const typeIcons = {
                      photo_before: '📷',
                      photo_after: '📸',
                      receipt: '🧾', 
                      document: '📄',
                      other: '📁'
                    }
                    
                    return (
                      <div key={fileType}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span>{typeIcons[fileType as keyof typeof typeIcons]}</span>
                          {typeLabels[fileType as keyof typeof typeLabels]} ({typeFiles.length})
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {typeFiles.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                {photo.mime_type.startsWith('image/') ? (
                                  <img
                                    src="data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%236b7280'%3E사진 미리보기%3C/text%3E%3C/svg%3E"
                                    alt={photo.filename}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                      <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-xs text-gray-600">{photo.mime_type.split('/')[1]?.toUpperCase()}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* File info overlay */}
                              <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs font-medium truncate">{photo.filename}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-gray-300">{formatFileSize(photo.file_size)}</p>
                                  <p className="text-xs text-gray-300">{format(new Date(photo.created_at), 'HH:mm')}</p>
                                </div>
                                {photo.description && (
                                  <p className="text-xs text-gray-400 truncate mt-1">{photo.description}</p>
                                )}
                              </div>
                              
                              {/* Action buttons */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => window.open(photo.file_path, '_blank')}
                                    className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
                                    title="크게보기"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handlePhotoDelete(photo.id)}
                                    className="p-1 bg-red-600 bg-opacity-75 text-white rounded hover:bg-opacity-90 transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* File type badge */}
                              <div className="absolute top-2 left-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  fileType === 'photo_before' ? 'bg-green-100 text-green-800' :
                                  fileType === 'photo_after' ? 'bg-blue-100 text-blue-800' :
                                  fileType === 'receipt' ? 'bg-yellow-100 text-yellow-800' :
                                  fileType === 'document' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {typeLabels[fileType as keyof typeof typeLabels]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {/* 상태 변경 버튼 제거 - 임시저장과 제출됨 상태만 사용 */}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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