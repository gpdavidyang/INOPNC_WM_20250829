import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Building2,
  HardHat,
  User,
  ArrowRight,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  Camera,
  ScanLine,
} from 'lucide-react'
import { WorkLog, Manpower, MediaFile } from '@inopnc/shared'
import { SITE_OPTIONS } from '../constants'
import SiteCombobox from './SiteCombobox'

interface SmartCreateSheetProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newLog: WorkLog) => void
  initialSiteId: string
}

const MEMBERS = ['슬라브', '거더', '기둥', '기타']
const PROCESSES = ['균열', '면', '마감', '기타']
const TYPES = ['지하', '지상', '지붕', '기타']
const WORKERS = ['이현수', '김철수', '박영희', '정민수', '최지영']

const SmartCreateSheet: React.FC<SmartCreateSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSiteId,
}) => {
  // --- Step 1: Site ---
  const [siteId, setSiteId] = useState(initialSiteId === 'all' ? '' : initialSiteId)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dept, setDept] = useState('')

  // --- Step 2: Manpower ---
  const [manpowerList, setManpowerList] = useState<
    { id: number; worker: string; val: number; isCustom: boolean; locked?: boolean }[]
  >([{ id: 1, worker: '이현수', val: 1.0, isCustom: false, locked: true }])

  // --- Step 3: Work Content ---
  const [member, setMember] = useState('')
  const [memberCustom, setMemberCustom] = useState('')
  const [process, setProcess] = useState('')
  const [processCustom, setProcessCustom] = useState('')
  const [workType, setWorkType] = useState('')
  const [workTypeCustom, setWorkTypeCustom] = useState('')
  const [location, setLocation] = useState({ block: '', dong: '', floor: '' })

  // --- Step 4: Media ---
  const [photos, setPhotos] = useState<MediaFile[]>([])
  const [drawings, setDrawings] = useState<MediaFile[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const drawingInputRef = useRef<HTMLInputElement>(null)

  // Refs for scrolling
  const siteRef = useRef<HTMLDivElement>(null)
  const manpowerRef = useRef<HTMLDivElement>(null)
  const workContentRef = useRef<HTMLDivElement>(null)
  const processRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  // --- Handlers ---

  const handleSiteChange = (id: string) => {
    setSiteId(id)
    const site = SITE_OPTIONS.find(s => s.id === id)
    if (site) setDept(site.dept)

    // Guide to Manpower
    if (manpowerRef.current) {
      scrollToRef(manpowerRef)
    }
  }

  // Manpower Logic
  const addManpower = () => {
    setManpowerList(prev => [...prev, { id: Date.now(), worker: '', val: 1.0, isCustom: false }])
  }

  const removeManpower = (id: number) => {
    setManpowerList(prev => prev.filter(m => m.id !== id))
  }

  const updateManpower = (id: number, field: keyof (typeof manpowerList)[0], value: any) => {
    setManpowerList(prev =>
      prev.map(m => {
        if (m.id === id) {
          return { ...m, [field]: value }
        }
        return m
      })
    )
  }

  const updateHours = (id: number, delta: number) => {
    setManpowerList(prev =>
      prev.map(m => {
        if (m.id === id) {
          let newVal = m.val + delta
          if (newVal < 0) newVal = 0
          if (newVal > 3.5) newVal = 3.5
          return { ...m, val: newVal }
        }
        return m
      })
    )
  }

  // Work Content Logic
  const handleChipSelect = (category: 'member' | 'process' | 'type', value: string) => {
    if (category === 'member') {
      setMember(value)
      if (value !== '기타') setMemberCustom('')
      // Guide to Process
      setTimeout(() => {
        if (processRef.current)
          processRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
    if (category === 'process') {
      setProcess(value)
      if (value !== '기타') setProcessCustom('')
    }
    if (category === 'type') {
      setWorkType(value)
      if (value !== '기타') setWorkTypeCustom('')
    }
  }

  // Media Logic
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: MediaFile[] = Array.from(e.target.files).map((file: File, idx) => ({
        id: Date.now() + idx,
        url: URL.createObjectURL(file),
        tag: '보수후',
      }))
      setPhotos(prev => [...prev, ...newPhotos])
    }
  }

  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDrawings: MediaFile[] = Array.from(e.target.files).map((file: File, idx) => ({
        id: Date.now() + idx,
        url: URL.createObjectURL(file),
        tag: '진행도면',
      }))
      setDrawings(prev => [...prev, ...newDrawings])
    }
  }

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Add visual highlight effect (simulated)
    ref.current?.classList.add('ring-2', 'ring-sky-300', 'transition-all', 'duration-500')
    setTimeout(() => ref.current?.classList.remove('ring-2', 'ring-sky-300'), 1500)
  }

  const handleSubmit = () => {
    if (!siteId) return alert('현장을 선택해주세요.')
    if (!member && !memberCustom) return alert('부재명을 입력해주세요.')
    if (!process && !processCustom) return alert('공정명을 입력해주세요.')

    const selectedSite = SITE_OPTIONS.find(s => s.id === siteId)

    // Construct Manpower Array
    const finalManpower: Manpower[] = manpowerList
      .map(m => ({
        role: m.worker || '작업자', // Fallback
        val: m.val,
        worker: m.worker,
      }))
      .filter(m => m.worker !== '')

    const finalMember = member === '기타' ? memberCustom : member
    const finalProcess = process === '기타' ? processCustom : process
    const finalType = workType === '기타' ? workTypeCustom : workType
    const finalLocation = [location.block, location.dong, location.floor].filter(Boolean).join(' ')

    const newLog: WorkLog = {
      id: Date.now(),
      site: selectedSite ? selectedSite.name : '기타 현장',
      siteId: siteId,
      date: date,
      status: 'draft',
      affiliation: dept || '본사',
      member: finalMember,
      process: finalProcess,
      type: finalType,
      location: finalLocation,
      manpower: finalManpower,
      materials: [],
      photos: photos,
      drawings: drawings,
      confirmationFiles: [],
      isDirect: true,
      isPinned: false,
    }

    onSubmit(newLog)
  }

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] bg-bg-body rounded-t-3xl flex flex-col max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-white border-b border-gray-100 shrink-0">
          <h3 className="text-[22px] font-black text-header-navy flex items-center gap-2">
            작업일지 등록
          </h3>
          <button onClick={onClose} className="p-1 -mr-1 rounded-full hover:bg-gray-100 transition">
            <X className="w-7 h-7 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 no-scrollbar">
          {/* --- Section 1: Site Info --- */}
          <div
            ref={siteRef}
            className="bg-white rounded-2xl p-5 shadow-sm border border-transparent transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-header-navy" />
              <h3 className="text-[19px] font-extrabold text-header-navy">
                현장 정보 <span className="text-red-500">*</span>
              </h3>
            </div>

            {/* Site Combobox (Searchable) */}
            <div className="mb-4">
              <SiteCombobox
                selectedSiteId={siteId}
                onSelect={handleSiteChange}
                options={SITE_OPTIONS}
                showAllOption={false}
                placeholder="현장을 선택하세요"
              />
            </div>

            {/* Date & Dept Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[15px] font-bold text-text-sub mb-1.5">
                  소속 (자동)
                </label>
                <input
                  className="w-full h-[54px] px-3 rounded-xl border border-[#e2e8f0] bg-gray-50 text-gray-500 font-bold outline-none text-[16px]"
                  value={dept}
                  disabled
                  placeholder="현장 선택 시 자동"
                />
              </div>
              <div className="flex-[1.2]">
                <label className="block text-[15px] font-bold text-text-sub mb-1.5">작업일자</label>
                <input
                  type="date"
                  className="w-full h-[54px] px-3 rounded-xl border border-[#e2e8f0] bg-white font-bold focus:border-primary outline-none text-[16px]"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* --- Section 2: Manpower --- */}
          <div
            ref={manpowerRef}
            className="bg-white rounded-2xl p-5 shadow-sm border border-transparent transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-header-navy" />
                <h3 className="text-[19px] font-extrabold text-header-navy">
                  투입 인원 <span className="text-red-500">*</span>
                </h3>
              </div>
              <button
                onClick={addManpower}
                className="bg-primary-bg text-primary px-3.5 py-2 rounded-xl font-bold text-[15px] flex items-center gap-1 hover:bg-blue-100 transition"
              >
                <Plus className="w-4 h-4" /> 추가
              </button>
            </div>

            <div className="space-y-3">
              {manpowerList.map(m => (
                <div
                  key={m.id}
                  className="bg-[#f8fafc] p-3 rounded-2xl flex items-center gap-3 animate-fade-in"
                >
                  {/* Worker Select */}
                  <div className="flex-1 min-w-0">
                    {m.locked ? (
                      <div className="h-[54px] flex items-center px-3 font-bold text-text-main text-[16px]">
                        {m.worker}
                      </div>
                    ) : m.isCustom ? (
                      <input
                        autoFocus
                        placeholder="이름 입력"
                        className="w-full h-[54px] px-3 rounded-xl border border-primary bg-white focus:outline-none text-[16px]"
                        value={m.worker}
                        onBlur={() => {
                          if (!m.worker) updateManpower(m.id, 'isCustom', false)
                        }}
                        onChange={e => updateManpower(m.id, 'worker', e.target.value)}
                      />
                    ) : (
                      <select
                        className="w-full h-[54px] px-3 rounded-xl border border-[#e2e8f0] bg-white font-medium focus:border-primary outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiMzMzMiIGNsYXNzPSJ3LTYgaC02Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xOS41IDguMjVsLTcuNSA3LjUtNy41LTcuNSIgLz48L3N2Zz4=')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat text-[16px]"
                        value={m.worker}
                        onChange={e => {
                          if (e.target.value === 'custom') updateManpower(m.id, 'isCustom', true)
                          else updateManpower(m.id, 'worker', e.target.value)
                        }}
                      >
                        <option value="">작업자 선택</option>
                        {WORKERS.map(w => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                        <option value="custom">직접입력</option>
                      </select>
                    )}
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center h-[54px] bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shrink-0">
                    <button
                      onClick={() => updateHours(m.id, -0.5)}
                      className="w-11 h-full flex items-center justify-center text-gray-500 active:bg-gray-100 text-lg"
                    >
                      -
                    </button>
                    <div className="w-14 h-full flex items-center justify-center font-bold border-x border-[#f1f5f9] text-[16px]">
                      {m.val.toFixed(1)}
                    </div>
                    <button
                      onClick={() => updateHours(m.id, 0.5)}
                      className="w-11 h-full flex items-center justify-center text-gray-500 active:bg-gray-100 text-lg"
                    >
                      +
                    </button>
                  </div>

                  {/* Delete */}
                  {!m.locked && (
                    <button
                      onClick={() => removeManpower(m.id)}
                      className="w-11 h-11 flex items-center justify-center text-red-400 bg-red-50 rounded-xl hover:bg-red-100 transition shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* --- Section 3: Work Content --- */}
          <div
            ref={workContentRef}
            className="bg-white rounded-2xl p-5 shadow-sm border border-transparent transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <HardHat className="w-6 h-6 text-header-navy" />
              <h3 className="text-[19px] font-extrabold text-header-navy">작업 내용</h3>
            </div>

            {/* Member (Bubjae) */}
            <div className="mb-5">
              <label className="block text-[16px] font-bold text-text-sub mb-2">
                부재명 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {MEMBERS.map(m => (
                  <button
                    key={m}
                    onClick={() => handleChipSelect('member', m)}
                    className={`h-[50px] rounded-xl text-[16px] font-bold border transition
                                    ${
                                      member === m
                                        ? 'bg-white border-primary text-primary shadow-[0_2px_4px_rgba(49,163,250,0.15)] ring-1 ring-primary'
                                        : 'bg-[#f8fafc] border-[#e2e8f0] text-text-sub hover:border-gray-300'
                                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {member === '기타' && (
                <input
                  autoFocus
                  placeholder="부재명 직접 입력"
                  className="w-full h-[54px] px-4 rounded-xl border border-primary bg-white focus:outline-none animate-fade-in text-[16px]"
                  value={memberCustom}
                  onChange={e => setMemberCustom(e.target.value)}
                />
              )}
            </div>

            {/* Process (Gongjong) */}
            <div className="mb-5" ref={processRef}>
              <label className="block text-[16px] font-bold text-text-sub mb-2">
                작업공정 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PROCESSES.map(p => (
                  <button
                    key={p}
                    onClick={() => handleChipSelect('process', p)}
                    className={`h-[50px] rounded-xl text-[16px] font-bold border transition
                                    ${
                                      process === p
                                        ? 'bg-white border-primary text-primary shadow-[0_2px_4px_rgba(49,163,250,0.15)] ring-1 ring-primary'
                                        : 'bg-[#f8fafc] border-[#e2e8f0] text-text-sub hover:border-gray-300'
                                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {process === '기타' && (
                <input
                  autoFocus
                  placeholder="공정명 직접 입력"
                  className="w-full h-[54px] px-4 rounded-xl border border-primary bg-white focus:outline-none animate-fade-in text-[16px]"
                  value={processCustom}
                  onChange={e => setProcessCustom(e.target.value)}
                />
              )}
            </div>

            {/* Type & Location */}
            <div>
              <label className="block text-[16px] font-bold text-text-sub mb-2">
                작업위치 (선택)
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <select
                    className="w-full h-[54px] px-3 rounded-xl border border-[#e2e8f0] bg-white font-medium focus:border-primary outline-none appearance-none text-[16px]"
                    value={workType}
                    onChange={e => setWorkType(e.target.value)}
                  >
                    <option value="">작업유형</option>
                    {TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2] flex gap-2">
                  <input
                    placeholder="블럭"
                    className="w-full h-[54px] px-2 text-center rounded-xl border border-[#e2e8f0] bg-white focus:border-primary outline-none text-[16px]"
                    value={location.block}
                    onChange={e => setLocation({ ...location, block: e.target.value })}
                  />
                  <input
                    placeholder="동"
                    className="w-full h-[54px] px-2 text-center rounded-xl border border-[#e2e8f0] bg-white focus:border-primary outline-none text-[16px]"
                    value={location.dong}
                    onChange={e => setLocation({ ...location, dong: e.target.value })}
                  />
                  <input
                    placeholder="층"
                    className="w-full h-[54px] px-2 text-center rounded-xl border border-[#e2e8f0] bg-white focus:border-primary outline-none text-[16px]"
                    value={location.floor}
                    onChange={e => setLocation({ ...location, floor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- Section 4: Photos & Drawings --- */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-transparent transition-all mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-6 h-6 text-header-navy" />
              <h3 className="text-[19px] font-extrabold text-header-navy">사진 및 도면</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <div className="text-[16px] font-bold text-text-sub">사진등록</div>
                <button
                  className="w-full h-[54px] bg-[#eaf6ff] border border-dashed border-[#31a3fa] text-[#31a3fa] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#dbeafe] transition text-[16px]"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  {photos.length > 0 ? `${photos.length}장 선택됨` : '사진등록'}
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[16px] font-bold text-text-sub">도면마킹</div>
                <button
                  className="w-full h-[54px] bg-[#f0fdfa] border border-dashed border-[#2dd4bf] text-[#0f766e] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#ccfbf1] transition text-[16px]"
                  onClick={() => drawingInputRef.current?.click()}
                >
                  <ScanLine className="w-5 h-5" />
                  {drawings.length > 0 ? `${drawings.length}장 선택됨` : '도면마킹'}
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  ref={drawingInputRef}
                  onChange={handleDrawingUpload}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
          <button
            onClick={handleSubmit}
            className="w-full h-[56px] bg-header-navy text-white rounded-xl text-[19px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-blue-900/10"
          >
            작업일지 생성하기 <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SmartCreateSheet
