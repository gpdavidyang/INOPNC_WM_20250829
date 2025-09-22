'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
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
  X,
  FolderOpen,
  Building2,
  Clock,
  MapPin,
  Wrench,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from 'lucide-react'
import { DailyReport, Profile, Site, Material } from '@/types'
import { AdditionalPhotoData } from '@/types/daily-reports'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'
import { useWorkOptions } from '@/hooks/use-work-options'

interface DailyReportFormEditMobileProps {
  report: DailyReport & {
    site?: any
    work_logs?: any[]
    weather_conditions?: any
    photo_groups?: any[]
    worker_entries?: any[]
    receipts?: any[]
    additional_photos?: any[]
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
  beforePhotos: File[]
  afterPhotos: File[]
  beforePhotoPreviews: string[]
  afterPhotoPreviews: string[]
}

interface WorkerEntry {
  id: string
  worker_id: string
  labor_hours: number
  worker_name?: string
  is_direct_input?: boolean
}

interface ReceiptEntry {
  id: string
  category: string
  amount: string
  date: string
  file: File | null
  preview?: string | null
}

// Mobile-optimized section component
const MobileSection = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  badge,
  icon: Icon,
  required = false,
  className = ""
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: number | string
  icon?: React.ComponentType<{ className?: string }>
  required?: boolean
  className?: string
}) => {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </span>
            {required && (
              <span className="text-red-500 text-sm">*</span>
            )}
            {badge !== undefined && badge !== 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  )
}

