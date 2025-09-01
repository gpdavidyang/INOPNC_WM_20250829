'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
import { addBulkAttendance } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from '@/components/ui/custom-select'
import { 
  Calendar, 
  Cloud, 
  Thermometer, 
  Plus, 
  Trash2, 
  Save, 
  Send,
  Upload,
  Users,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Camera,
  Receipt,
  Map,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Image as ImageIcon,
  MoreHorizontal,
  FolderOpen,
  CameraIcon,
  Eye
} from 'lucide-react'
import { Site, Profile, Material, PhotoGroup, ComponentType, ConstructionProcessType } from '@/types'
import { AdditionalPhotoData } from '@/types/daily-reports'
import PhotoGridPreview from './photo-grid-preview'
import PDFReportGenerator from './pdf-report-generator'
import AdditionalPhotoUploadSection from './additional-photo-upload-section'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormProps {
  sites: Site[]
  currentUser: Profile
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

// Compact collapsible section component
const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isExpanded, 
  onToggle,
  badge,
  required = false 
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  required?: boolean
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {badge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function DailyReportFormEnhanced({ 
  sites, 
  currentUser, 
  materials = [], 
  workers = [] 
}: DailyReportFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  // console.log('DailyReportFormEnhanced props:', { sites, sitesCount: sites?.length })
  
  // Section expansion states (sections 2-10 are collapsible)
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

  // Form state - Header (Section 1) - Updated to match actual DB schema
  const [formData, setFormData] = useState({
    site_id: (currentUser as any).site_id || '',
    work_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    member_name: '', // Required field
    process_type: '', // Required field  
    total_workers: 0,
    npc1000_incoming: 0,
    npc1000_used: 0,
    npc1000_remaining: 0,
    issues: '',
    created_by: currentUser.full_name
  })

  // Section 3: Work Content
  const [workContents, setWorkContents] = useState<WorkContentEntry[]>([])
  
  // Section 3: Workers
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>([])
  const [siteWorkers, setSiteWorkers] = useState<Profile[]>([])
  const [workersLoading, setWorkersLoading] = useState(false)
  
  // Section 4: Photos (Legacy)
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before')
  
  // PDF 생성 관련 state
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfPhotoGroups, setPDFPhotoGroups] = useState<PhotoGroup[]>([])
  const [showDrawingModal, setShowDrawingModal] = useState(false)
  const [showMarkupListModal, setShowMarkupListModal] = useState(false)
  const [markupDocuments, setMarkupDocuments] = useState<any[]>([])
  const [loadingMarkupDocs, setLoadingMarkupDocs] = useState(false)
  
  // Section 5: Receipts
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([])
  
  // Section 5.5: Additional Photos
  const [additionalBeforePhotos, setAdditionalBeforePhotos] = useState<AdditionalPhotoData[]>([])
  const [additionalAfterPhotos, setAdditionalAfterPhotos] = useState<AdditionalPhotoData[]>([])
  
  // Section 6: Drawings
  const [drawings, setDrawings] = useState<File[]>([])
  
  // Section 8: Requests
  const [requestText, setRequestText] = useState<string>('')
  const [requestFiles, setRequestFiles] = useState<File[]>([])
  
  // Section 9: NPC-1000 Materials
  const [materialData, setMaterialData] = useState<MaterialEntry>({
    incoming: '',
    used: '',
    remaining: ''
  })


  // Auto-calculate remaining quantity when incoming or used changes
  const updateMaterialData = (field: keyof MaterialEntry, value: string) => {
    const newData = { ...materialData, [field]: value }
    
    // Auto-calculate remaining = incoming - used
    if (field === 'incoming' || field === 'used') {
      const incoming = parseFloat(newData.incoming) || 0
      const used = parseFloat(newData.used) || 0
      const remaining = Math.max(0, incoming - used) // Ensure non-negative
      newData.remaining = remaining.toString()
    }
    
    setMaterialData(newData)
  }
  
  // Section 10: Special Notes
  const [specialNotes, setSpecialNotes] = useState<string>('')

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const reportData = {
      formData,
      workContents,
      workerEntries,
      photos: photos.map(p => ({ ...p, file: null, preview: p.preview })), // Don't save file objects
      receipts: receipts.map(r => ({ ...r, file: null })),
      additionalBeforePhotos: additionalBeforePhotos.map(p => ({ ...p, file: null })),
      additionalAfterPhotos: additionalAfterPhotos.map(p => ({ ...p, file: null })),
      requestText,
      materialData,
      specialNotes,
      expandedSections,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('dailyReportDraft', JSON.stringify(reportData))
  }, [formData, workContents, workerEntries, photos, receipts, additionalBeforePhotos, additionalAfterPhotos, requestText, materialData, specialNotes, expandedSections])

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dailyReportDraft')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData({
          site_id: parsed.formData?.site_id || (currentUser as any).site_id || '',
          work_date: parsed.formData?.work_date || new Date().toISOString().split('T')[0],
          member_name: parsed.formData?.member_name || '',
          process_type: parsed.formData?.process_type || '',
          total_workers: parsed.formData?.total_workers || 0,
          npc1000_incoming: parsed.formData?.npc1000_incoming || 0,
          npc1000_used: parsed.formData?.npc1000_used || 0,
          npc1000_remaining: parsed.formData?.npc1000_remaining || 0,
          issues: parsed.formData?.issues || '',
          created_by: parsed.formData?.created_by || currentUser.full_name
        })
        setWorkContents(parsed.workContents || [])
        setWorkerEntries(parsed.workerEntries || [])
        setRequestText(parsed.requestText || '')
        const loadedMaterialData = {
          incoming: parsed.materialData?.incoming || '',
          used: parsed.materialData?.used || '',
          remaining: parsed.materialData?.remaining || ''
        }
        // Recalculate remaining on load if incoming/used exist
        if (loadedMaterialData.incoming || loadedMaterialData.used) {
          const incoming = parseFloat(loadedMaterialData.incoming) || 0
          const used = parseFloat(loadedMaterialData.used) || 0
          loadedMaterialData.remaining = Math.max(0, incoming - used).toString()
        }
        setMaterialData(loadedMaterialData)
        setSpecialNotes(parsed.specialNotes || '')
        setAdditionalBeforePhotos(parsed.additionalBeforePhotos || [])
        setAdditionalAfterPhotos(parsed.additionalAfterPhotos || [])
        setExpandedSections(parsed.expandedSections || {
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
      } catch (e) {
        console.error('Failed to load saved draft', e)
      }
    }
  }, []) // Empty dependency array - only run on mount

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [saveToLocalStorage])

  // Load site workers when site_id changes
  useEffect(() => {
    const loadSiteWorkers = async () => {
      if (!formData.site_id) {
        setSiteWorkers([])
        return
      }

      setWorkersLoading(true)
      try {
        const response = await fetch(`/api/admin/sites/${formData.site_id}/workers`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setSiteWorkers(data.data)
        } else {
          console.error('Failed to load site workers:', data.error)
          setSiteWorkers([])
        }
      } catch (error) {
        console.error('Error loading site workers:', error)
        setSiteWorkers([])
      } finally {
        setWorkersLoading(false)
      }
    }

    loadSiteWorkers()
  }, [formData.site_id])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleAllSections = (expand: boolean) => {
    setExpandedSections({
      siteInfo: expand,
      workContent: expand,
      workers: expand,
      photos: expand,
      receipts: expand,
      drawings: expand,
      requests: expand,
      materials: expand,
      specialNotes: expand
    })
    setAllExpanded(expand)
  }

  const handleToggleAll = () => {
    const newExpandState = !allExpanded
    toggleAllSections(newExpandState)
  }

  // Work content handlers
  const addWorkContent = () => {
    const newWorkContent = {
      id: `wc-${Date.now()}`,
      memberName: '',
      processType: '',
      workSection: '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: []
    }
    const updatedWorkContents = [...workContents, newWorkContent]
    setWorkContents(updatedWorkContents)
  }

  const updateWorkContent = (id: string, field: keyof WorkContentEntry, value: string) => {
    setWorkContents(workContents.map(wc => 
      wc.id === id ? { ...wc, [field]: value } : wc
    ))
  }

  const removeWorkContent = (id: string) => {
    setWorkContents(workContents.filter(wc => wc.id !== id))
  }

  // 작업 내용별 사진 업로드 함수 - 모바일 PWA 지원 개선
  const handleWorkContentPhotoUpload = async (workId: string, type: 'before' | 'after', files: File[]) => {
    if (!files || files.length === 0) {
      console.log('No files selected for upload')
      return
    }
    
    try {
      const photosField = type === 'before' ? 'beforePhotos' : 'afterPhotos'
      const previewsField = type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews'
      
      // 현재 작업 내용 찾기
      const currentContent = workContents.find(c => c.id === workId)
      if (!currentContent) {
        console.error('Work content not found:', workId)
        toast.error('작업 내용을 찾을 수 없습니다')
        return
      }
      
      // 파일 유효성 검사
      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}은(는) 이미지 파일이 아닙니다`)
          return false
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast.error(`${file.name}은(는) 파일 크기가 너무 큽니다 (최대 10MB)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) {
        toast.error('유효한 이미지 파일이 없습니다')
        return
      }
      
      const currentPhotos = currentContent[photosField] as File[] || []
      const currentPreviews = currentContent[previewsField] as string[] || []
      const remaining = 10 - currentPhotos.length
      
      if (remaining <= 0) {
        toast.error(`최대 10장까지 업로드 가능합니다`)
        return
      }
      
      const filesToAdd = validFiles.slice(0, remaining)
      console.log(`Adding ${filesToAdd.length} files to ${type} photos`)
      
      // 먼저 파일 배열 업데이트
      const newPhotos = [...currentPhotos, ...filesToAdd]
      const newPreviews: string[] = [...currentPreviews]
      
      // 미리보기 생성을 Promise로 처리
      const previewPromises = filesToAdd.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          try {
            const reader = new FileReader()
            reader.onload = (event) => {
              if (event.target?.result) {
                const result = event.target.result as string
                resolve(result)
              } else {
                reject(new Error(`Failed to read file: ${file.name}`))
              }
            }
            reader.onerror = () => {
              reject(new Error(`FileReader error for: ${file.name}`))
            }
            reader.readAsDataURL(file)
          } catch (error) {
            console.error(`Error setting up FileReader for ${file.name}:`, error)
            reject(error)
          }
        })
      })
      
      try {
        const previews = await Promise.all(previewPromises)
        newPreviews.push(...previews)
        
        // 상태 업데이트
        setWorkContents(prevContents =>
          prevContents.map(content =>
            content.id === workId
              ? {
                  ...content,
                  [photosField]: newPhotos,
                  [previewsField]: newPreviews
                }
              : content
          )
        )
        
        toast.success(`${filesToAdd.length}개 사진이 추가되었습니다`)
      } catch (previewError) {
        console.error('Preview generation error:', previewError)
        // 미리보기 생성 실패해도 파일은 추가
        setWorkContents(prevContents =>
          prevContents.map(content =>
            content.id === workId
              ? {
                  ...content,
                  [photosField]: newPhotos
                }
              : content
          )
        )
        toast.warning('사진이 추가되었지만 미리보기 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      toast.error(`사진 업로드 중 오류가 발생했습니다: ${errorMessage}`)
    }
  }

  // 작업 내용별 사진 삭제 함수
  const removeWorkContentPhoto = (workId: string, type: 'before' | 'after', index: number) => {
    setWorkContents(prevContents =>
      prevContents.map(content => {
        if (content.id !== workId) return content
        
        const photosField = type === 'before' ? 'beforePhotos' : 'afterPhotos'
        const previewsField = type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews'
        
        const newPhotos = [...(content[photosField] as File[])]
        const newPreviews = [...(content[previewsField] as string[])]
        
        newPhotos.splice(index, 1)
        newPreviews.splice(index, 1)
        
        return {
          ...content,
          [photosField]: newPhotos,
          [previewsField]: newPreviews
        }
      })
    )
  }


  // Worker handlers
  const addWorker = () => {
    setWorkerEntries([...workerEntries, {
      id: `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      worker_id: '',
      labor_hours: 1.0,
      worker_name: '',
      is_direct_input: false
    }])
  }

  const updateWorker = (index: number, field: keyof WorkerEntry, value: any) => {
    console.log(`updateWorker called: index=${index}, field=${field}, value=${value}`)
    setWorkerEntries(prevEntries => {
      const newEntries = prevEntries.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
      console.log('New worker entries:', newEntries)
      return newEntries
    })
  }

  const removeWorker = (index: number) => {
    setWorkerEntries(workerEntries.filter((_, i) => i !== index))
  }

  // Photo handlers
  const addPhoto = (type: 'before' | 'after', file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos(prevPhotos => [...prevPhotos, {
        id: `photo-${Date.now()}-${Math.random()}`,
        type,
        file,
        preview: reader.result as string
      }])
    }
    reader.readAsDataURL(file)
  }

  const addMultiplePhotos = (type: 'before' | 'after', files: File[]) => {
    if (files.length === 0) return
    
    const timestamp = Date.now()
    const newPhotos: PhotoEntry[] = []
    let loadedCount = 0
    
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPhotos.push({
          id: `photo-${timestamp}-${index}-${Math.random()}`,
          type,
          file,
          preview: reader.result as string
        })
        
        loadedCount++
        if (loadedCount === files.length) {
          // 모든 파일이 로드된 후 한 번에 상태 업데이트
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotos])
        }
      }
      reader.onerror = () => {
        console.error('파일 읽기 오류:', file.name)
        loadedCount++
        if (loadedCount === files.length) {
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotos])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id))
  }

  // Photo selection modal handlers
  const openPhotoModal = (type: 'before' | 'after') => {
    setCurrentPhotoType(type)
    setShowPhotoModal(true)
  }

  // Drawing selection modal handlers
  const openDrawingModal = () => {
    setShowDrawingModal(true)
  }

  const handleDrawingSelection = (source: 'camera' | 'gallery' | 'file' | 'markup') => {
    setShowDrawingModal(false)
    
    if (source === 'camera') {
      // 카메라로 직접 촬영
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,.pdf,.dwg'
      input.capture = 'environment' // 후면 카메라 사용
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          setDrawings([...drawings, ...Array.from(files)])
        }
      }
      input.click()
    } else if (source === 'gallery') {
      // 사진 갤러리에서 선택
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          setDrawings([...drawings, ...Array.from(files)])
        }
      }
      input.click()
    } else if (source === 'markup') {
      // 도면마킹문서함에서 선택
      setShowMarkupListModal(true)
      if (formData.site_id && markupDocuments.length === 0) {
        fetchMarkupDocuments()
      }
    } else if (source === 'file') {
      // 파일에서 선택
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.dwg,.png,.jpg,.jpeg'
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          setDrawings([...drawings, ...Array.from(files)])
        }
      }
      input.click()
    }
  }

  // 도면마킹문서함 데이터 가져오기
  const fetchMarkupDocuments = async () => {
    setLoadingMarkupDocs(true)
    try {
      const response = await fetch(`/api/markup-documents?site_id=${formData.site_id}`)
      const result = await response.json()
      
      if (result.success) {
        setMarkupDocuments(result.data)
      } else {
        console.error('Failed to fetch markup documents:', result.error)
      }
    } catch (error) {
      console.error('Error fetching markup documents:', error)
    } finally {
      setLoadingMarkupDocs(false)
    }
  }

  // 마크업 문서 선택 핸들러
  const handleMarkupDocumentSelect = async (document: any) => {
    try {
      // 도면 이미지를 File 객체로 변환
      const response = await fetch(document.blueprint_url)
      const blob = await response.blob()
      const file = new File([blob], document.original_blueprint_filename || 'markup.png', { type: blob.type })
      
      // drawings 배열에 추가
      setDrawings([...drawings, file])
      setShowMarkupListModal(false)
      
      showErrorNotification('성공', `${document.title} 도면이 추가되었습니다`, 'success')
    } catch (error) {
      console.error('Error adding markup document:', error)
      showErrorNotification('오류', '도면을 추가할 수 없습니다', 'error')
    }
  }

  const handlePhotoSelection = (source: 'camera' | 'gallery' | 'file') => {
    setShowPhotoModal(false)
    
    if (source === 'camera') {
      // 카메라로 직접 촬영
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // 후면 카메라 사용
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const existingPhotos = photos.filter(p => p.type === currentPhotoType)
          const remaining = 30 - existingPhotos.length
          const filesToAdd = Array.from(files).slice(0, remaining)
          // console.log(`카메라로 촬영된 파일 수: ${files.length}, 추가할 파일 수: ${filesToAdd.length}`)
          addMultiplePhotos(currentPhotoType, filesToAdd)
        }
      }
      input.click()
    } else if (source === 'gallery') {
      // 사진 갤러리에서 선택 (모바일 최적화)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*' // 이미지 파일만
      input.multiple = true
      
      // 모바일에서 갤러리 직접 접근을 위한 설정
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // 모바일에서는 갤러리 접근을 명시적으로 설정
        input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
      }
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const existingPhotos = photos.filter(p => p.type === currentPhotoType)
          const remaining = 30 - existingPhotos.length
          const filesToAdd = Array.from(files).slice(0, remaining)
          // console.log(`갤러리에서 선택된 파일 수: ${files.length}, 추가할 파일 수: ${filesToAdd.length}`)
          addMultiplePhotos(currentPhotoType, filesToAdd)
        }
      }
      input.click()
    } else if (source === 'file') {
      // 파일 시스템에서 선택 (모든 파일 형식 지원)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' // 이미지 + 문서 파일
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const existingPhotos = photos.filter(p => p.type === currentPhotoType)
          const remaining = 30 - existingPhotos.length
          const filesToAdd = Array.from(files).slice(0, remaining)
          // console.log(`파일에서 선택된 파일 수: ${files.length}, 추가할 파일 수: ${filesToAdd.length}`)
          addMultiplePhotos(currentPhotoType, filesToAdd)
        }
      }
      input.click()
    }
  }

  // Receipt handlers
  const addReceipt = () => {
    setReceipts([...receipts, {
      id: `receipt-${Date.now()}`,
      category: '',
      amount: '',
      date: '2025-07-30',
      file: null
    }])
  }

  const updateReceipt = (id: string, field: keyof ReceiptEntry, value: any) => {
    setReceipts(receipts.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const removeReceipt = (id: string) => {
    setReceipts(receipts.filter(r => r.id !== id))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      // Save to localStorage before submit
      saveToLocalStorage()

      // Validate required fields (strict validation only for submission)
      if (!formData.site_id) {
        throw new Error('현장을 선택해주세요')
      }
      
      if (submitForApproval) {
        // Strict validation for submission
        if (workContents.length === 0) {
          throw new Error('작업 내용을 입력해주세요')
        }
        if (workerEntries.length === 0) {
          throw new Error('작업자를 입력해주세요')
        }
      }

      // Create daily report with actual DB schema
      // Extract data from work contents for required fields
      const firstWorkContent = workContents[0]
      const memberName = firstWorkContent?.memberName === '기타' 
        ? (firstWorkContent?.memberNameOther || '미입력')
        : (firstWorkContent?.memberName || '미입력')
      const processType = firstWorkContent?.processType === '기타'
        ? (firstWorkContent?.processTypeOther || '일반작업')
        : (firstWorkContent?.processType || '일반작업')
        
      const reportResult = await createDailyReport({
        site_id: formData.site_id,
        work_date: formData.work_date,
        member_name: memberName,
        process_type: processType,
        total_workers: workerEntries.length,
        npc1000_incoming: parseFloat(materialData.incoming) || 0,
        npc1000_used: parseFloat(materialData.used) || 0,
        npc1000_remaining: parseFloat(materialData.remaining) || 0,
        issues: specialNotes || ''
      }, workerEntries.map(w => ({
        worker_name: w.is_direct_input ? w.worker_name : w.worker_id,
        labor_hours: w.labor_hours || 1.0,
        worker_id: w.worker_id
      })).filter(w => w.worker_name))

      if (!reportResult.success || !reportResult.data) {
        showErrorNotification(reportResult.error || '일일보고서 생성에 실패했습니다', 'handleSubmit')
        return
      }

      const dailyReportId = reportResult.data.id

      // TODO: Save work contents as work logs when work_logs table is created
      // for (const content of workContents) {
      //   await addWorkLog(dailyReportId, {
      //     work_type: content.processType === '기타' ? content.processTypeOther || content.processType : content.processType,
      //     location: content.workSection,
      //     description: `부재명: ${content.memberName === '기타' ? content.memberNameOther || content.memberName : content.memberName}`,
      //     worker_count: workerEntries.length
      //   })
      // }

      // Save attendance records
      if (workerEntries.length > 0) {
        const attendanceData = workerEntries
          .filter(w => w.worker_id || (w.is_direct_input && w.worker_name))
          .map(w => ({
            worker_id: w.worker_id || `direct_${Date.now()}_${Math.random()}`, // Generate ID for direct input
            worker_name: w.is_direct_input ? w.worker_name : undefined, // Include name for direct input
            check_in_time: '08:00',
            check_out_time: w.labor_hours === 1.0 ? '17:00' : '20:00', // Overtime if > 1.0
            work_type: workContents[0]?.processType || '일반작업'
          }))
        
        // TODO: Implement when attendance function is fixed
        // await addBulkAttendance(dailyReportId, attendanceData)
      }

      // Upload photos
      for (const photo of photos) {
        if (photo.file) {
          const formData = new FormData()
          formData.append('file', photo.file)
          formData.append('entity_type', 'daily_report')
          formData.append('entity_id', dailyReportId)
          formData.append('file_type', `photo_${photo.type}`)
          
          const uploadResult = await uploadPhotoToStorage(formData)
          // console.log(`Photo upload result:`, uploadResult)
        }
      }

      // Upload receipts
      for (const receipt of receipts) {
        if (receipt.file) {
          const formData = new FormData()
          formData.append('file', receipt.file)
          formData.append('entity_type', 'daily_report')
          formData.append('entity_id', dailyReportId)
          formData.append('file_type', 'receipt')
          
          const uploadResult = await uploadPhotoToStorage(formData)
          // console.log(`Receipt upload result:`, uploadResult)
        }
      }

      // Submit for approval if requested
      if (submitForApproval) {
        const submitResult = await submitDailyReport(dailyReportId)
        if (!submitResult.success) {
          showErrorNotification(submitResult.error || '일일보고서 제출에 실패했습니다', 'handleSubmit')
          return
        }
      }

      // Clear localStorage after successful submit
      localStorage.removeItem('dailyReportDraft')
      
      // Show success message based on action
      const successMessage = submitForApproval 
        ? '일일보고서가 성공적으로 제출되었습니다.'
        : '일일보고서가 성공적으로 작성되었습니다.'
      toast.success(successMessage)

      // Redirect based on user role
      if (currentUser.role === 'admin' || currentUser.role === 'system_admin') {
        router.push('/dashboard/admin/daily-reports')
      } else {
        router.push('/dashboard/daily-reports')
      }
    } catch (err) {
      showErrorNotification(err, 'handleSubmit')
      setError(err instanceof Error ? err.message : '일일보고서 작성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toggle Button */}
      <div className="mb-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleToggleAll}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
            title={allExpanded ? '모든 섹션 접기' : '모든 섹션 펼치기'}
          >
            {allExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="space-y-3">

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-3">
          {/* Section 1: Basic Info (Always visible, compact) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              기본 정보
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">현장 <span className="text-red-400">*</span></label>
                <CustomSelect
                  value={formData.site_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                >
                  <CustomSelectTrigger className="w-full h-9 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                    <CustomSelectValue placeholder="현장 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700" sideOffset={5} align="start">
                    {sites && sites.length > 0 ? (
                      sites.map(site => (
                        <CustomSelectItem key={site.id} value={site.id}>{site.name}</CustomSelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                        현장 정보가 없습니다
                      </div>
                    )}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업일자 <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={formData.work_date || ''}
                    onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작성자</label>
                  <input 
                    value={formData.created_by || ''} 
                    disabled 
                    className="w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>


            </div>
          </div>

          {/* Section 2: 통합된 작업 내용 및 사진 관리 */}
          <CollapsibleSection
            title="작업 내용 및 사진 관리"
            icon={FileText}
            isExpanded={expandedSections.workContent}
            onToggle={() => toggleSection('workContent')}
            badge={workContents.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">{workContents.length}건</span>
            )}
            required
          >
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={addWorkContent}
                className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                작업 추가
              </button>

              {workContents.map((content, index) => (
                <div key={content.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">작업 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWorkContent(content.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">부재명 <span className="text-red-400">*</span></label>
                        <CustomSelect
                          value={content.memberName || ''}
                          onValueChange={(value) => updateWorkContent(content.id, 'memberName', value)}
                        >
                          <CustomSelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <CustomSelectValue placeholder="선택" />
                          </CustomSelectTrigger>
                          <CustomSelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700" sideOffset={5} align="start">
                            <CustomSelectItem value="슬라브">슬라브</CustomSelectItem>
                            <CustomSelectItem value="거더">거더</CustomSelectItem>
                            <CustomSelectItem value="기둥">기둥</CustomSelectItem>
                            <CustomSelectItem value="기타">기타</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                        {content.memberName === '기타' && (
                          <input
                            className="w-full h-8 px-2 mt-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="기타 부재명"
                            value={content.memberNameOther || ''}
                            onChange={(e) => updateWorkContent(content.id, 'memberNameOther', e.target.value)}
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업공정 <span className="text-red-400">*</span></label>
                        <CustomSelect
                          value={content.processType || ''}
                          onValueChange={(value) => updateWorkContent(content.id, 'processType', value)}
                        >
                          <CustomSelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <CustomSelectValue placeholder="선택" />
                          </CustomSelectTrigger>
                          <CustomSelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700" sideOffset={5} align="start">
                            <CustomSelectItem value="균일">균일</CustomSelectItem>
                            <CustomSelectItem value="면">면</CustomSelectItem>
                            <CustomSelectItem value="마감">마감</CustomSelectItem>
                            <CustomSelectItem value="기타">기타</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                        {content.processType === '기타' && (
                          <input
                            className="w-full h-8 px-2 mt-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="기타 작업공정"
                            value={content.processTypeOther || ''}
                            onChange={(e) => updateWorkContent(content.id, 'processTypeOther', e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">작업 구간</label>
                      <input
                        value={content.workSection || ''}
                        onChange={(e) => updateWorkContent(content.id, 'workSection', e.target.value)}
                        placeholder="예: 3층 A구역"
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>

                    {/* 사진 업로드 영역 */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {/* 작업 전 사진 */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                          <Camera className="h-3.5 w-3.5" />
                          작업 전 사진
                          <span className="text-gray-400">({content.beforePhotos?.length || 0}/10)</span>
                        </label>
                        
                        <div className="space-y-2">
                          {/* 업로드 버튼 - 모바일 최적화 */}
                          <label className="block">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                try {
                                  const files = e.target.files ? Array.from(e.target.files) : []
                                  if (files.length > 0) {
                                    console.log(`Uploading ${files.length} files for work content ${content.id}`)
                                    await handleWorkContentPhotoUpload(content.id, 'before', files)
                                  } else {
                                    console.log('No files selected')
                                  }
                                } catch (error) {
                                  console.error('File upload error:', error)
                                  const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
                                  toast.error(`사진 업로드에 실패했습니다: ${errorMessage}`)
                                } finally {
                                  e.target.value = '' // Reset input for re-selection
                                }
                              }}
                            />
                            <div className="w-full h-8 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 transition-colors cursor-pointer touch-manipulation">
                              <Upload className="h-3.5 w-3.5" />
                              사진 업로드
                            </div>
                          </label>
                          
                          {/* 미리보기 */}
                          {content.beforePhotoPreviews && content.beforePhotoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-1">
                              {content.beforePhotoPreviews.slice(0, 9).map((preview, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`작업 전 ${idx + 1}`}
                                    className="w-full h-12 object-cover rounded border border-gray-200 dark:border-gray-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeWorkContentPhoto(content.id, 'before', idx)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ))}
                              {content.beforePhotoPreviews.length > 9 && (
                                <div className="flex items-center justify-center h-12 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-xs text-gray-500">
                                  +{content.beforePhotoPreviews.length - 9}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 작업 후 사진 */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          작업 후 사진
                          <span className="text-gray-400">({content.afterPhotos?.length || 0}/10)</span>
                        </label>
                        
                        <div className="space-y-2">
                          {/* 업로드 버튼 - 모바일 최적화 */}
                          <label className="block">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                try {
                                  const files = e.target.files ? Array.from(e.target.files) : []
                                  if (files.length > 0) {
                                    console.log(`Uploading ${files.length} files for work content ${content.id}`)
                                    await handleWorkContentPhotoUpload(content.id, 'after', files)
                                  } else {
                                    console.log('No files selected')
                                  }
                                } catch (error) {
                                  console.error('File upload error:', error)
                                  const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
                                  toast.error(`사진 업로드에 실패했습니다: ${errorMessage}`)
                                } finally {
                                  e.target.value = '' // Reset input for re-selection
                                }
                              }}
                            />
                            <div className="w-full h-8 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 active:bg-green-200 dark:active:bg-green-900/40 border border-green-200 dark:border-green-700 rounded flex items-center justify-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 transition-colors cursor-pointer touch-manipulation">
                              <Upload className="h-3.5 w-3.5" />
                              사진 업로드
                            </div>
                          </label>
                          
                          {/* 미리보기 */}
                          {content.afterPhotoPreviews && content.afterPhotoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-1">
                              {content.afterPhotoPreviews.slice(0, 9).map((preview, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`작업 후 ${idx + 1}`}
                                    className="w-full h-12 object-cover rounded border border-gray-200 dark:border-gray-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeWorkContentPhoto(content.id, 'after', idx)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ))}
                              {content.afterPhotoPreviews.length > 9 && (
                                <div className="flex items-center justify-center h-12 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-xs text-gray-500">
                                  +{content.afterPhotoPreviews.length - 9}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {workContents.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  작업 내용을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
                </p>
              )}
              
              {/* PDF 생성 버튼 */}
              {workContents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      // PDF 생성 로직
                      const photoGroupsFromWorkContents = workContents.map(content => ({
                        id: content.id,
                        component_name: content.memberName === '기타' 
                          ? `${content.memberNameOther || '기타'}${content.workSection ? ` (${content.workSection})` : ''}` 
                          : `${content.memberName}${content.workSection ? ` (${content.workSection})` : ''}`,
                        component_type: (
                          content.memberName === '슬라브' ? 'slab' :
                          content.memberName === '거더' ? 'girder' :
                          content.memberName === '기둥' ? 'column' : 'other'
                        ) as ComponentType,
                        process_type: (
                          content.processType === '균일' ? 'uniform' :
                          content.processType === '면' ? 'surface' :
                          content.processType === '마감' ? 'finishing' : 'other'
                        ) as ConstructionProcessType,
                        before_photos: content.beforePhotos.map((file, idx) => ({
                          id: `before-${content.id}-${idx}`,
                          file_url: content.beforePhotoPreviews[idx] || '',
                          stage: 'before' as const
                        })),
                        after_photos: content.afterPhotos.map((file, idx) => ({
                          id: `after-${content.id}-${idx}`,
                          file_url: content.afterPhotoPreviews[idx] || '',
                          stage: 'after' as const
                        })),
                        progress_status: (
                          content.beforePhotos.length > 0 && content.afterPhotos.length > 0 ? 'completed' :
                          content.beforePhotos.length > 0 || content.afterPhotos.length > 0 ? 'in_progress' : 'not_started'
                        ) as PhotoGroup['progress_status'],
                        notes: '',
                        daily_report_id: formData.id || 'temp',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }))
                      
                      // PDF 생성 모달 열기
                      setShowPDFModal(true)
                      setPDFPhotoGroups(photoGroupsFromWorkContents)
                    }}
                    className="w-full h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    사진대지 PDF 생성
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 3: Workers */}
          <CollapsibleSection
            title="작업자 입력"
            icon={Users}
            isExpanded={expandedSections.workers}
            onToggle={() => toggleSection('workers')}
            badge={workerEntries.length > 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">{workerEntries.length}명</span>
            )}
            required
          >
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={addWorker}
                className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                작업자 추가
              </button>

              {workerEntries.map((entry, index) => (
                <div key={entry.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-medium text-gray-700">작업자 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWorker(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업자</label>
                      {entry.is_direct_input ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={entry.worker_name || ''}
                            onChange={(e) => updateWorker(index, 'worker_name', e.target.value)}
                            placeholder="작업자 이름 입력"
                            className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateWorker(index, 'is_direct_input', false)
                              updateWorker(index, 'worker_name', '')
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            목록에서 선택
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <CustomSelect
                            value={entry.worker_id || ''}
                            onValueChange={(value) => {
                              if (value === 'direct_input') {
                                updateWorker(index, 'is_direct_input', true)
                                updateWorker(index, 'worker_id', '')
                              } else {
                                updateWorker(index, 'worker_id', value)
                              }
                            }}
                          >
                            <CustomSelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                              <CustomSelectValue placeholder={
                                !formData.site_id ? "먼저 현장을 선택해주세요" :
                                workersLoading ? "작업자 로딩 중..." :
                                siteWorkers.filter(worker => ['worker', 'site_manager'].includes(worker.role)).length === 0 ? "배정된 작업자가 없습니다" :
                                "선택"
                              } />
                            </CustomSelectTrigger>
                            <CustomSelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700" sideOffset={5} align="start">
                              {!formData.site_id ? (
                                <CustomSelectItem value="no_site" disabled>먼저 현장을 선택해주세요</CustomSelectItem>
                              ) : workersLoading ? (
                                <CustomSelectItem value="loading" disabled>작업자 로딩 중...</CustomSelectItem>
                              ) : siteWorkers.filter(worker => ['worker', 'site_manager'].includes(worker.role)).length === 0 ? (
                                <CustomSelectItem value="no_workers" disabled>배정된 작업자가 없습니다</CustomSelectItem>
                              ) : (
                                <>
                                  {siteWorkers
                                    .filter(worker => ['worker', 'site_manager'].includes(worker.role))
                                    .map(worker => (
                                      <CustomSelectItem key={worker.id} value={worker.id}>
                                        {worker.full_name} ({worker.role === 'worker' ? '작업자' : worker.role === 'site_manager' ? '현장관리자' : worker.role})
                                      </CustomSelectItem>
                                    ))}
                                </>
                              )}
                              <CustomSelectItem value="direct_input">
                                <div className="flex items-center gap-2">
                                  <Plus className="h-3 w-3" />
                                  직접 입력
                                </div>
                              </CustomSelectItem>
                            </CustomSelectContent>
                          </CustomSelect>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">공수</label>
                      <CustomSelect
                        value={(entry.labor_hours || 1.0).toFixed(1)}
                        onValueChange={(value) => {
                          console.log(`Updating worker ${index} labor_hours from ${(entry.labor_hours || 1.0).toFixed(1)} to ${value}, parsed:`, parseFloat(value))
                          const parsedValue = parseFloat(value)
                          if (!isNaN(parsedValue)) {
                            updateWorker(index, 'labor_hours', parsedValue)
                          }
                        }}
                      >
                        <CustomSelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <CustomSelectValue placeholder="공수 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent 
                          className="bg-white dark:bg-gray-800 border dark:border-gray-700"
                          sideOffset={5}
                          align="start"
                        >
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
                </div>
              ))}

              {workerEntries.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  작업자를 추가하려면 &quot;작업자 추가&quot; 버튼을 클릭하세요
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 3.5: Additional Photos */}
          <CollapsibleSection
            title="추가 사진 업로드"
            icon={Camera}
            isExpanded={expandedSections.additionalPhotos}
            onToggle={() => toggleSection('additionalPhotos')}
            badge={(additionalBeforePhotos.length + additionalAfterPhotos.length) > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                {additionalBeforePhotos.length + additionalAfterPhotos.length}장
              </span>
            )}
          >
            <div className="pt-2">
              <AdditionalPhotoUploadSection
                beforePhotos={additionalBeforePhotos}
                afterPhotos={additionalAfterPhotos}
                onBeforePhotosChange={setAdditionalBeforePhotos}
                onAfterPhotosChange={setAdditionalAfterPhotos}
                maxPhotosPerType={30}
                maxFileSize={10 * 1024 * 1024} // 10MB
                disabled={false}
              />
            </div>
          </CollapsibleSection>

          {/* Section 4: Receipts */}
          <CollapsibleSection
            title="영수증 첨부"
            icon={Receipt}
            isExpanded={expandedSections.receipts}
            onToggle={() => toggleSection('receipts')}
            badge={receipts.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">{receipts.length}개</span>
            )}
          >
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={addReceipt}
                className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                영수증 추가
              </button>

              {receipts.map((receipt: any) => (
                <div key={receipt.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">영수증</h4>
                    <button
                      type="button"
                      onClick={() => removeReceipt(receipt.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">구분</label>
                        <input
                          value={receipt.category || ''}
                          onChange={(e) => updateReceipt(receipt.id, 'category', e.target.value)}
                          placeholder="예: 자재비"
                          className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">금액</label>
                        <input
                          type="number"
                          value={receipt.amount || ''}
                          onChange={(e) => updateReceipt(receipt.id, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">일자</label>
                      <input
                        type="date"
                        value={receipt.date || ''}
                        onChange={(e) => updateReceipt(receipt.id, 'date', e.target.value)}
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">파일 첨부</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0]
                            updateReceipt(receipt.id, 'file', file)
                            
                            // 미리보기 생성
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                updateReceipt(receipt.id, 'preview', e.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            } else {
                              updateReceipt(receipt.id, 'preview', null)
                            }
                          }
                        }}
                        className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                      
                      {/* 파일 정보 및 미리보기 */}
                      {receipt.file && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                {receipt.file.type.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                ) : receipt.file.type === 'application/pdf' ? (
                                  <FileText className="h-4 w-4 text-red-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {receipt.file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(receipt.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateReceipt(receipt.id, 'file', null)
                                updateReceipt(receipt.id, 'preview', null)
                              }}
                              className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 hover:text-red-600 transition-colors"
                              title="파일 삭제"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          
                          {/* 이미지 미리보기 */}
                          {receipt.preview && (
                            <div className="mt-2">
                              <div className="relative group cursor-pointer" onClick={() => {
                                // 전체화면 미리보기 모달 열기
                                const modal = document.createElement('div')
                                modal.className = 'fixed inset-0 z-[200] bg-black bg-opacity-90 flex items-center justify-center p-4'
                                modal.innerHTML = `
                                  <div class="relative max-w-full max-h-full">
                                    <img src="${receipt.preview}" alt="영수증 전체보기" class="max-w-full max-h-full object-contain rounded shadow-2xl" />
                                    <button class="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors" onclick="document.body.removeChild(this.closest('.fixed'))">
                                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                      </svg>
                                    </button>
                                    <div class="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center">
                                      <p class="text-sm font-medium">영수증 미리보기</p>
                                      <p class="text-xs text-gray-300 mt-1">클릭하거나 ESC 키로 닫기</p>
                                    </div>
                                  </div>
                                `
                                modal.onclick = (e) => {
                                  if (e.target === modal) {
                                    document.body.removeChild(modal)
                                  }
                                }
                                // ESC 키로 모달 닫기
                                const handleKeyDown = (e) => {
                                  if (e.key === 'Escape') {
                                    document.body.removeChild(modal)
                                    document.removeEventListener('keydown', handleKeyDown)
                                  }
                                }
                                document.addEventListener('keydown', handleKeyDown)
                                document.body.appendChild(modal)
                              }}>
                                <img 
                                  src={receipt.preview} 
                                  alt="영수증 미리보기 - 클릭하여 확대" 
                                  className="w-full max-h-32 object-contain rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 transition-all duration-200 group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-lg"
                                />
                                
                                {/* 호버 오버레이 */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                  <div className="bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                                    클릭하여 확대보기
                                  </div>
                                </div>
                                
                                {/* 확대 아이콘 */}
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Eye className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* PDF 미리보기 안내 */}
                          {receipt.file.type === 'application/pdf' && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">PDF 파일</p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">작업일지 제출 후 확인 가능합니다</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {receipts.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  영수증을 추가하려면 &quot;영수증 추가&quot; 버튼을 클릭하세요
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 7: Drawing Upload */}
          <CollapsibleSection
            title="진행 도면 업로드"
            icon={Map}
            isExpanded={expandedSections.drawings}
            onToggle={() => toggleSection('drawings')}
            badge={drawings.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">{drawings.length}개</span>
            )}
          >
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">
                도면 마킹 도구에서 생성된 마킹 도면을 첨부하세요
              </p>
              
              <button
                type="button"
                onClick={openDrawingModal}
                className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-indigo-200 dark:border-indigo-600 rounded bg-indigo-50/30 dark:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer"
              >
                <Map className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">클릭하여 도면 파일 선택</p>
              </button>

              {drawings.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {drawings.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setDrawings(drawings.filter((_, i) => i !== index))}
                        className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 8: Requests */}
          <CollapsibleSection
            title="본사에게 요청"
            icon={MessageSquare}
            isExpanded={expandedSections.requests}
            onToggle={() => toggleSection('requests')}
            badge={requestText && <Check className="h-4 w-4 text-green-400" />}
          >
            <div className="pt-2 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">요청 내용</label>
                <textarea
                  value={requestText || ''}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="본사에게 요청하고 싶은 사항을 작성하세요"
                  rows={3}
                  className="w-full px-2 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">파일 첨부</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setRequestFiles([...requestFiles, ...Array.from(e.target.files)])
                    }
                  }}
                  className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {requestFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {requestFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setRequestFiles(requestFiles.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 9: NPC-1000 Materials */}
          <CollapsibleSection
            title="NPC-1000 자재관리"
            icon={Package}
            isExpanded={expandedSections.materials}
            onToggle={() => toggleSection('materials')}
            badge={(materialData.incoming || materialData.used || materialData.remaining) && (
              <Check className="h-4 w-4 text-green-400" />
            )}
          >
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">
                현장별 재고 관리를 위한 NPC-1000 자재 현황을 입력하세요
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">입고량</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={materialData.incoming || ''}
                    onChange={(e) => updateMaterialData('incoming', e.target.value)}
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">사용량</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={materialData.used || ''}
                    onChange={(e) => updateMaterialData('used', e.target.value)}
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    재고량 
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">(자동계산)</span>
                  </label>
                  <input
                    type="number"
                    value={materialData.remaining || ''}
                    readOnly
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 10: Special Notes */}
          <CollapsibleSection
            title="특이사항"
            icon={AlertCircle}
            isExpanded={expandedSections.specialNotes}
            onToggle={() => toggleSection('specialNotes')}
            badge={specialNotes && <Check className="h-4 w-4 text-green-400" />}
          >
            <div className="pt-2">
              <textarea
                value={specialNotes || ''}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="특이사항을 자유롭게 입력하세요"
                rows={4}
                className="w-full px-2 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              />
            </div>
          </CollapsibleSection>
        </form>
        
        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading || !formData.site_id}
            className="flex-1 h-11 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            임시저장
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.site_id || workContents.length === 0 || workerEntries.length === 0}
            className="flex-1 h-11 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            제출
          </button>
        </div>
      </div>

      {/* Photo Selection Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-md p-6 pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            {/* Modal handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">사진 선택</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${currentPhotoType === 'before' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <p className={`text-sm font-bold ${currentPhotoType === 'before' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  {currentPhotoType === 'before' ? '작업전' : '작업후'} 사진을 어떻게 추가하시겠어요?
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handlePhotoSelection('camera')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <Camera className="h-6 w-6" />
                <span className="font-medium text-base">카메라로 촬영</span>
              </button>
              
              <button
                onClick={() => handlePhotoSelection('gallery')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="font-medium text-base">사진 갤러리</span>
              </button>
              
              <button
                onClick={() => handlePhotoSelection('file')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <FolderOpen className="h-6 w-6" />
                <span className="font-medium text-base">파일 업로드</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowPhotoModal(false)}
              className="w-full h-14 mt-6 text-gray-600 dark:text-gray-400 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors touch-manipulation"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Drawing Selection Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowDrawingModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-md p-6 pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            {/* Modal handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">도면 선택</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  진행 도면을 어떻게 추가하시겠어요?
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDrawingSelection('camera')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <Camera className="h-6 w-6" />
                <span className="font-medium text-base">카메라로 촬영</span>
              </button>
              
              <button
                onClick={() => handleDrawingSelection('gallery')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="font-medium text-base">사진 갤러리</span>
              </button>
              
              <button
                onClick={() => handleDrawingSelection('file')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <FolderOpen className="h-6 w-6" />
                <span className="font-medium text-base">파일 업로드</span>
              </button>

              <button
                onClick={() => handleDrawingSelection('markup')}
                className="w-full h-16 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 active:bg-purple-200 dark:active:bg-purple-900/40 border border-purple-200 dark:border-purple-700 rounded-xl flex items-center justify-center gap-3 text-purple-800 dark:text-purple-200 transition-colors touch-manipulation"
              >
                <FileText className="h-6 w-6" />
                <span className="font-medium text-base">도면마킹문서함</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowDrawingModal(false)}
              className="w-full h-14 mt-6 text-gray-600 dark:text-gray-400 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors touch-manipulation"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* PDF 생성 모달 */}
      {showPDFModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPDFModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">사진대지 PDF 미리보기</h2>
                <button
                  onClick={() => setShowPDFModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <PhotoGridPreview
                photoGroups={pdfPhotoGroups}
                siteName={sites.find(s => s.id === formData.site_id)?.name}
                reportDate={formData.work_date}
                reporterName={currentUser.full_name}
              />
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <PDFReportGenerator
                  photoGroups={pdfPhotoGroups}
                  siteId={formData.site_id}
                  siteName={sites.find(s => s.id === formData.site_id)?.name}
                  reportDate={formData.work_date}
                  reporterName={currentUser.full_name}
                  saveToDocumentFolder={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markup Documents List Modal */}
      {showMarkupListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMarkupListModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">도면마킹문서함</h2>
                <button
                  onClick={() => setShowMarkupListModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              {formData.site_id && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  현장: {sites.find(s => s.id === formData.site_id)?.name}
                </p>
              )}
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {loadingMarkupDocs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : markupDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">저장된 도면마킹 문서가 없습니다</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {markupDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleMarkupDocumentSelect(doc)}
                      className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {doc.blueprint_url && (
                          <img 
                            src={doc.blueprint_url} 
                            alt={doc.title}
                            className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {doc.original_blueprint_filename}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>마킹: {doc.markup_count || 0}개</span>
                            <span>{new Date(doc.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 transform -rotate-90" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}