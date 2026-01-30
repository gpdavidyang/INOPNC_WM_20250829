import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Info,
  HardHat,
  Users,
  Package,
  Camera,
  Map as MapIcon,
  FileCheck,
  Trash2,
  Plus,
  RefreshCw,
  Paperclip,
  ChevronLeft,
  Check,
  Eye,
  Copy,
  Edit3,
} from 'lucide-react'
import { WorkLog, Material, MediaFile } from '@inopnc/shared'
// import { workLogService } from '@inopnc/shared';
import PreviewModal from './PreviewModal'

interface WorkLogDetailProps {
  log: WorkLog
  onClose: () => void
  onSave: (updatedLog: WorkLog) => void
  onDuplicate?: (log: WorkLog) => void
}

const MEMBERS = ['슬라브', '거더', '기둥', '기타']
const PROCESSES = ['균열', '면', '마감', '기타']
const TYPES = ['지하', '지상', '지붕', '기타']

const WorkLogDetail: React.FC<WorkLogDetailProps> = ({ log, onClose, onSave, onDuplicate }) => {
  const normalizePhotoTag = (tag?: string) => {
    if (tag === '보수전' || tag === '보수후') return tag
    return '보수후'
  }

  const [formData, setFormData] = useState<WorkLog>({
    ...log,
    photos: (log.photos || []).map(p => ({ ...p, tag: normalizePhotoTag(p.tag) })),
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMaterialSheetOpen, setIsMaterialSheetOpen] = useState(false)

  // Highlight sections
  const [highlightedSections, setHighlightedSections] = useState<string[]>([])

  // Material Sheet State
  const [newMaterial, setNewMaterial] = useState<Material>({ type: 'Worker', name: '', qty: '' })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Upload Refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const drawingInputRef = useRef<HTMLInputElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const replacementInputRef = useRef<HTMLInputElement>(null) // For individual re-upload

  // State for replacement target
  const [replacementTarget, setReplacementTarget] = useState<{
    type: 'photo' | 'drawing'
    id: number
  } | null>(null)

  // Section Refs for scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<{
    type: 'image' | 'drawing'
    src: string
    title: string
    details?: any
  } | null>(null)

  const isApproved = formData.status === 'approved'
  const isDirect = formData.isDirect

  // Unified CSS for editable inputs
  const editInputClass =
    'w-full bg-blue-50/50 border border-blue-200 rounded-lg px-3 py-1.5 text-[16px] font-bold text-text-main focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-right placeholder:text-gray-300'
  const editInputClassLeft =
    'w-full bg-blue-50/50 border border-blue-200 rounded-lg px-3 py-1.5 text-[16px] font-bold text-text-main focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-left placeholder:text-gray-300'

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [previewOpen])

  useEffect(() => {
    setFormData({
      ...log,
      photos: (log.photos || []).map(p => ({ ...p, tag: normalizePhotoTag(p.tag) })),
    })
  }, [log])

  useEffect(() => {
    if (isDirect && formData.status === 'draft') {
      setIsEditMode(true)
    }
  }, [isDirect, formData.status])

  // Logic to determine highlighted sections for animation
  useEffect(() => {
    const sections: string[] = []
    const reason = formData.rejectReason || ''
    const missing = formData.missing || []

    const checkText = (text: string) => {
      if (text.includes('사진')) sections.push('photos')
      if (text.includes('도면')) sections.push('drawings')
      if (text.includes('자재') || text.includes('장비')) sections.push('materials')
      if (text.includes('인원') || text.includes('투입') || text.includes('공수'))
        sections.push('manpower')
      if (text.includes('현장') || text.includes('기본')) sections.push('basic')
      if (text.includes('내용') || text.includes('공정') || text.includes('부재'))
        sections.push('content')
      if (text.includes('확인서')) sections.push('confirmation')
    }

    if (formData.status === 'rejected') {
      checkText(reason)
    }
    missing.forEach(m => checkText(m))

    setHighlightedSections(sections)

    // Scroll to first highlighted section
    if (sections.length > 0) {
      setTimeout(() => {
        const first = sections[0]
        const el = sectionRefs.current[first]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [formData])

  const getSectionClass = (sectionName: string) => {
    if (highlightedSections.includes(sectionName)) {
      if (formData.status === 'rejected') {
        return 'ring-1 ring-red-300 shadow-[0_0_0_2px_rgba(239,68,68,0.05)]'
      } else {
        return 'ring-1 ring-sky-300 shadow-[0_0_0_2px_rgba(14,165,233,0.05)]'
      }
    }
    return ''
  }

  const handleInputChange = (field: keyof WorkLog, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleManpowerChange = (index: number, value: string) => {
    const newManpower = [...formData.manpower]
    newManpower[index] = { ...newManpower[index], worker: value }
    setFormData(prev => ({ ...prev, manpower: newManpower }))
  }

  const handleMaterialChange = (index: number, field: keyof Material, value: string) => {
    const newMaterials = [...formData.materials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    setFormData(prev => ({ ...prev, materials: newMaterials }))
  }

  // Material Actions
  const handleMaterialAdd = () => {
    if (!newMaterial.name || !newMaterial.qty) return
    const materialToAdd = {
      ...newMaterial,
      receipt: receiptFile ? URL.createObjectURL(receiptFile) : undefined,
    }
    setFormData(prev => ({ ...prev, materials: [...prev.materials, materialToAdd] }))
    setNewMaterial({ type: 'Worker', name: '', qty: '' })
    setReceiptFile(null)
    setIsMaterialSheetOpen(false)
  }

  const handleMaterialDelete = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }))
  }

  // --- REPLACEMENT LOGIC ---
  const startReplacement = (e: React.MouseEvent, type: 'photo' | 'drawing', id: number) => {
    e.stopPropagation()
    setReplacementTarget({ type, id })
    replacementInputRef.current?.click()
  }

  const handleReplacementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacementTarget) return

    const newUrl = URL.createObjectURL(file)

    if (replacementTarget.type === 'photo') {
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.map(p => (p.id === replacementTarget.id ? { ...p, url: newUrl } : p)),
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        drawings: prev.drawings.map(d =>
          d.id === replacementTarget.id ? { ...d, url: newUrl } : d
        ),
      }))
    }

    // Reset input
    if (replacementInputRef.current) replacementInputRef.current.value = ''
    setReplacementTarget(null)
  }

  // Photo Actions
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: MediaFile[] = Array.from(e.target.files).map((file: File, idx) => ({
        id: Date.now() + idx,
        url: URL.createObjectURL(file),
        tag: '보수후', // Default to 'After Repair' (Mint)
      }))
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }))
    }
  }

  const handlePhotoDelete = (id: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }))
  }

  const handlePhotosDeleteAll = () => {
    if (window.confirm('모든 사진을 삭제하시겠습니까?')) {
      setFormData(prev => ({ ...prev, photos: [] }))
    }
  }

  const togglePhotoTag = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (isApproved) return

    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map(p => {
        if (p.id === id) {
          // Toggle: 보수후 <-> 보수전
          return { ...p, tag: p.tag === '보수후' ? '보수전' : '보수후' }
        }
        return p
      }),
    }))
  }

  // Drawing Actions
  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDrawings: MediaFile[] = Array.from(e.target.files).map((file: File, idx) => ({
        id: Date.now() + idx,
        url: URL.createObjectURL(file),
        tag: '진행도면', // Default tag
      }))
      setFormData(prev => ({ ...prev, drawings: [...prev.drawings, ...newDrawings] }))
    }
  }

  const handleDrawingDelete = (id: number) => {
    setFormData(prev => ({ ...prev, drawings: prev.drawings.filter(d => d.id !== id) }))
  }

  const handleDrawingsDeleteAll = () => {
    if (window.confirm('모든 도면을 삭제하시겠습니까?')) {
      setFormData(prev => ({ ...prev, drawings: [] }))
    }
  }

  const toggleDrawingTag = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (isApproved) return

    setFormData(prev => ({
      ...prev,
      drawings: prev.drawings.map(d => {
        if (d.id === id) {
          // Toggle: 진행도면 <-> 완료도면
          return { ...d, tag: d.tag === '진행도면' ? '완료도면' : '진행도면' }
        }
        return d
      }),
    }))
  }

  // Confirmation File Actions (Modified for Single File)
  const handleConfirmationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const newFile = {
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }
      // Replace existing file (Max 1)
      setFormData(prev => ({
        ...prev,
        confirmationFiles: [newFile],
      }))
    }
    // Reset input
    if (confirmationInputRef.current) confirmationInputRef.current.value = ''
  }

  const handleConfirmationDelete = () => {
    if (window.confirm('작업완료확인서를 삭제하시겠습니까?')) {
      setFormData(prev => ({ ...prev, confirmationFiles: [] }))
    }
  }

  const openPreview = (item: MediaFile, type: 'image' | 'drawing') => {
    setPreviewTarget({
      type,
      src: item.url,
      title: item.tag || (type === 'drawing' ? '도면' : '사진'),
      details:
        type === 'image'
          ? {
              site: formData.site,
              member: formData.member,
              process: formData.process,
              content: item.tag,
            }
          : undefined,
    })
    setPreviewOpen(true)
  }

  const getStatusBadge = () => {
    switch (formData.status) {
      case 'approved':
        return (
          <span className="bg-[#64748b] text-white px-4 py-2 rounded-lg text-[15px] font-bold">
            승인완료
          </span>
        )
      case 'rejected':
        return (
          <span className="bg-red-500 text-white px-4 py-2 rounded-lg text-[15px] font-bold">
            반려됨
          </span>
        )
      case 'pending':
        return (
          <span className="bg-purple-500 text-white px-4 py-2 rounded-lg text-[15px] font-bold">
            승인요청
          </span>
        )
      default:
        return (
          <span className="bg-primary text-white px-4 py-2 rounded-lg text-[15px] font-bold">
            작성중
          </span>
        )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // --- Render Chip Select UI ---
  const renderChipEdit = (field: keyof WorkLog, options: string[], value: string) => {
    const isCustom = !options.includes(value) && value !== ''
    const activeValue = isCustom ? '기타' : value

    return (
      <div className="w-full">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleInputChange(field, opt)}
              className={`h-[44px] rounded-lg text-[14px] font-bold border transition
                            ${
                              activeValue === opt
                                ? 'bg-white border-primary text-primary shadow-[0_2px_4px_rgba(49,163,250,0.15)] ring-1 ring-primary'
                                : 'bg-[#f8fafc] border-[#e2e8f0] text-text-sub hover:border-gray-300'
                            }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {(activeValue === '기타' || (isCustom && value !== '')) && (
          <input
            autoFocus={activeValue === '기타'}
            className={editInputClassLeft}
            value={value === '기타' ? '' : value}
            onChange={e => handleInputChange(field, e.target.value)}
            placeholder="직접 입력"
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-bg-body z-[2000] flex flex-col animate-slide-up overflow-hidden`}
      >
        {/* Header */}
        <div className="h-[60px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0 max-w-[600px] w-full mx-auto">
          <button onClick={onClose} className="p-2 -ml-2">
            <X className="w-7 h-7 text-text-main" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-text-main">작업일지 상세</span>
            {isDirect && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 font-bold rounded">
                직접등록
              </span>
            )}
          </div>
          {getStatusBadge()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#f2f4f6]">
          <div className="max-w-[600px] mx-auto p-4 pt-4 pb-32 flex flex-col gap-4">
            {/* Edit Hint */}
            {isEditMode && !isApproved && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl py-3 px-4 text-[14px] text-blue-700 font-medium flex items-center justify-center gap-2 shadow-sm">
                <Edit3 className="w-4 h-4" />
                편집 모드 · 파란색 영역을 터치하여 수정하세요.
              </div>
            )}

            {/* Basic Info */}
            <section
              ref={el => {
                sectionRefs.current['basic'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('basic')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">기본 정보</h3>
                </div>
                {!isApproved && onDuplicate && (
                  <button
                    onClick={() => {
                      // Temporarily use onDuplicate directly instead of workLogService
                      if (onDuplicate) {
                        onClose()
                        onDuplicate(formData)
                      }
                    }}
                    className="flex items-center gap-1.5 text-[14px] font-bold text-primary bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg active:bg-blue-100 hover:bg-blue-50/80 transition shadow-sm"
                  >
                    <Copy className="w-4 h-4" /> 오늘 날짜로 복사
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <InfoRow label="현장명" value={formData.site} />
                <InfoRow
                  label="작업일자"
                  value={formData.date}
                  isEditing={isEditMode}
                  editInput={
                    <input
                      type="date"
                      className={editInputClass}
                      value={formData.date}
                      onChange={e => handleInputChange('date', e.target.value)}
                    />
                  }
                />
                <InfoRow
                  label="소속"
                  value={formData.affiliation}
                  isEditing={isEditMode}
                  editInput={
                    <input
                      className={editInputClass}
                      value={formData.affiliation}
                      onChange={e => handleInputChange('affiliation', e.target.value)}
                    />
                  }
                />
              </div>
            </section>

            {/* Work Content */}
            <section
              ref={el => {
                sectionRefs.current['content'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('content')}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <HardHat className="w-5 h-5 text-header-navy" />
                <h3 className="text-[19px] font-extrabold text-header-navy">작업 내용</h3>
              </div>
              <div className="space-y-3">
                {/* Member */}
                {isEditMode ? (
                  <div className="mb-2">
                    <label className="block text-text-sub font-bold mb-2">부재명</label>
                    {renderChipEdit('member', MEMBERS, formData.member)}
                  </div>
                ) : (
                  <InfoRow label="부재명" value={formData.member} />
                )}

                {/* Process */}
                {isEditMode ? (
                  <div className="mb-2">
                    <label className="block text-text-sub font-bold mb-2">공정명</label>
                    {renderChipEdit('process', PROCESSES, formData.process)}
                  </div>
                ) : (
                  <InfoRow label="공정명" value={formData.process} />
                )}

                {/* Work Type */}
                {isEditMode ? (
                  <div className="mb-2">
                    <label className="block text-text-sub font-bold mb-2">작업유형</label>
                    {renderChipEdit('type', TYPES, formData.type || '')}
                  </div>
                ) : (
                  <InfoRow label="작업유형" value={formData.type || '-'} />
                )}

                {/* Location */}
                <InfoRow
                  label="블럭 / 동 / 층"
                  value={formData.location || '-'}
                  isEditing={isEditMode}
                  editInput={
                    <input
                      className={editInputClass}
                      value={formData.location || ''}
                      onChange={e => handleInputChange('location', e.target.value)}
                    />
                  }
                />
              </div>
            </section>

            {/* Manpower */}
            <section
              ref={el => {
                sectionRefs.current['manpower'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('manpower')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">출력 인원</h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{formData.manpower.length}명</div>
                  <div className="text-xs text-gray-400 font-medium">
                    총 {formData.manpower.reduce((acc, cur) => acc + cur.val, 0)}일
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {formData.manpower.map((mp, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0"
                  >
                    {isEditMode ? (
                      <div className="w-[60%]">
                        <input
                          className={editInputClassLeft}
                          value={mp.worker || mp.role}
                          onChange={e => handleManpowerChange(idx, e.target.value)}
                          placeholder="작업자 성명"
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-gray-700">{mp.worker || mp.role}</span>
                    )}
                    <span className="font-bold text-gray-900">1일</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Materials & Equipment */}
            <section
              ref={el => {
                sectionRefs.current['materials'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('materials')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">자재/장비 현황</h3>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {formData.materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-dashed border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isEditMode ? (
                        <input
                          className={editInputClassLeft}
                          value={mat.name}
                          onChange={e => handleMaterialChange(idx, 'name', e.target.value)}
                          placeholder="품명"
                        />
                      ) : (
                        <span className="font-extrabold text-[17px] text-text-main">
                          {mat.name}
                        </span>
                      )}

                      {!isEditMode && (
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${mat.type === 'HQ' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                        >
                          {mat.type === 'HQ' ? '본사' : '작업자'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {isEditMode ? (
                        <div className="w-[80px]">
                          <input
                            className={editInputClass}
                            value={mat.qty}
                            onChange={e => handleMaterialChange(idx, 'qty', e.target.value)}
                            placeholder="수량"
                          />
                        </div>
                      ) : (
                        <span className="text-[17px] font-extrabold text-primary">{mat.qty}</span>
                      )}

                      {!isApproved && (
                        <button
                          onClick={() => handleMaterialDelete(idx)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isApproved && (
                <button
                  onClick={() => setIsMaterialSheetOpen(true)}
                  className="w-full h-[54px] mt-3 border border-dashed border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                >
                  <Plus className="w-5 h-5" /> 자재/장비 추가하기
                </button>
              )}
            </section>

            {/* Photos */}
            <section
              ref={el => {
                sectionRefs.current['photos'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('photos')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">사진 관리</h3>
                </div>
                {!isApproved && formData.photos.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePhotosDeleteAll}
                    className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100 hover:bg-red-100 transition"
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {formData.photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative min-w-[140px] h-[140px] rounded-xl overflow-hidden border border-gray-200 shrink-0 cursor-pointer group"
                    onClick={() => openPreview(photo, 'image')}
                  >
                    <img src={photo.url} className="w-full h-full object-cover" alt="site" />
                    <button
                      onClick={e => togglePhotoTag(e, photo.id)}
                      className={`absolute top-1.5 left-1.5 px-2 py-0.5 text-[11px] font-bold rounded text-white z-20 shadow-sm transition active:scale-95 ${photo.tag === '보수후' ? 'bg-[#20c997]/90' : 'bg-red-600/90'}`}
                    >
                      {photo.tag}
                    </button>
                    {!isApproved && (
                      <>
                        <button
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/20 z-20 hover:bg-red-600/80 transition"
                          onClick={e => {
                            e.stopPropagation()
                            handlePhotoDelete(photo.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/20 z-20 hover:bg-blue-600/80 transition"
                          onClick={e => startReplacement(e, 'photo', photo.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {!isApproved && (
                <>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full h-[54px] mt-3 border border-dashed border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                  >
                    <Camera className="w-5 h-5" /> 사진 대량 업로드
                  </button>
                </>
              )}
            </section>

            {/* Drawings */}
            <section
              ref={el => {
                sectionRefs.current['drawings'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('drawings')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">도면 관리</h3>
                </div>
                {!isApproved && formData.drawings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDrawingsDeleteAll}
                    className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100 hover:bg-red-100 transition"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {formData.drawings.map(drawing => (
                  <div
                    key={drawing.id}
                    className="relative min-w-[200px] aspect-video rounded-lg overflow-hidden border border-gray-200 shrink-0 cursor-pointer bg-white group"
                    onClick={() => openPreview(drawing, 'drawing')}
                  >
                    <img src={drawing.url} className="w-full h-full object-contain" alt="drawing" />
                    <button
                      onClick={e => toggleDrawingTag(e, drawing.id)}
                      className={`absolute top-1.5 left-1.5 px-2 py-0.5 text-[11px] font-bold rounded text-white z-20 shadow-sm transition active:scale-95 ${drawing.tag === '완료도면' ? 'bg-[#20c997]/90' : 'bg-blue-600/90'}`}
                    >
                      {drawing.tag}
                    </button>
                    {!isApproved && (
                      <>
                        <button
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/20 z-20 hover:bg-red-600/80 transition"
                          onClick={e => {
                            e.stopPropagation()
                            handleDrawingDelete(drawing.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/20 z-20 hover:bg-blue-600/80 transition"
                          onClick={e => startReplacement(e, 'drawing', drawing.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {!isApproved && (
                <>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={drawingInputRef}
                    onChange={handleDrawingUpload}
                  />
                  <button
                    onClick={() => drawingInputRef.current?.click()}
                    className="w-full h-[54px] mt-3 border border-dashed border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                  >
                    <Plus className="w-5 h-5" /> 도면 불러오기
                  </button>
                </>
              )}
            </section>

            {/* Work Completion Confirmation (Restyled for Single File) */}
            <section
              ref={el => {
                sectionRefs.current['confirmation'] = el as HTMLDivElement
              }}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${getSectionClass('confirmation')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-header-navy" />
                  <h3 className="text-[19px] font-extrabold text-header-navy">작업완료확인서</h3>
                </div>
              </div>

              {/* File List (Max 1) */}
              <div className="flex flex-col gap-0 w-full mb-2">
                {formData.confirmationFiles.length > 0 &&
                  formData.confirmationFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-3 border-b border-[#e2e8f0]"
                    >
                      <div className="flex-1 min-w-0 mr-3 flex flex-col gap-0.5">
                        <div className="font-bold text-[15px] text-text-main truncate">
                          {file.name}
                        </div>
                        <div className="text-[13px] text-gray-500 font-medium">
                          {formatDate(file.uploadedAt)} · {formatFileSize(file.size)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPreviewTarget({
                              type: 'image',
                              src: file.url,
                              title: file.name,
                              details: {
                                site: formData.site,
                                member: formData.member,
                                process: formData.process,
                                content: '작업완료확인서',
                              },
                            })
                            setPreviewOpen(true)
                          }}
                          className="w-9 h-9 rounded-lg bg-bg-body text-text-sub flex items-center justify-center border border-[#e2e8f0] cursor-pointer shrink-0 hover:bg-gray-100 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isApproved && (
                          <button
                            onClick={handleConfirmationDelete}
                            className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 cursor-pointer shrink-0 hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Add/Replace Button */}
              {!isApproved && (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={confirmationInputRef}
                    onChange={handleConfirmationUpload}
                  />
                  <button
                    onClick={() => confirmationInputRef.current?.click()}
                    className="w-full h-[54px] border border-dashed border-primary text-primary bg-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                  >
                    {formData.confirmationFiles.length > 0 ? (
                      <>
                        <RefreshCw className="w-5 h-5" /> 확인서 교체
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-5 h-5" /> 작업완료확인서 첨부
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Hidden Input for Replacements */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={replacementInputRef}
          onChange={handleReplacementUpload}
        />

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] p-4 flex gap-2 max-w-[600px] w-full mx-auto pb-[calc(16px+env(safe-area-inset-bottom))] z-[2010] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {isApproved ? (
            <div className="flex gap-2 w-full">
              <button className="flex-1 h-[56px] bg-gray-200 text-gray-500 rounded-2xl text-lg font-extrabold flex items-center justify-center gap-2 cursor-not-allowed">
                승인 완료 (수정 불가)
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="flex-1 h-[56px] bg-gray-200 text-gray-700 rounded-2xl text-lg font-extrabold hover:bg-gray-300 transition shadow-lg"
              >
                {isEditMode ? '취소' : '수정'}
              </button>
              <button
                onClick={() => {
                  // workLogService.updateLog(formData.id, formData); // Temporarily commented out
                  onSave(formData)
                  onClose()
                }}
                className="flex-1 h-[56px] bg-header-navy text-white rounded-2xl text-lg font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg"
              >
                저장하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Material Add Sheet */}
      {isMaterialSheetOpen && (
        <div
          className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 animate-fade-in"
          onClick={() => setIsMaterialSheetOpen(false)}
        >
          <div
            className="w-full max-w-[600px] bg-white rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-header-navy">자재/장비 추가</h3>
              <button onClick={() => setIsMaterialSheetOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[15px] font-bold text-text-sub mb-2">구분</label>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-3 rounded-xl font-bold border transition ${newMaterial.type === 'HQ' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                    onClick={() => setNewMaterial(prev => ({ ...prev, type: 'HQ' }))}
                  >
                    본사 지급
                  </button>
                  <button
                    className={`flex-1 py-3 rounded-xl font-bold border transition ${newMaterial.type === 'Worker' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                    onClick={() => setNewMaterial(prev => ({ ...prev, type: 'Worker' }))}
                  >
                    작업자(팀) 준비
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-bold text-text-sub mb-2">품명</label>
                <input
                  type="text"
                  placeholder="예: 에폭시, 고소작업대"
                  className="w-full h-[50px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[17px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  value={newMaterial.name}
                  onChange={e => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold text-text-sub mb-2">
                  수량 (카운터/직접입력)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    className="w-[50px] h-[50px] rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 text-2xl active:bg-gray-100"
                    onClick={() => {
                      const current = parseInt(newMaterial.qty) || 0
                      setNewMaterial(prev => ({ ...prev, qty: String(Math.max(0, current - 1)) }))
                    }}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    placeholder="예: 2말, 1대"
                    className="flex-1 h-[50px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[17px] text-center outline-none focus:border-primary transition"
                    value={newMaterial.qty}
                    onChange={e => setNewMaterial(prev => ({ ...prev, qty: e.target.value }))}
                  />
                  <button
                    className="w-[50px] h-[50px] rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 text-2xl active:bg-gray-100"
                    onClick={() => {
                      const current = parseInt(newMaterial.qty) || 0
                      setNewMaterial(prev => ({ ...prev, qty: String(current + 1) }))
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-bold text-text-sub mb-2">
                  영수증 첨부
                </label>
                <label className="flex items-center gap-3 px-4 h-[50px] rounded-xl border border-[#e2e8f0] bg-white cursor-pointer active:bg-gray-50">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                  <span
                    className={`text-[15px] font-medium ${receiptFile ? 'text-primary' : 'text-gray-400'}`}
                  >
                    {receiptFile ? receiptFile.name : '파일을 선택하세요'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                onClick={handleMaterialAdd}
                className="w-full h-[56px] mt-4 bg-header-navy text-white rounded-xl text-[17px] font-bold hover:opacity-90 transition"
              >
                추가하기
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && previewTarget && (
        <PreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          type={previewTarget.type}
          src={previewTarget.src}
          title={previewTarget.title}
          details={previewTarget.details}
        />
      )}
    </>
  )
}

const InfoRow = ({
  label,
  value,
  isEditing = false,
  editInput,
}: {
  label: string
  value: string
  isEditing?: boolean
  editInput?: React.ReactNode
}) => (
  <div className="flex justify-between items-center text-[16px]">
    <span className="text-text-sub font-bold">{label}</span>
    {isEditing && editInput ? (
      <div className="w-[60%]">{editInput}</div>
    ) : (
      <span className="font-extrabold text-text-main text-right">{value}</span>
    )}
  </div>
)

export default WorkLogDetail
