import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Users,
  HardHat,
  Package,
  FileText,
  ChevronDown,
  CheckCircle2,
  X,
  PlusCircle,
} from 'lucide-react'
import {
  REGION_SITES,
  PREDEFINED_WORKERS,
  MEMBER_CHIPS,
  PROCESS_CHIPS,
  TYPE_CHIPS,
} from '../constants'
import { ManpowerItem, WorkSet, MaterialItem } from '../types'
import WorkReportModal from '../components/WorkReportModal'

const WorklogPage: React.FC = () => {
  const navigate = useNavigate()
  // State: Global
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // State: Form Data
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [siteSearch, setSiteSearch] = useState('') // For site search input
  const [showSiteDropdown, setShowSiteDropdown] = useState(false) // For site dropdown visibility
  const siteSearchWrapperRef = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState<'latest' | 'name'>('latest')
  const [monthFilter, setMonthFilter] = useState('2025-12')
  const [dept, setDept] = useState('')
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10))

  // State: Lists
  const [manpowerList, setManpowerList] = useState<ManpowerItem[]>([
    { id: 1, worker: '이현수', workHours: 1.0, isCustom: false, locked: true },
  ])
  const [workSets, setWorkSets] = useState<WorkSet[]>([
    {
      id: Date.now(),
      member: '',
      process: '',
      type: '',
      location: { block: '', dong: '', floor: '' },
      isCustomMember: false,
      isCustomProcess: false,
      customMemberValue: '',
      customProcessValue: '',
      customTypeValue: '',
    },
  ])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [materialQty, setMaterialQty] = useState('')
  const [selectedMaterialName, setSelectedMaterialName] = useState('NPC-1000')

  // State: Material Custom Input
  const [isMaterialDirect, setIsMaterialDirect] = useState(false)
  const [customMaterialValue, setCustomMaterialValue] = useState('')
  const [customMaterialOption, setCustomMaterialOption] = useState<string | null>(null)

  // State: Modals & UI
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true)
  const [isNewWorklogOpen, setIsNewWorklogOpen] = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteAffiliation, setNewSiteAffiliation] = useState('')

  // State: Ready to Save
  const [isReadyToSave, setIsReadyToSave] = useState(false)

  // Helper: Get all sites flat list and Reverse it to show "Newest" first
  const getAllSites = () => Object.values(REGION_SITES).flat().reverse()

  // Click Outside Handler for Search Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        siteSearchWrapperRef.current &&
        !siteSearchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSiteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inopnc_work_log')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.selectedSite) {
          setSelectedSite(parsed.selectedSite)
          // Restore search text based on saved site ID
          const all = getAllSites()
          const found = all.find(s => s.value === parsed.selectedSite)
          if (found) setSiteSearch(found.text)
        }
        if (parsed.dept) setDept(parsed.dept)
        if (parsed.workDate) setWorkDate(parsed.workDate)
        if (parsed.manpowerList) setManpowerList(parsed.manpowerList)
        if (parsed.workSets) setWorkSets(parsed.workSets)
        if (parsed.materials) setMaterials(parsed.materials)
      }
    } catch (e) {
      console.error('Failed to load saved data', e)
    }
  }, [])

  // Save to LocalStorage automatically
  useEffect(() => {
    const data = {
      selectedSite,
      dept,
      workDate,
      manpowerList,
      workSets,
      materials,
    }
    localStorage.setItem('inopnc_work_log', JSON.stringify(data))
  }, [selectedSite, dept, workDate, manpowerList, workSets, materials])

  // Handlers: General
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2000)
  }

  // Visual Effects Helpers
  const triggerShake = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.classList.add('section-error-highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.classList.remove('section-error-highlight'), 2000)
    }
  }

  const triggerGuide = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.classList.remove('next-step-guide')
      void el.offsetWidth // Force reflow
      el.classList.add('next-step-guide')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.classList.remove('next-step-guide'), 2500)
    }
  }

  const handleSiteSelect = (site: any) => {
    if (site) {
      setSelectedSite(site.value)
      setSiteSearch(site.text)
      setDept(site.dept || '')
      setShowSiteDropdown(false)
    } else {
      setSelectedSite('')
      setSiteSearch('')
      setDept('')
      setShowSiteDropdown(false)
    }
  }

  const getFilteredSites = () => {
    if (!siteSearch) return []
    return getAllSites().filter(s => s.text.toLowerCase().includes(siteSearch.toLowerCase()))
  }

  // Handlers: Manpower
  const addManpower = () => {
    setManpowerList([
      ...manpowerList,
      {
        id: Date.now(),
        worker: '',
        workHours: 1.0,
        isCustom: false,
        locked: false,
      },
    ])
  }

  const updateManpower = (id: number, field: keyof ManpowerItem, value: any) => {
    setManpowerList(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateHours = (id: number, delta: number) => {
    setManpowerList(prev =>
      prev.map(item => {
        if (item.id === id) {
          let newH = item.workHours + delta
          if (newH < 0) newH = 0
          if (newH > 3.5) newH = 3.5
          newH = Math.round(newH * 2) / 2
          return { ...item, workHours: newH }
        }
        return item
      })
    )
  }

  const removeManpower = (id: number) => {
    setManpowerList(prev => prev.filter(p => p.id !== id))
  }

  // Handlers: Work Sets
  const addWorkSet = () => {
    setWorkSets([
      ...workSets,
      {
        id: Date.now(),
        member: '',
        process: '',
        type: '',
        location: { block: '', dong: '', floor: '' },
        isCustomMember: false,
        isCustomProcess: false,
        customMemberValue: '',
        customProcessValue: '',
        customTypeValue: '',
      },
    ])
  }

  const removeWorkSet = (id: number) => {
    setWorkSets(prev => prev.filter(ws => ws.id !== id))
  }

  const updateWorkSet = (id: number, field: string, value: any) => {
    setWorkSets(prev =>
      prev.map(ws => {
        if (ws.id !== id) return ws
        if (field === 'location') return { ...ws, location: { ...ws.location, ...value } }
        return { ...ws, [field]: value }
      })
    )
  }

  const toggleWorkSetChip = (
    wsId: number,
    field: 'member' | 'process' | 'type',
    value: string,
    customKey: string,
    isCustomKey: string
  ) => {
    setWorkSets(prev =>
      prev.map(ws => {
        if (ws.id !== wsId) return ws

        const currentValue = (ws as any)[field]
        const isSame = currentValue === value
        const nextValue = isSame ? '' : value

        let newWs = { ...ws, [field]: nextValue }

        if (value === '기타') {
          ;(newWs as any)[isCustomKey] = !isSame
          if (isSame) (newWs as any)[customKey] = ''
        } else {
          ;(newWs as any)[isCustomKey] = false
        }

        if (!isSame && field === 'member') {
          setTimeout(() => triggerGuide(`ws-${wsId}-process`), 100)
        }

        return newWs
      })
    )
  }

  // Handlers: Material
  const addMaterial = () => {
    const qty = parseFloat(materialQty)
    if (!selectedMaterialName || isNaN(qty) || qty <= 0) {
      showToast('올바른 수량을 입력하세요')
      return
    }
    setMaterials([...materials, { id: Date.now(), name: selectedMaterialName, qty }])
    setMaterialQty('')
  }

  const handleConfirmCustomMaterial = () => {
    if (customMaterialValue.trim()) {
      const val = customMaterialValue.trim()
      setCustomMaterialOption(val) // Persist option
      setSelectedMaterialName(val) // Select it
      setIsMaterialDirect(false)
      showToast('자재 선택')
    } else {
      showToast('자재명을 입력하세요')
    }
  }

  const handleCreateNewWorklog = () => {
    if (!newSiteName.trim()) {
      showToast('현장명을 입력하세요')
      return
    }

    // Reset current form and set new site
    handleReset()
    setSelectedSite('custom')
    setSiteSearch(newSiteName)
    setDept(newSiteAffiliation)
    setIsNewWorklogOpen(false)
    setNewSiteName('')
    setNewSiteAffiliation('')
    showToast('새 작업일지가 시작되었습니다')
  }

  // Validation Effect
  useEffect(() => {
    const hasSite = !!selectedSite
    const hasManpower = manpowerList.some(m => m.worker && m.workHours > 0)
    const hasWorkSet =
      workSets.length > 0 &&
      workSets.every(ws => {
        const m = ws.member === '기타' ? ws.customMemberValue : ws.member
        const p = ws.process === '기타' ? ws.customProcessValue : ws.process
        return !!m && !!p
      })

    setIsReadyToSave(hasSite && hasManpower && hasWorkSet)
  }, [selectedSite, manpowerList, workSets])

  const handleSave = () => {
    if (!selectedSite) {
      triggerShake('site-card')
      showToast('현장을 선택해주세요')
      return
    }

    const hasManpower = manpowerList.some(m => m.worker && m.workHours > 0)
    if (!hasManpower) {
      triggerShake('manpower-card')
      showToast('투입 인원을 입력해주세요')
      return
    }

    for (const ws of workSets) {
      const mem = ws.member === '기타' ? ws.customMemberValue : ws.member
      if (!mem) {
        triggerShake(`ws-${ws.id}-member`)
        showToast('부재명을 선택해주세요')
        return
      }
      const proc = ws.process === '기타' ? ws.customProcessValue : ws.process
      if (!proc) {
        triggerShake(`ws-${ws.id}-process`)
        showToast('작업공정을 선택해주세요')
        return
      }
    }

    showToast('일지 저장 완료')
  }

  // Reset Handler
  const handleReset = () => {
    if (confirm('모든 내용을 초기화하시겠습니까?')) {
      // Clear Storage
      localStorage.removeItem('inopnc_work_log')

      // Reset All State
      setSelectedSite('')
      setSiteSearch('')
      setDept('')
      setWorkDate(new Date().toISOString().slice(0, 10))
      setManpowerList([{ id: 1, worker: '이현수', workHours: 1.0, isCustom: false, locked: true }])
      setWorkSets([
        {
          id: Date.now(),
          member: '',
          process: '',
          type: '',
          location: { block: '', dong: '', floor: '' },
          isCustomMember: false,
          isCustomProcess: false,
          customMemberValue: '',
          customProcessValue: '',
          customTypeValue: '',
        },
      ])
      setMaterials([])
      setMaterialQty('')
      setSelectedMaterialName('NPC-1000')
      setIsMaterialDirect(false)
      setCustomMaterialValue('')
      setCustomMaterialOption(null)
      setToastMessage(null)
      setIsSummaryCollapsed(true)

      showToast('초기화 완료')
    }
  }

  return (
    <div
      className="app-wrapper max-w-[600px] mx-auto font-main"
      style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-main)', minHeight: '100vh' }}
    >
      {/* Quick Menu */}
      <section className="quick-menu-section" style={{ paddingTop: '0px' }}>
        <div className="qm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img
              src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/Flash.png?raw=true"
              alt="빠른메뉴"
              className="qm-title-icon-img"
              onError={e => {
                const target = e.target as HTMLImageElement
                target.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzIDNMMTMgOUgxOUwxOSAzSDEzWiIgZmlsbD0iIzMzMyIvPgo8cGF0aCBkPSJNMTMgMjFMMTMgMTVIMTlMMTIuOTkgMjFIMTMgWiIgZmlsbD0iIzMzMyIvPgo8cGF0aCBkPSJNNCAxMkgxMFYxNEg0VjEyWiIgZmlsbD0iIzMzMyIvPgo8L3N2Zz4K'
              }}
            />
            <span className="qm-title">빠른메뉴</span>
          </div>
        </div>
        <div className="qm-grid">
          {[
            {
              name: '출력현황',
              path: '/money',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/doc.png?raw=true',
            },
            {
              name: '작업일지',
              path: '/worklog',
              badge: 3,
              badgeClass: 'qm-badge req worklog',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/report.png?raw=true',
            },
            {
              name: '현장정보',
              path: '/site',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/map.png?raw=true',
            },
            {
              name: '문서함',
              path: '/doc',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/doc.png?raw=true',
            },
            {
              name: '본사요청',
              badge: 2,
              badgeClass: 'qm-badge req',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/request.png?raw=true',
            },
            {
              name: '조치사항',
              path: '/doc',
              state: { tab: 'punch' },
              badge: 0,
              badgeClass: 'qm-badge issue',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/photo.png?raw=true',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`qm-item ${item.badgeClass ? 'qm-item--event' : ''}`}
              onClick={() => {
                if (item.path) {
                  navigate(item.path, { state: item.state })
                }
              }}
            >
              <div className="qm-icon-wrapper">
                {item.badge !== undefined ? (
                  <span className={item.badgeClass || ''}>{item.badge}</span>
                ) : null}
                <img
                  src={item.icon}
                  alt={item.name}
                  className="qm-main-icon"
                  onError={e => {
                    const target = e.target as HTMLImageElement
                    target.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI2Y5ZmFmYiIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIyIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik05IDEySDE1TTEyIDlMMTUgMTJMMTIgMTVMOSAxMloiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+'
                  }}
                />
              </div>
              <span className="qm-label">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Site Info Card */}
      <div
        id="site-card"
        className="bg-[var(--bg-surface)] rounded-[32px] p-6 mb-4 shadow-sm border border-[var(--border)]"
      >
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-5">
          <div className="text-lg font-bold text-[var(--text-main)] flex items-center gap-1">
            <MapPin size={20} className="text-[var(--text-main)]" />
            작업현장 <span className="text-red-500 font-bold">*</span>
          </div>
          <span className="bg-red-50 text-red-500 text-[11px] font-bold h-7 px-3 rounded-full flex items-center">
            * 필수 입력
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* 첫 번째 행: 현장 선택 및 연월 박스 (1:1 비율) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 text-base font-medium text-[var(--text-main)] outline-none appearance-none cursor-pointer"
                onChange={e => {
                  const site = getAllSites().find(s => s.value === e.target.value)
                  if (site) handleSiteSelect(site)
                }}
                value={selectedSite}
              >
                <option value="">전체 현장</option>
                {getAllSites().map(s => (
                  <option key={s.value} value={s.value}>
                    {s.text}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={20} />
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 flex items-center justify-between">
                <span className="text-base font-bold text-[var(--text-main)]">2025년 12월</span>
                <div className="text-[var(--text-main)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 두 번째 행: 현장명 검색바 (돋보기 아이콘 포함) */}
          <div className="relative">
            <input
              type="text"
              value={siteSearch}
              onChange={e => {
                setSiteSearch(e.target.value)
                if (!e.target.value) setSelectedSite('')
                setShowSiteDropdown(true)
              }}
              onFocus={() => setShowSiteDropdown(true)}
              placeholder="현장명을 입력하세요."
              className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-6 text-base font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 text-[var(--text-main)]"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            {/* 검색 결과 드롭다운 (스타일 유지) */}
            {showSiteDropdown && siteSearch && (
              <ul className="absolute z-50 w-full mt-2 max-h-60 overflow-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl">
                {getFilteredSites().map(s => (
                  <li
                    key={s.value}
                    onClick={() => handleSiteSelect(s)}
                    className="px-6 py-4 cursor-pointer text-sm font-medium border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] text-[var(--text-main)]"
                  >
                    {s.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 세 번째 행: 소속(자동연동) 및 작업일자 */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-sub)] mb-2 ml-1">
                소속 <span className="text-slate-400 font-normal ml-1">ㅣ 자동연동</span>
              </label>
              <div className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 flex items-center text-slate-400 font-medium">
                {dept || '소속 선택'}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-sub)] mb-2 ml-1">
                작업일자
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 text-base font-medium outline-none cursor-pointer text-[var(--text-main)]"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Worklog Registration Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setIsNewWorklogOpen(true)}
          className="w-full h-[54px] rounded-[14px] text-[17px] font-bold flex items-center justify-center gap-2 cursor-pointer border border-dashed border-primary text-primary bg-[var(--bg-surface)] active:bg-primary-bg transition"
        >
          <PlusCircle className="w-[22px] h-[22px]" /> 새 작업일지 등록
        </button>
      </div>

      <div className="min-h-[24px]"></div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 w-full">
        <select
          className="flex-1 h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] appearance-none"
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
          }}
        >
          <option value="latest">최신순</option>
          <option value="name">이름순</option>
        </select>
        <input
          type="month"
          className="flex-1 h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
        />
      </div>

      {/* Manpower Card */}
      <div
        id="manpower-card"
        className="bg-bg-surface rounded-2xl p-5 mb-4 shadow-sm border border-transparent"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy flex items-center gap-2">
            <Users className="text-header-navy" size={20} />
            투입 인원(공수) <span className="text-danger">*</span>
          </div>
          <button
            onClick={addManpower}
            className="bg-primary-bg text-primary h-8 px-3.5 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
          >
            <span className="text-lg font-black">+</span> 추가
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {manpowerList.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-[var(--bg-input)] p-3 rounded-2xl transition-all"
            >
              <div className="flex-1 min-w-0">
                {item.locked ? (
                  <div className="text-[17px] font-bold text-text-main truncate px-1">
                    {item.worker}
                  </div>
                ) : (
                  <div className="relative w-full min-w-0">
                    {!item.isCustom ? (
                      <select
                        value={item.worker}
                        onChange={e => {
                          if (e.target.value === '__custom__')
                            updateManpower(item.id, 'isCustom', true)
                          else updateManpower(item.id, 'worker', e.target.value)
                        }}
                        className="w-full h-[50px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 appearance-none outline-none focus:border-primary text-[15px] font-medium text-[var(--text-main)]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 14px center',
                        }}
                      >
                        <option value="">작업자 선택</option>
                        {PREDEFINED_WORKERS.map(w => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                        <option value="__custom__">직접입력</option>
                      </select>
                    ) : (
                      <input
                        autoFocus
                        placeholder="이름 입력"
                        onBlur={e => {
                          if (!e.target.value) updateManpower(item.id, 'isCustom', false)
                          else updateManpower(item.id, 'worker', e.target.value)
                        }}
                        className="w-full h-[50px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 outline-none focus:border-primary text-[15px] font-medium text-[var(--text-main)] placeholder:text-slate-400"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="w-[120px] flex h-[48px] border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] overflow-hidden">
                <button
                  onClick={() => updateHours(item.id, -0.5)}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-[var(--bg-hover)]"
                >
                  －
                </button>
                <span className="flex-1 flex items-center justify-center text-base font-bold border-x border-[var(--border)]">
                  {item.workHours.toFixed(1)}
                </span>
                <button
                  onClick={() => updateHours(item.id, 0.5)}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-[var(--bg-hover)]"
                >
                  ＋
                </button>
              </div>

              {!item.locked && (
                <button
                  onClick={() => removeManpower(item.id)}
                  className="bg-red-50 text-red-500 h-[32px] px-3 rounded-xl text-[13px] font-bold whitespace-nowrap"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Content Card */}
      <div className="bg-bg-surface rounded-2xl p-5 mb-4 shadow-sm border border-transparent">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy flex items-center gap-2">
            <HardHat className="text-header-navy" size={20} />
            작업내용 <span className="text-danger">*</span>
          </div>
          <button
            onClick={addWorkSet}
            className="bg-primary-bg text-primary h-8 px-3.5 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
          >
            <span className="text-lg font-black">+</span> 추가
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {workSets.map((ws, idx) => (
            <div
              key={ws.id}
              className="bg-[var(--bg-surface)] border-2 border-primary rounded-2xl p-5 animate-[slideDown_0.3s_ease-out]"
            >
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm font-bold text-primary bg-primary-bg px-3 py-1.5 rounded-lg">
                  작업 세트 {idx + 1}
                </span>
                <button
                  onClick={() => removeWorkSet(ws.id)}
                  className="bg-red-50 text-red-500 text-sm font-bold px-3 py-1 rounded-xl"
                >
                  삭제
                </button>
              </div>

              {[
                {
                  label: '부재명',
                  key: 'member',
                  items: MEMBER_CHIPS,
                  customKey: 'customMemberValue',
                  isCustomKey: 'isCustomMember',
                  idPrefix: 'member',
                },
                {
                  label: '작업공정',
                  key: 'process',
                  items: PROCESS_CHIPS,
                  customKey: 'customProcessValue',
                  isCustomKey: 'isCustomProcess',
                  idPrefix: 'process',
                },
                {
                  label: '작업유형',
                  key: 'type',
                  items: TYPE_CHIPS,
                  customKey: 'customTypeValue',
                  isCustomKey: 'isCustomType',
                  idPrefix: 'type',
                },
              ].map(section => (
                <div key={section.key} id={`ws-${ws.id}-${section.idPrefix}`} className="mb-3">
                  <label className="block text-[17px] font-bold text-text-sub mb-2">
                    {section.label}{' '}
                    {section.key !== 'type' && <span className="text-danger">*</span>}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {section.items.map(chip => {
                      const isSelected = (ws as any)[section.key] === chip
                      let activeClass = ''
                      if (isSelected) {
                        // Use SitePage color scheme - all chips use the same active color as 'all' status
                        activeClass =
                          'border-primary text-primary shadow-[0_2px_8px_rgba(49,163,250,0.15)] bg-[var(--bg-surface)] font-bold'
                      } else {
                        activeClass =
                          'bg-[var(--bg-surface)] border-[var(--border)] text-slate-400 font-medium'
                      }

                      return (
                        <button
                          key={chip}
                          onClick={() =>
                            toggleWorkSetChip(
                              ws.id,
                              section.key as any,
                              chip,
                              section.customKey,
                              section.isCustomKey
                            )
                          }
                          className={`h-[50px] sm:h-[54px] rounded-xl border-[1.5px] text-[14px] sm:text-[16px] font-medium transition-all whitespace-nowrap ${activeClass}`}
                        >
                          {chip}
                        </button>
                      )
                    })}
                  </div>
                  {(ws as any)[section.key] === '기타' && (
                    <input
                      className="w-full h-[54px] border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl px-4 text-[17px] mt-1 outline-none focus:border-primary animate-[slideDown_0.2s] text-[var(--text-main)] placeholder:text-slate-400"
                      placeholder="직접 입력"
                      value={(ws as any)[section.customKey]}
                      onChange={e => updateWorkSet(ws.id, section.customKey || '', e.target.value)}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-[17px] font-bold text-text-sub mb-2">
                  블럭 / 동 / 층
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className="h-[54px] border border-border rounded-xl px-4 text-center outline-none focus:border-primary bg-bg-input"
                    placeholder="블럭"
                    value={ws.location.block}
                    onChange={e => updateWorkSet(ws.id, 'location', { block: e.target.value })}
                  />
                  <input
                    className="h-[54px] border border-border rounded-xl px-4 text-center outline-none focus:border-primary bg-bg-input"
                    placeholder="동"
                    value={ws.location.dong}
                    onChange={e => updateWorkSet(ws.id, 'location', { dong: e.target.value })}
                  />
                  <input
                    className="h-[54px] border border-border rounded-xl px-4 text-center outline-none focus:border-primary bg-bg-input"
                    placeholder="층"
                    value={ws.location.floor}
                    onChange={e => updateWorkSet(ws.id, 'location', { floor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset and Save Buttons - Above Material Card */}
      <div
        className={`sticky top-4 bg-bg-surface rounded-2xl p-4 mb-4 shadow-sm border border-transparent z-30 transition-all ${isReadyToSave ? 'border-green-500 ring-4 ring-green-500/10' : ''}`}
      >
        {isReadyToSave && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg animate-[slideDown_0.3s_ease-out]">
            ✓ 저장 가능
          </div>
        )}
        <div className="flex gap-2.5">
          <button
            onClick={handleReset}
            className="flex-1 h-[50px] bg-[var(--bg-hover)] text-[var(--text-main)] font-bold rounded-xl border border-[var(--border)] text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[var(--bg-input)]"
          >
            <X size={18} />
            초기화
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 h-[50px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg text-[16px]
                  ${
                    isReadyToSave
                      ? 'bg-header-navy text-white hover:opacity-90'
                      : 'bg-header-navy text-white opacity-60 cursor-not-allowed'
                  }`}
          >
            <CheckCircle2 size={18} />
            일지저장
          </button>
        </div>
      </div>

      {/* Material Card */}
      <div className="bg-bg-surface rounded-2xl p-6 mb-4 shadow-sm border border-transparent">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy flex items-center gap-2">
            <Package className="text-header-navy" size={20} />
            자재 사용 내역
            <span className="text-[13px] text-text-sub font-medium ml-2">ㅣ 자재 있을 시 입력</span>
          </div>
        </div>
        <div className="grid grid-cols-[1.8fr_1fr_auto] gap-2.5 mb-3 items-center">
          <select
            value={isMaterialDirect ? 'custom' : selectedMaterialName}
            onChange={e => {
              if (e.target.value === 'custom') {
                setIsMaterialDirect(true)
                setSelectedMaterialName('직접입력')
                setCustomMaterialValue('')
              } else {
                setIsMaterialDirect(false)
                setSelectedMaterialName(e.target.value)
              }
            }}
            className="w-full h-[48px] bg-bg-input border border-border rounded-xl px-4 pr-10 appearance-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="NPC-1000">NPC-1000</option>
            <option value="NPC-3000Q">NPC-3000Q</option>
            {customMaterialOption && (
              <option value={customMaterialOption}>{customMaterialOption}</option>
            )}
            <option value="custom">직접입력</option>
          </select>
          <div className="flex items-center bg-bg-input border border-border rounded-xl h-[48px] px-3">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={materialQty}
              onChange={e => setMaterialQty(e.target.value)}
              onKeyDown={e => {
                if (e.key === '-' || e.key === 'e') e.preventDefault()
              }}
              className="flex-1 bg-transparent text-right font-medium outline-none w-full"
            />
            <span className="text-text-sub text-[15px] font-medium ml-1">말</span>
          </div>
          <button
            onClick={addMaterial}
            className="w-12 h-[48px] bg-primary-bg text-primary rounded-xl font-black text-lg flex items-center justify-center hover:bg-blue-100"
          >
            +
          </button>
        </div>

        {isMaterialDirect && (
          <div className="flex gap-2 mb-3 animate-[slideDown_0.2s_ease-out]">
            <input
              type="text"
              className="flex-1 h-[48px] bg-bg-input border border-border rounded-xl px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="자재명 직접 입력"
              value={customMaterialValue}
              onChange={e => setCustomMaterialValue(e.target.value)}
            />
            <button
              onClick={handleConfirmCustomMaterial}
              className="bg-header-navy text-white px-4 rounded-xl font-bold text-sm w-full sm:w-auto whitespace-nowrap"
            >
              확인
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {materials.map(mat => (
            <div
              key={mat.id}
              className="bg-bg-surface border border-border rounded-xl p-3 flex justify-between items-center text-[15px]"
            >
              <div>
                <span className="font-semibold">{mat.name}</span>
                <span className="text-primary ml-2">{mat.qty}말</span>
              </div>
              <button
                onClick={() => setMaterials(prev => prev.filter(m => m.id !== mat.id))}
                className="bg-red-50 text-red-500 text-sm font-bold px-2.5 py-1 rounded-xl"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-bg-surface rounded-2xl p-5 shadow-sm border border-transparent">
        <div
          onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
          className="flex justify-between items-center pb-3 border-b border-border cursor-pointer mb-4"
        >
          <div className="text-xl font-bold text-header-navy flex items-center gap-2">
            <FileText className="text-header-navy" size={20} />
            작성 내용 요약
          </div>
          <ChevronDown
            className={`text-slate-400 transition-transform ${!isSummaryCollapsed ? 'rotate-180' : ''}`}
            size={20}
          />
        </div>
        {!isSummaryCollapsed && (
          <div className="space-y-2 text-sm text-text-sub">
            <div>
              현장:{' '}
              <span className="font-medium text-text-main">
                {getAllSites().find(s => s.value === selectedSite)?.text || '선택 안됨'}
              </span>
            </div>
            <div>
              소속: <span className="font-medium text-text-main">{dept || '선택 안됨'}</span>
            </div>
            <div>
              작업일자: <span className="font-medium text-text-main">{workDate}</span>
            </div>
            <div>
              투입인원:{' '}
              <span className="font-medium text-text-main">
                {manpowerList.length}명 (
                {manpowerList.reduce((sum, m) => sum + m.workHours, 0).toFixed(1)}공수)
              </span>
            </div>
            <div>
              작업세트: <span className="font-medium text-text-main">{workSets.length}개</span>
            </div>
            <div>
              자재: <span className="font-medium text-text-main">{materials.length}종류</span>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-2.5 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-[9999] animate-[slideDown_0.3s_ease-out]">
          <CheckCircle2 size={16} className="text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* 내비게이션 바 공간 확보를 위한 여백 (스크롤 방해 방지) */}
      <div className="h-20" />

      <WorkReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        siteName={getAllSites().find(s => s.value === selectedSite)?.text || ''}
        manpowerList={manpowerList}
        workSets={workSets}
        materials={materials}
      />

      {/* New Worklog Registration Modal */}
      {isNewWorklogOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setIsNewWorklogOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] rounded-t-2xl p-6 z-50 animate-[slideDown_0.3s_reverse] max-w-[600px] mx-auto border-t border-[var(--border)]">
            <div className="text-center font-bold text-lg mb-5 text-[var(--text-main)]">
              새 작업일지 등록
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[15px] font-bold text-[var(--text-sub)] mb-2">
                  현장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSiteName}
                  onChange={e => setNewSiteName(e.target.value)}
                  placeholder="현장명을 직접 입력하세요"
                  className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 text-[16px] font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[var(--text-main)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold text-[var(--text-sub)] mb-2">
                  소속 <span className="text-slate-400 font-normal ml-1">ㅣ 직접 입력</span>
                </label>
                <input
                  type="text"
                  value={newSiteAffiliation}
                  onChange={e => setNewSiteAffiliation(e.target.value)}
                  placeholder="소속을 입력하세요"
                  className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 text-[16px] font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsNewWorklogOpen(false)
                  setNewSiteName('')
                  setNewSiteAffiliation('')
                }}
                className="flex-1 h-[54px] bg-[var(--bg-hover)] text-[var(--text-main)] rounded-2xl font-bold text-[16px] hover:bg-[var(--bg-input)] transition-colors border border-[var(--border)]"
              >
                취소
              </button>
              <button
                onClick={handleCreateNewWorklog}
                className="flex-1 h-[54px] bg-primary text-white rounded-2xl font-bold text-[16px] hover:bg-blue-600 transition-colors"
              >
                등록
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WorklogPage
