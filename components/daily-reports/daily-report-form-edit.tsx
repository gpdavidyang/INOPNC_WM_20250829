'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
import { addBulkAttendance } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from '@/components/ui/custom-select'
import { 
  ArrowLeft, 
  Save, 
  Send,
  Calendar, 
  Plus, 
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Users,
  Package,
  Camera,
  Receipt,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Eye,
  X
} from 'lucide-react'
import { DailyReport, Profile, Site, Material, PhotoGroup, ComponentType, ConstructionProcessType } from '@/types'
import { AdditionalPhotoData } from '@/types/daily-reports'
import PhotoGridPreview from './photo-grid-preview'
import PDFReportGenerator from './pdf-report-generator'
import AdditionalPhotoUploadSection from './additional-photo-upload-section'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormEditProps {
  report: DailyReport & {
    site?: any
    work_logs?: WorkLogEntry[]
    weather_conditions?: any
  }
  currentUser: Profile
  sites?: Site[]
  materials?: Material[]
  workers?: Profile[]
}

interface WorkContentEntry {
  id: string
  memberName: string
  memberNameOther?: string
  processType: string
  processTypeOther?: string
  workSection: string
  // 통합된 사진 관리
  beforePhotos: File[]
  afterPhotos: File[]
  beforePhotoPreviews: string[]
  afterPhotoPreviews: string[]
}

interface WorkerEntry {
  id: string // Unique identifier for React key
  worker_id: string
  labor_hours: number
  worker_name?: string // For direct input
  is_direct_input?: boolean // To track if this is direct input
}

interface PhotoEntry {
  id: string
  type: 'before' | 'after'
  file: File | null
  preview: string | null
}

interface ReceiptEntry {
  id: string
  category: string
  amount: string
  date: string
  file: File | null
  preview?: string | null
}

interface MaterialEntry {
  incoming: string
  used: string
  remaining: string
}

// Collapsible section component for better organization
const CollapsibleSection = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  badge,
  icon: Icon 
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: number | string
  icon?: React.ComponentType<{ className?: string }>
}) => {
  return (
    <Card className="mb-4">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
          <h2 className="text-lg font-semibold">{title}</h2>
          {badge && (
            <Badge variant="secondary" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-3">
          {children}
        </div>
      )}
    </Card>
  )
}