export default function DailyReportFormEditMobile({ 
  report, 
  currentUser, 
  sites = [], 
  materials = [], 
  workers = [] 
}: DailyReportFormEditMobileProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Section expansion states - mobile optimized defaults
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true, // Always expanded
    workContent: true, // Important - expanded by default
    workers: false,
    additionalPhotos: false,
    receipts: false,
    drawings: false,
    requests: false,
    materials: false,
    specialNotes: false
  })

  // Load work options from database
  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()

  // Form state
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
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([])
  const [additionalBeforePhotos, setAdditionalBeforePhotos] = useState<AdditionalPhotoData[]>([])
  const [additionalAfterPhotos, setAdditionalAfterPhotos] = useState<AdditionalPhotoData[]>([])
  const [requestText, setRequestText] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')

  // Initialize data from existing report
  useEffect(() => {
    // Initialize work contents
    if (report.work_logs && report.work_logs.length > 0) {
      const convertedWorkContents = report.work_logs.map((log: any, index: number) => ({
        id: log.id || `existing-${index}`,
        memberName: log.work_type || report.member_name || '',
        processType: log.location || report.process_type || '',
        workSection: log.description || '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: []
      }))
      setWorkContents(convertedWorkContents)
    } else if (report.member_name || report.process_type) {
      const defaultWorkContent: WorkContentEntry = {
        id: 'default-1',
        memberName: report.member_name || '',
        processType: report.process_type || '',
        workSection: '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: []
      }
      setWorkContents([defaultWorkContent])
    }

    // Initialize other data
    if (report.notes) {
      setSpecialNotes(report.notes)
    }
  }, [report])

  // Section toggle
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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
    // Auto-expand section when adding
    setExpandedSections(prev => ({ ...prev, workContent: true }))
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

      toast.success(`${filesToAdd.length}개 사진이 추가되었습니다`)
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('사진 업로드 중 오류가 발생했습니다')
    }
  }, [workContents])

  // Photo deletion
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

  // Worker handlers
  const handleAddWorkerEntry = () => {
    const newWorkerEntry: WorkerEntry = {
      id: `worker-${Date.now()}`,
      worker_id: '',
      labor_hours: 1.0,
      is_direct_input: true
    }
    setWorkerEntries([...workerEntries, newWorkerEntry])
    setExpandedSections(prev => ({ ...prev, workers: true }))
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
    setExpandedSections(prev => ({ ...prev, receipts: true }))
  }

  const handleUpdateReceipt = (id: string, field: keyof ReceiptEntry, value: any) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === id ? { ...receipt, [field]: value } : receipt
    ))
  }

  const handleRemoveReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id))
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
        
        // Validate each work content entry
        for (let i = 0; i < workContents.length; i++) {
          const content = workContents[i]
          if (!content.memberName || content.memberName.trim() === '') {
            throw new Error(`작업 ${i + 1}의 부재명을 선택해주세요`)
          }
          if (content.memberName === '기타' && (!content.memberNameOther || content.memberNameOther.trim() === '')) {
            throw new Error(`작업 ${i + 1}의 기타 부재명을 입력해주세요`)
          }
          if (!content.processType || content.processType.trim() === '') {
            throw new Error(`작업 ${i + 1}의 작업공정을 선택해주세요`)
          }
          if (content.processType === '기타' && (!content.processTypeOther || content.processTypeOther.trim() === '')) {
            throw new Error(`작업 ${i + 1}의 기타 작업공정을 입력해주세요`)
          }
        }
        
        // Validate worker entries
        for (let i = 0; i < workerEntries.length; i++) {
          const entry = workerEntries[i]
          if (!entry.worker_name || entry.worker_name.trim() === '') {
            throw new Error(`작업자 ${i + 1}의 이름을 입력해주세요`)
          }
          if (!entry.labor_hours || entry.labor_hours <= 0) {
            throw new Error(`작업자 ${i + 1}의 투입 공수를 선택해주세요`)
          }
        }
      }

      // Prepare data
      const updateData = {
        ...formData,
        work_contents: workContents,
        worker_entries: workerEntries,
        receipts: receipts.map(r => ({ ...r, file: null })),
        request_text: requestText,
        special_notes: specialNotes,
        additional_before_photos: additionalBeforePhotos,
        additional_after_photos: additionalAfterPhotos,
        updated_at: new Date().toISOString()
      }

      // Update report
      const updateResult = await updateDailyReport(report.id, updateData)

      if (!updateResult.success) {
        showErrorNotification(updateResult.error || '일일보고서 수정에 실패했습니다', 'handleSubmit')
        return
      }

      // Submit if requested
      if (submitForApproval) {
        const submitResult = await submitDailyReport(report.id)
        if (!submitResult.success) {
          showErrorNotification(submitResult.error || '일일보고서 제출에 실패했습니다', 'handleSubmit')
          return
        }
      }

      const successMessage = submitForApproval 
        ? '일일보고서가 성공적으로 제출되었습니다.'
        : '일일보고서가 성공적으로 수정되었습니다.'
      toast.success(successMessage)

      router.push(`/dashboard/daily-reports/${report.id}`)
    } catch (err) {
      showErrorNotification(err, 'handleSubmit')
      setError(err instanceof Error ? err.message : '일일보고서 수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  작업일지 수정
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {report.site?.name} • {report.work_date}
                </p>
              </div>
            </div>
            
            <Badge variant={report.status === 'draft' ? 'secondary' : 'default'} className="text-xs">
              {report.status === 'draft' ? '임시저장' : '제출됨'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Section 1: 기본 정보 (Always expanded) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                기본 정보
              </h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Site and Date - Read only */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  현장
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  {sites.find(s => s.id === formData.site_id)?.name || '현장 선택'}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  작업일자
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  {formData.work_date}
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                부재명 <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.member_name}
                onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                placeholder="슬라브, 거더, 기둥 등"
                className="h-10 text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                공정 <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.process_type}
                onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
                placeholder="균열, 면, 마감 등"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                작업자 수 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.total_workers}
                onChange={(e) => setFormData({ ...formData, total_workers: parseInt(e.target.value) || 0 })}
                placeholder="작업자 수를 입력하세요"
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: 작업 내용 및 사진 */}
        <MobileSection
          title="작업 내용 및 사진"
          isExpanded={expandedSections.workContent}
          onToggle={() => toggleSection('workContent')}
          badge={workContents.length}
          icon={Camera}
          required={true}
        >
          <div className="space-y-4">
            {workContents.map((workContent, index) => (
              <div key={workContent.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    작업 내용 {index + 1}
                  </h4>
                  <button
                    onClick={() => handleRemoveWorkContent(workContent.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">부재명 <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={workContent.memberName || ''}
                      onValueChange={(value) => handleUpdateWorkContent(workContent.id, 'memberName', value)}
                    >
                      <CustomSelectTrigger className="h-9 text-sm">
                        <CustomSelectValue placeholder="선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {componentTypes.map((type) => (
                          <CustomSelectItem key={type.id} value={type.option_label}>
                            {type.option_label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                    {workContent.memberName === '기타' && (
                      <Input
                        className="h-9 text-sm mt-2"
                        value={workContent.memberNameOther || ''}
                        onChange={(e) => handleUpdateWorkContent(workContent.id, 'memberNameOther', e.target.value)}
                        placeholder="기타 부재명 입력"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">작업공정 <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={workContent.processType || ''}
                      onValueChange={(value) => handleUpdateWorkContent(workContent.id, 'processType', value)}
                    >
                      <CustomSelectTrigger className="h-9 text-sm">
                        <CustomSelectValue placeholder="선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {processTypes.map((type) => (
                          <CustomSelectItem key={type.id} value={type.option_label}>
                            {type.option_label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                    {workContent.processType === '기타' && (
                      <Input
                        className="h-9 text-sm mt-2"
                        value={workContent.processTypeOther || ''}
                        onChange={(e) => handleUpdateWorkContent(workContent.id, 'processTypeOther', e.target.value)}
                        placeholder="기타 작업공정 입력"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">작업 구간</label>
                    <Input
                      value={workContent.workSection}
                      onChange={(e) => handleUpdateWorkContent(workContent.id, 'workSection', e.target.value)}
                      placeholder="예: 3층 A구역"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Photos */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before Photos */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
                        작업 전 사진
                      </label>
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(workContent.id, 'before', e.target.files)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <Camera className="h-5 w-5 mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-1 text-center">사진 추가</p>
                        </div>
                      </label>
                      
                      {workContent.beforePhotoPreviews.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {workContent.beforePhotoPreviews.map((preview, idx) => (
                            <div key={idx} className="relative">
                              <img 
                                src={preview} 
                                alt={`작업 전 ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                onClick={() => handlePhotoDelete(workContent.id, 'before', idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* After Photos */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
                        작업 후 사진
                      </label>
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(workContent.id, 'after', e.target.files)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <Camera className="h-5 w-5 mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-1 text-center">사진 추가</p>
                        </div>
                      </label>
                      
                      {workContent.afterPhotoPreviews.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {workContent.afterPhotoPreviews.map((preview, idx) => (
                            <div key={idx} className="relative">
                              <img 
                                src={preview} 
                                alt={`작업 후 ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                onClick={() => handlePhotoDelete(workContent.id, 'after', idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {workContents.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">작업 내용을 추가해주세요</p>
              </div>
            )}

            <Button
              onClick={handleAddWorkContent}
              variant="outline"
              className="w-full h-10 touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              작업 추가
            </Button>
          </div>
        </MobileSection>

        {/* Section 3: 작업자 입력 */}
        <MobileSection
          title="작업자 입력"
          isExpanded={expandedSections.workers}
          onToggle={() => toggleSection('workers')}
          badge={workerEntries.length}
          icon={Users}
        >
          <div className="space-y-3">
            {workerEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">작업자</h4>
                  <button
                    onClick={() => handleRemoveWorkerEntry(entry.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded touch-manipulation"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  <Input
                    value={entry.worker_name || ''}
                    onChange={(e) => handleUpdateWorkerEntry(entry.id, 'worker_name', e.target.value)}
                    placeholder="작업자 이름"
                    className="h-9 text-sm"
                  />
                  
                  <CustomSelect
                    value={entry.labor_hours.toString()}
                    onValueChange={(value) => handleUpdateWorkerEntry(entry.id, 'labor_hours', parseFloat(value))}
                  >
                    <CustomSelectTrigger className="h-9 text-sm">
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="0.5">0.5 공수</CustomSelectItem>
                      <CustomSelectItem value="1.0">1.0 공수</CustomSelectItem>
                      <CustomSelectItem value="1.5">1.5 공수</CustomSelectItem>
                      <CustomSelectItem value="2.0">2.0 공수</CustomSelectItem>
                      <CustomSelectItem value="2.5">2.5 공수</CustomSelectItem>
                      <CustomSelectItem value="3.0">3.0 공수</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
            ))}

            {workerEntries.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">작업자를 추가해주세요</p>
              </div>
            )}

            <Button
              onClick={handleAddWorkerEntry}
              variant="outline"
              className="w-full h-10 touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              작업자 추가
            </Button>
          </div>
        </MobileSection>

        {/* Section 4: 추가 사진 */}
        <MobileSection
          title="추가 사진 업로드"
          isExpanded={expandedSections.additionalPhotos}
          onToggle={() => toggleSection('additionalPhotos')}
          badge={additionalBeforePhotos.length + additionalAfterPhotos.length}
          icon={ImageIcon}
        >
          <div className="space-y-4">
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">추가 사진을 업로드해주세요</p>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 touch-manipulation"
            >
              <Upload className="h-4 w-4 mr-2" />
              사진 선택
            </Button>
          </div>
        </MobileSection>

        {/* Section 5: 영수증 */}
        <MobileSection
          title="영수증 첨부"
          isExpanded={expandedSections.receipts}
          onToggle={() => toggleSection('receipts')}
          badge={receipts.length}
          icon={Receipt}
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAddReceipt}
              className="w-full h-10 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm touch-manipulation flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              영수증 추가
            </button>

            {receipts.map((receipt) => (
              <div key={receipt.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">영수증</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveReceipt(receipt.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors touch-manipulation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">구분</label>
                      <input
                        value={receipt.category || ''}
                        onChange={(e) => handleUpdateReceipt(receipt.id, 'category', e.target.value)}
                        placeholder="예: 자재비"
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">금액</label>
                      <input
                        type="number"
                        value={receipt.amount || ''}
                        onChange={(e) => handleUpdateReceipt(receipt.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">일자</label>
                    <input
                      type="date"
                      value={receipt.date || ''}
                      onChange={(e) => handleUpdateReceipt(receipt.id, 'date', e.target.value)}
                      className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">파일 첨부</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      capture="environment"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0]
                          handleUpdateReceipt(receipt.id, 'file', file)
                          
                          // 미리보기 생성
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              handleUpdateReceipt(receipt.id, 'preview', e.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          } else {
                            handleUpdateReceipt(receipt.id, 'preview', null)
                          }
                        }
                      }}
                      className="w-full text-xs text-gray-700 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
                    />
                  </div>
                  {receipt.preview && (
                    <div className="mt-2">
                      <img
                        src={receipt.preview}
                        alt="영수증 미리보기"
                        className="h-20 w-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {receipts.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">영수증을 추가해주세요</p>
              </div>
            )}

            <Button
              onClick={handleAddReceipt}
              variant="outline"
              className="w-full h-10 touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              영수증 추가
            </Button>
          </div>
        </MobileSection>

        {/* Section 6: 진행 도면 */}
        <MobileSection
          title="진행 도면 업로드"
          isExpanded={expandedSections.drawings}
          onToggle={() => toggleSection('drawings')}
          icon={FolderOpen}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              도면 마킹 도구에서 생성된 마킹 도면을 첨부하세요
            </p>
            
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
              />
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <Upload className="h-6 w-6 mx-auto text-indigo-400" />
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2 text-center">
                  도면 파일 선택
                </p>
              </div>
            </label>
          </div>
        </MobileSection>

        {/* Section 7: 본사 요청 */}
        <MobileSection
          title="본사에게 요청"
          isExpanded={expandedSections.requests}
          onToggle={() => toggleSection('requests')}
          icon={MessageSquare}
        >
          <div>
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="본사에 요청할 내용을 입력하세요 (예: 자재 요청, 기술 지원 등)"
              rows={4}
              className="w-full text-sm"
            />
          </div>
        </MobileSection>

        {/* Section 8: NPC-1000 자재관리 */}
        <MobileSection
          title="NPC-1000 자재관리"
          isExpanded={expandedSections.materials}
          onToggle={() => toggleSection('materials')}
          icon={Package}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                입고량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_incoming}
                onChange={(e) => setFormData({ ...formData, npc1000_incoming: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                사용량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_used}
                onChange={(e) => setFormData({ ...formData, npc1000_used: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                잔량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_remaining}
                onChange={(e) => setFormData({ ...formData, npc1000_remaining: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </MobileSection>

        {/* Section 9: 특이사항 */}
        <MobileSection
          title="특이사항"
          isExpanded={expandedSections.specialNotes}
          onToggle={() => toggleSection('specialNotes')}
          icon={AlertTriangle}
        >
          <div>
            <Textarea
              value={specialNotes}
              onChange={(e) => {
                setSpecialNotes(e.target.value)
                setFormData({ ...formData, notes: e.target.value })
              }}
              placeholder="현장에서 발생한 특이사항이나 전달사항을 입력하세요"
              rows={4}
              className="w-full text-sm"
            />
          </div>
        </MobileSection>
      </div>

      {/* Fixed Bottom Actions - Mobile optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-safe z-20">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-1 h-12 touch-manipulation"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? '저장 중...' : '임시저장'}
          </Button>
          
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.member_name.trim() || !formData.process_type.trim() || formData.total_workers <= 0}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white touch-manipulation"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2" />
            )}
            제출
          </Button>
        </div>
      </div>
    </div>
  )
}