export default function DailyReportFormEdit({ 
  report, 
  currentUser, 
  sites = [], 
  materials = [], 
  workers = [] 
}: DailyReportFormEditProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
    workContent: true,
    workers: false,
    photos: false,
    additionalPhotos: false,
    receipts: false,
    drawings: false,
    requests: false,
    materials: false,
    specialNotes: false
  })

  // Global toggle state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state - Initialize with existing report data
  const [formData, setFormData] = useState({
    site_id: report.site_id || '',
    work_date: report.work_date || '',
    member_name: report.member_name || '',
    process_type: report.process_type || '',
    total_workers: report.total_workers || 0,
    npc1000_incoming: report.npc1000_incoming || 0,
    npc1000_used: report.npc1000_used || 0,
    npc1000_remaining: report.npc1000_remaining || 0,
    issues: report.issues || '',
    notes: report.notes || '',
    created_by: currentUser.full_name
  })

  // Enhanced state management
  const [workContents, setWorkContents] = useState<WorkContentEntry[]>([])
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>([])
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([])
  const [additionalBeforePhotos, setAdditionalBeforePhotos] = useState<AdditionalPhotoData[]>([])
  const [additionalAfterPhotos, setAdditionalAfterPhotos] = useState<AdditionalPhotoData[]>([])
  const [requestText, setRequestText] = useState('')
  const [materialData, setMaterialData] = useState<MaterialEntry>({
    incoming: '',
    used: '',
    remaining: ''
  })
  const [specialNotes, setSpecialNotes] = useState('')
  
  // File attachments
  const [attachments, setAttachments] = useState<File[]>([])

  // Initialize data from existing report
  useEffect(() => {
    // Initialize work contents from existing data
    if (report.work_logs && report.work_logs.length > 0) {
      const convertedWorkContents = report.work_logs.map((log: any, index: number) => ({
        id: log.id || `existing-${index}`,
        memberName: log.work_type || '',
        processType: log.location || '',
        workSection: log.description || '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: []
      }))
      setWorkContents(convertedWorkContents)
    }

    // Initialize other data if available
    if (report.notes) {
      setSpecialNotes(report.notes)
    }
  }, [report])

  // Section toggle handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleAllSections = () => {
    const newState = !allExpanded
    setAllExpanded(newState)
    setExpandedSections({
      siteInfo: true, // Always keep site info expanded
      workContent: newState,
      workers: newState,
      photos: newState,
      additionalPhotos: newState,
      receipts: newState,
      drawings: newState,
      requests: newState,
      materials: newState,
      specialNotes: newState
    })
  }

  // Work content handlers
  const handleAddWorkContent = () => {
    const newWorkContent: WorkContentEntry = {
      id: `work-${Date.now()}`,
      memberName: '',
      processType: '',
      workSection: '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: []
    }
    setWorkContents([...workContents, newWorkContent])
  }

  const handleUpdateWorkContent = (id: string, field: keyof WorkContentEntry, value: any) => {
    setWorkContents(workContents.map(content => 
      content.id === id ? { ...content, [field]: value } : content
    ))
  }

  const handleRemoveWorkContent = (id: string) => {
    setWorkContents(workContents.filter(content => content.id !== id))
  }

  // Photo upload handlers
  const handlePhotoUpload = useCallback(async (workContentId: string, type: 'before' | 'after', files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      const filesToAdd = Array.from(files)
      const workContent = workContents.find(w => w.id === workContentId)
      if (!workContent) return

      const previews: string[] = []
      for (const file of filesToAdd) {
        try {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          previews.push(preview)
        } catch (error) {
          console.error('Error creating preview:', error)
          previews.push('')
        }
      }

      setWorkContents(workContents.map(content =>
        content.id === workContentId
          ? {
              ...content,
              [type === 'before' ? 'beforePhotos' : 'afterPhotos']: [
                ...(type === 'before' ? content.beforePhotos : content.afterPhotos),
                ...filesToAdd
              ],
              [type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews']: [
                ...(type === 'before' ? content.beforePhotoPreviews : content.afterPhotoPreviews),
                ...previews
              ]
            }
          : content
      ))

      if (previews.length > 0) {
        toast.success(`${filesToAdd.length}개 사진이 추가되었습니다`)
      } else {
        toast.warning('사진이 추가되었지만 미리보기 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('사진 업로드 중 오류가 발생했습니다')
    }
  }, [workContents])

  // Photo deletion handlers
  const handlePhotoDelete = (workContentId: string, type: 'before' | 'after', index: number) => {
    setWorkContents(workContents.map(content =>
      content.id === workContentId
        ? {
            ...content,
            [type === 'before' ? 'beforePhotos' : 'afterPhotos']: 
              (type === 'before' ? content.beforePhotos : content.afterPhotos).filter((_, i) => i !== index),
            [type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews']: 
              (type === 'before' ? content.beforePhotoPreviews : content.afterPhotoPreviews).filter((_, i) => i !== index)
          }
        : content
    ))
  }

  // Worker entry handlers
  const handleAddWorkerEntry = () => {
    const newWorkerEntry: WorkerEntry = {
      id: `worker-${Date.now()}`,
      worker_id: '',
      labor_hours: 1.0,
      is_direct_input: true
    }
    setWorkerEntries([...workerEntries, newWorkerEntry])
  }

  const handleUpdateWorkerEntry = (id: string, field: keyof WorkerEntry, value: any) => {
    setWorkerEntries(workerEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }

  const handleRemoveWorkerEntry = (id: string) => {
    setWorkerEntries(workerEntries.filter(entry => entry.id !== id))
  }

  // Receipt handlers
  const handleAddReceipt = () => {
    const newReceipt: ReceiptEntry = {
      id: `receipt-${Date.now()}`,
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      file: null
    }
    setReceipts([...receipts, newReceipt])
  }

  const handleUpdateReceipt = (id: string, field: keyof ReceiptEntry, value: any) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === id ? { ...receipt, [field]: value } : receipt
    ))
  }

  const handleRemoveReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id))
  }

  // File handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Enhanced validation
      if (submitForApproval) {
        if (!formData.member_name.trim()) {
          throw new Error('부재명을 입력해주세요')
        }
        if (!formData.process_type.trim()) {
          throw new Error('공정을 입력해주세요')
        }
        if (formData.total_workers <= 0) {
          throw new Error('작업자 수를 입력해주세요')
        }
        if (workContents.length === 0) {
          throw new Error('작업 내용을 입력해주세요')
        }
      }

      // Prepare comprehensive data for update
      const updateData = {
        ...formData,
        work_contents: workContents,
        worker_entries: workerEntries,
        receipts: receipts.map(r => ({ ...r, file: null })), // Don't save file objects
        request_text: requestText,
        material_data: materialData,
        special_notes: specialNotes,
        updated_at: new Date().toISOString()
      }

      // Update daily report
      const updateResult = await updateDailyReport(report.id, updateData)

      if (!updateResult.success) {
        showErrorNotification(updateResult.error || '일일보고서 수정에 실패했습니다', 'handleSubmit')
        return
      }

      // Submit for approval if requested
      if (submitForApproval) {
        const submitResult = await submitDailyReport(report.id)
        if (!submitResult.success) {
          showErrorNotification(submitResult.error || '일일보고서 제출에 실패했습니다', 'handleSubmit')
          return
        }
      }

      // Show success message based on action
      const successMessage = submitForApproval 
        ? '일일보고서가 성공적으로 제출되었습니다.'
        : '일일보고서가 성공적으로 수정되었습니다.'
      toast.success(successMessage)

      // Redirect back to detail page
      router.push(`/dashboard/daily-reports/${report.id}`)
    } catch (err) {
      showErrorNotification(err, 'handleSubmit')
      setError(err instanceof Error ? err.message : '일일보고서 수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">작업일지 수정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {report.site?.name} • {report.work_date}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={report.status === 'draft' ? 'secondary' : 'default'}>
            임시저장
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            title={allExpanded ? '모든 섹션 접기' : '모든 섹션 펼치기'}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                모두 접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                모두 펼치기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section 1: 현장 정보 (Always expanded) */}
      <Card className="mb-4">
        <div className="p-3 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold">현장 정보</h2>
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div>
            <Label htmlFor="site">현장</Label>
            <CustomSelect
              value={formData.site_id}
              onValueChange={(value) => setFormData({ ...formData, site_id: value })}
              disabled={true} // Site should not be editable
            >
              <CustomSelectTrigger>
                <CustomSelectValue placeholder="현장 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {sites.map(site => (
                  <CustomSelectItem key={site.id} value={site.id}>{site.name}</CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          
          <div>
            <Label htmlFor="date">작업일자</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="date"
                type="date"
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                className="pl-10"
                disabled={true} // Date should not be editable
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              부재명 <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.member_name}
              onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
              placeholder="슬라브, 거더, 기둥 등"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              공정 <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.process_type}
              onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
              placeholder="균열, 면, 마감 등"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              작업자 수 <span className="text-red-400">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.total_workers}
              onChange={(e) => setFormData({ ...formData, total_workers: parseInt(e.target.value) || 0 })}
              placeholder="작업자 수를 입력하세요"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">NPC-1000 자재 관리</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                입고량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_incoming}
                onChange={(e) => setFormData({ ...formData, npc1000_incoming: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                사용량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_used}
                onChange={(e) => setFormData({ ...formData, npc1000_used: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                잔량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_remaining}
                onChange={(e) => setFormData({ ...formData, npc1000_remaining: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Work Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">작업 내역</h2>
          <Button onClick={handleAddWorkLog} variant="outline" size="compact">
            <Plus className="h-4 w-4 mr-1" />
            작업 추가
          </Button>
        </div>

        <div className="space-y-4">
          {workLogs.map((workLog, index) => (
            <div key={workLog.id} className="border dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium">작업 {index + 1}</h3>
                <Button
                  onClick={() => handleRemoveWorkLog(workLog.id)}
                  variant="ghost"
                  size="compact"
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>작업 종류</Label>
                  <Input
                    value={workLog.work_type}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'work_type', e.target.value)}
                    placeholder="예: 철근 작업"
                  />
                </div>
                <div>
                  <Label>작업 위치</Label>
                  <Input
                    value={workLog.location}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'location', e.target.value)}
                    placeholder="예: 3층 A구역"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>작업 내용</Label>
                  <Textarea
                    value={workLog.description}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'description', e.target.value)}
                    placeholder="상세 작업 내용을 입력하세요"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>투입 인원</Label>
                  <Input
                    type="number"
                    value={workLog.worker_count}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'worker_count', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              {/* Materials */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">사용 자재</Label>
                  <Button
                    onClick={() => handleAddMaterial(workLog.id)}
                    variant="ghost"
                    size="compact"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    자재 추가
                  </Button>
                </div>
                
                {workLog.materials.map((material, matIndex) => (
                  <div key={matIndex} className="flex items-center gap-2 mb-2">
                    <Select
                      value={material.material_id}
                      onValueChange={(value) => handleUpdateMaterial(workLog.id, matIndex, 'material_id', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="자재 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(mat => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name} ({mat.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => handleUpdateMaterial(workLog.id, matIndex, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="수량"
                      className="w-24"
                      step="0.01"
                    />
                    <Button
                      onClick={() => handleRemoveMaterial(workLog.id, matIndex)}
                      variant="ghost"
                      size="compact"
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {workLogs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              작업 내역을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
            </p>
          )}
        </div>
      </Card>


      {/* Notes & Attachments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">비고 및 첨부파일</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">특이사항</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="특이사항이나 전달사항을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label>첨부파일</Label>
            <div className="mt-2">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      클릭하여 파일 선택 (사진, 문서 등)
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        onClick={() => handleRemoveFile(index)}
                        variant="ghost"
                        size="compact"
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? '저장 중...' : '저장'}
        </Button>
        
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || !formData.member_name.trim() || !formData.process_type.trim() || formData.total_workers <= 0}
          className="flex-1"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          제출
        </Button>
      </div>
    </div>
  )
}