import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  Users,
  HardHat,
  Package,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  ScanLine,
  CheckCircle2,
  Map,
  X,
  Search,
} from 'lucide-react'
import {
  REGION_SITES,
  PREDEFINED_WORKERS,
  MEMBER_CHIPS,
  PROCESS_CHIPS,
  TYPE_CHIPS,
} from './constants'
import { ManpowerItem, WorkSet, MaterialItem, PhotoData, Site } from './types'
import DrawingModal from './components/DrawingModal'
import PhotoEditor from './components/PhotoEditor'
import WorkReportModal from './components/WorkReportModal'

const App: React.FC = () => {
  // State: Global
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // State: Form Data
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [siteSearch, setSiteSearch] = useState('') // For site search input
  const [showSiteDropdown, setShowSiteDropdown] = useState(false) // For site dropdown visibility
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

  // State: Photos & Drawings
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [drawings, setDrawings] = useState<string[]>([])

  // State: Modals & UI
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false)
  const [drawingImgSrc, setDrawingImgSrc] = useState<string | null>(null)
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true)
  const [isDrawingSheetOpen, setIsDrawingSheetOpen] = useState(false)

  // State: Site Drawing Viewer
  const [isSiteDrawingViewerOpen, setIsSiteDrawingViewerOpen] = useState(false)
  const [siteDrawingPages, setSiteDrawingPages] = useState<string[]>([])

  // State: Ready to Save
  const [isReadyToSave, setIsReadyToSave] = useState(false)

  // Refs for hidden inputs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const drawingInputRef = useRef<HTMLInputElement>(null)

  // Helper: Get all sites flat list and Reverse it to show "Newest" first
  const getAllSites = () => Object.values(REGION_SITES).flat().reverse()

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
        if (parsed.photos) setPhotos(parsed.photos)
        if (parsed.drawings) setDrawings(parsed.drawings)
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
      photos,
      drawings,
    }
    localStorage.setItem('inopnc_work_log', JSON.stringify(data))
  }, [selectedSite, dept, workDate, manpowerList, workSets, materials, photos, drawings])

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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) document.body.classList.add('dark-mode')
    else document.body.classList.remove('dark-mode')
  }

  // Filter sites for dropdown
  const getFilteredSites = () => {
    const all = getAllSites()
    if (siteSearch.trim()) {
      return all.filter(s => s.text.toLowerCase().includes(siteSearch.toLowerCase()))
    }
    return all
  }

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site.value)
    setSiteSearch(site.text)
    setDept(site.dept)
    setShowSiteDropdown(false)
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

  // Handlers: Photos (Native Upload)
  const handleNativePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files)

      // Get current work set info for defaults
      const currentSet = workSets[0]
      const member = currentSet.member === '기타' ? currentSet.customMemberValue : currentSet.member
      const process =
        currentSet.process === '기타' ? currentSet.customProcessValue : currentSet.process

      const newPhotos: PhotoData[] = files.map(file => ({
        img: URL.createObjectURL(file), // Using object URL for preview
        member: member || '',
        process: process || '',
        desc: '보수후',
      }))

      setPhotos(prev => [...prev, ...newPhotos])
      showToast(`${files.length}장의 사진이 등록되었습니다.`)

      // Reset input
      e.target.value = ''
    }
  }

  // Handlers: Drawings (Bulk Upload - Same as Photo)
  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files)
      const readers = files.map(file => {
        return new Promise<string>(resolve => {
          const reader = new FileReader()
          reader.onload = ev => resolve(ev.target?.result as string)
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then(results => {
        setDrawings(prev => [...prev, ...results])
        showToast(`도면 ${results.length}건이 등록되었습니다.`)
      })

      e.target.value = ''
      setIsDrawingSheetOpen(false)
    }
  }

  const handleLoadSiteDrawing = () => {
    // Generate multiple dummy pages
    const siteName = getAllSites().find(s => s.value === selectedSite)?.text || '현장 도면'
    const pages = [1, 2, 3].map(page => {
      const c = document.createElement('canvas')
      c.width = 1000
      c.height = 1414
      const ctx = c.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 1000, 1414)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 5
        ctx.strokeRect(50, 50, 900, 1314)
        ctx.font = 'bold 40px sans-serif'
        ctx.fillStyle = '#333'
        ctx.textAlign = 'center'
        ctx.fillText(`${siteName} - Page ${page}`, 500, 200)

        // Simple pattern
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          ctx.moveTo(100, 300 + i * 200)
          ctx.lineTo(900, 300 + i * 200)
        }
        ctx.stroke()
      }
      return c.toDataURL()
    })

    setSiteDrawingPages(pages)
    setIsSiteDrawingViewerOpen(true)
    setIsDrawingSheetOpen(false)
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
      setPhotos([])
      setDrawings([])
      setToastMessage(null)
      setIsSummaryCollapsed(true)
      setSiteDrawingPages([])
      setIsSiteDrawingViewerOpen(false)

      showToast('초기화 완료')
    }
  }

  return (
    <div
      className={`app-wrapper max-w-[600px] mx-auto px-4 font-main ${isDarkMode ? 'dark text-gray-100' : 'text-gray-900'}`}
    >
      {/* Quick Menu */}
      <section className="quick-menu-section">
        <div className="qm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img
              src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjYz/MDAxNzU3MzczOTIzNjUy.938EaPjiHzNGNoECgw9vItJhy_4pR6ZYVq3-8Z3tJecg.pSbWcXNy1U9El6kYe8OpwKmCEwkZiWJUiIM2R1qL2Swg.PNG/Flash.png?type=w966"
              alt="빠른메뉴"
              className="qm-title-icon-img"
            />
            <span className="qm-title">빠른메뉴</span>
          </div>
        </div>
        <div className="qm-grid">
          {[
            {
              name: '출력현황',
              icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966',
            },
            {
              name: '작업일지',
              badge: 3,
              badgeClass: 'qm-badge req worklog',
              icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966',
            },
            {
              name: '현장정보',
              icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966',
            },
            {
              name: '문서함',
              icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966',
            },
            {
              name: '본사요청',
              badge: 2,
              badgeClass: 'qm-badge req',
              icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966',
            },
            {
              name: '조치사항',
              badge: 0,
              badgeClass: 'qm-badge issue',
              icon: 'https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/photo.png?raw=true',
            },
          ].map((item, idx) => (
            <div key={idx} className={`qm-item ${item.badgeClass ? 'qm-item--event' : ''}`}>
              <div className="qm-icon-wrapper">
                {item.badge !== undefined ? (
                  <span className={item.badgeClass || ''}>{item.badge}</span>
                ) : null}
                <img src={item.icon} alt={item.name} className="qm-main-icon" />
              </div>
              <span className="qm-label">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Site Info Card */}
      <div
        id="site-card"
        className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-transparent dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <MapPin className="text-header-navy dark:text-white" size={20} />
            작업현장 <span className="text-danger">*</span>
          </div>
          <span className="bg-red-50 text-red-500 text-[13px] font-bold h-8 px-3.5 rounded-xl flex items-center">
            * 필수 입력
          </span>
        </div>

        <div className="mb-3">
          {/* Optimized Site Search (Combobox) */}
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
              onBlur={() => setTimeout(() => setShowSiteDropdown(false), 200)}
              placeholder="현장 선택 또는 검색"
              className="w-full h-[54px] bg-bg-input dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-4 text-[17px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-400"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              {siteSearch ? (
                <div
                  onClick={e => {
                    e.stopPropagation() // prevent triggering focus if we had pointer-events-auto
                  }}
                />
              ) : null}
              <ChevronDown size={20} />
            </div>

            {showSiteDropdown && (
              <ul className="absolute z-50 w-full mt-1.5 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-border dark:border-slate-600 rounded-xl shadow-xl animate-[slideDown_0.2s_ease-out]">
                {getFilteredSites().length > 0 ? (
                  getFilteredSites().map(s => (
                    <li
                      key={s.value}
                      onClick={() => handleSiteSelect(s)}
                      className={`px-4 py-3.5 cursor-pointer text-[15px] font-medium border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700
                                        ${selectedSite === s.value ? 'text-primary bg-blue-50 dark:bg-slate-700/50' : 'text-text-main dark:text-white'}
                                    `}
                    >
                      <div className="flex justify-between items-center">
                        <span>{s.text}</span>
                        <span className="text-xs text-text-sub bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                          {s.dept}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-center text-text-sub">검색 결과가 없습니다</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[15px] font-bold text-text-sub mb-2">
              소속 <span className="text-[13px] font-medium ml-1">ㅣ 자동연동</span>
            </label>
            <select
              disabled
              value={dept}
              className="w-full h-[54px] bg-slate-100 dark:bg-slate-800 border border-border dark:border-slate-600 rounded-xl px-4 text-[17px] font-medium text-text-sub appearance-none"
            >
              <option value="">소속 선택</option>
              <option value="HQ">본사</option>
            </select>
          </div>
          <div>
            <label className="block text-[15px] font-bold text-text-sub mb-2">작업일자</label>
            <input
              type="date"
              value={workDate}
              onChange={e => setWorkDate(e.target.value)}
              className="w-full h-[54px] bg-bg-input dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-4 text-[17px] font-medium outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Manpower Card */}
      <div
        id="manpower-card"
        className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-transparent dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <Users className="text-header-navy dark:text-white" size={20} />
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
              className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_auto] sm:grid-cols-[1.2fr_1fr_auto] gap-2 sm:gap-2.5 items-center bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-3.5 rounded-2xl transition-all"
            >
              {item.locked ? (
                <div className="text-[17px] font-bold text-text-main dark:text-white truncate px-1">
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
                      className="w-full h-[50px] bg-white dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-4 appearance-none outline-none focus:border-primary text-[15px] font-medium"
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
                      className="w-full h-[50px] bg-white dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-4 outline-none focus:border-primary text-[15px] font-medium"
                    />
                  )}
                </div>
              )}

              <div className="flex h-[48px] border border-border dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 overflow-hidden w-full min-w-0">
                <button
                  onClick={() => updateHours(item.id, -0.5)}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-slate-50 w-10 sm:w-auto"
                >
                  －
                </button>
                <span className="flex-1 flex items-center justify-center text-base font-bold border-x border-slate-100 dark:border-slate-700 min-w-[30px] sm:min-w-[50px]">
                  {item.workHours.toFixed(1)}
                </span>
                <button
                  onClick={() => updateHours(item.id, 0.5)}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-slate-50 w-10 sm:w-auto"
                >
                  ＋
                </button>
              </div>

              {!item.locked && (
                <button
                  onClick={() => removeManpower(item.id)}
                  className="bg-red-50 text-red-500 h-[32px] px-2 sm:px-3 rounded-xl text-[13px] sm:text-sm font-bold whitespace-nowrap"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Content Card */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-transparent dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <HardHat className="text-header-navy dark:text-white" size={20} />
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
              className="bg-white dark:bg-slate-900 border-2 border-primary rounded-2xl p-5 animate-[slideDown_0.3s_ease-out]"
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
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {section.items.map(chip => (
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
                        className={`h-[54px] rounded-xl border text-[17px] font-medium transition-all
                                            ${
                                              (ws as any)[section.key] === chip
                                                ? 'bg-white border-primary text-primary font-bold shadow-sm'
                                                : 'bg-bg-input border-border text-text-sub'
                                            }
                                        `}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  {(ws as any)[section.key] === '기타' && (
                    <input
                      className="w-full h-[54px] border border-border rounded-xl px-4 text-[17px] mt-1 outline-none focus:border-primary animate-[slideDown_0.2s]"
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

      {/* Material Card */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-transparent dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <Package className="text-header-navy dark:text-white" size={20} />
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
            className="w-full h-[48px] bg-bg-input dark:bg-slate-900 border border-border rounded-xl px-4 pr-10 appearance-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
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
          <div className="flex items-center bg-bg-input dark:bg-slate-900 border border-border rounded-xl h-[48px] px-3">
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
              className="flex-1 h-[48px] bg-bg-input dark:bg-slate-900 border border-border rounded-xl px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
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

      {/* Photos & Drawings */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-transparent dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <ImageIcon className="text-header-navy dark:text-white" size={20} />
            사진 및 도면
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 0 || drawings.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
            {photos.map((p, i) => (
              <div
                key={`p-${i}`}
                className="w-16 h-16 rounded-lg bg-slate-100 shrink-0 border overflow-hidden relative"
              >
                <img src={p.img} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] px-1">
                  사진
                </div>
              </div>
            ))}
            {drawings.map((d, i) => (
              <div
                key={`d-${i}`}
                className="w-16 h-16 rounded-lg bg-slate-100 shrink-0 border overflow-hidden relative"
              >
                <img src={d} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 bg-teal-500 text-white text-[10px] px-1">
                  도면
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[17px] font-bold text-text-sub mb-2">사진등록</div>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={photoInputRef}
              onChange={handleNativePhotoUpload}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-full h-[50px] border border-dashed border-blue-400 bg-blue-50 text-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors text-[15px] sm:text-[16px]"
            >
              <Camera size={20} /> 사진 등록
            </button>
          </div>
          <div>
            <div className="text-[17px] font-bold text-text-sub mb-2">도면마킹</div>
            <button
              onClick={() => setIsDrawingSheetOpen(true)}
              className="w-full h-[50px] border border-dashed border-teal-400 bg-teal-50 text-teal-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors text-[15px] sm:text-[16px]"
            >
              <ScanLine size={20} /> 도면마킹
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Bottom Sheet */}
      {isDrawingSheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setIsDrawingSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 animate-[slideDown_0.3s_reverse] max-w-[600px] mx-auto">
            <div className="text-center font-bold text-lg mb-5 text-gray-900">도면 선택</div>
            <label className="w-full h-[54px] bg-blue-50 text-blue-500 border border-blue-200 rounded-xl font-bold flex items-center justify-center gap-2 mb-2.5 cursor-pointer">
              <Camera size={18} /> 도면 업로드
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*"
                onChange={handleDrawingUpload}
                ref={drawingInputRef}
              />
            </label>
            <button
              onClick={handleLoadSiteDrawing}
              className="w-full h-[54px] bg-slate-50 text-gray-800 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 mb-2.5"
            >
              <Map size={18} /> 현장 도면 불러오기
            </button>
            <button
              onClick={() => setIsDrawingSheetOpen(false)}
              className="w-full h-[54px] bg-header-navy text-white rounded-xl font-bold mt-2"
            >
              닫기
            </button>
          </div>
        </>
      )}

      {/* Site Drawing Viewer Overlay */}
      {isSiteDrawingViewerOpen && (
        <div className="fixed inset-0 bg-[#111827] z-[60] flex flex-col animate-[fadeIn_0.2s]">
          <div className="h-[52px] bg-header-navy flex items-center justify-between px-3 text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSiteDrawingViewerOpen(false)}>
                <X className="w-6 h-6" />
              </button>
              <span className="font-bold text-lg">현장 도면 목록</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {siteDrawingPages.map((src, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-lg"
                onClick={() => {
                  setDrawingImgSrc(src)
                  setIsDrawingModalOpen(true)
                  setIsSiteDrawingViewerOpen(false)
                }}
              >
                <div className="p-3 border-b flex justify-between items-center bg-slate-50">
                  <span className="font-bold text-slate-700">Page {i + 1}</span>
                  <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold">
                    마킹 실행
                  </button>
                </div>
                <img
                  src={src}
                  className="w-full h-auto object-contain bg-white"
                  alt={`Page ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-sm border border-transparent dark:border-slate-700">
        <div
          onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
          className="flex justify-between items-center pb-3 border-b border-border cursor-pointer mb-4"
        >
          <div className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2">
            <FileText className="text-header-navy dark:text-white" size={20} />
            작성 내용 요약
          </div>
          {isSummaryCollapsed ? (
            <ChevronDown className="text-text-sub" />
          ) : (
            <ChevronUp className="text-text-sub" />
          )}
        </div>

        <div
          className={`transition-all overflow-hidden ${isSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}
        >
          {[
            {
              label: '현장',
              value: getAllSites().find(s => s.value === selectedSite)?.text || '선택 안됨',
            },
            { label: '작업일자', value: workDate },
            { label: '투입인원', value: `${manpowerList.length}명` },
            { label: '부재명', value: workSets[0]?.member || '-' },
            { label: '작업공정', value: workSets[0]?.process || '-' },
            {
              label: '블럭/동/층',
              value: `${workSets[0]?.location.block || ''} ${workSets[0]?.location.dong || ''} ${workSets[0]?.location.floor || ''}`,
            },
          ].map((row, i, arr) => (
            <div
              key={i}
              className={`flex justify-between py-1.5 ${i === arr.length - 1 ? '' : 'border-b border-slate-100'}`}
            >
              <span className="text-[17px] font-bold text-text-sub">{row.label}</span>
              <span className="text-[17px] font-semibold text-text-main dark:text-white text-right">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <div className="flex gap-2 items-center">
              <span className="text-[17px] font-bold text-text-sub">사진 업로드</span>
              <span className="text-[17px] font-semibold text-text-main dark:text-white">
                {photos.length}장
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[17px] font-bold text-text-sub">도면 업로드</span>
              <span className="text-[17px] font-semibold text-text-main dark:text-white">
                {drawings.length}건
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-2.5 rounded-full text-[13px] font-bold shadow-xl flex items-center gap-2 z-[9999] animate-[slideDown_0.3s_ease-out]">
          <CheckCircle2 size={16} className="text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* --- 하단 고정 내비게이션 바 (Bottom Navigation) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-safe">
        <div className="max-w-[600px] mx-auto flex gap-3 h-[54px]">
          {/* 초기화 버튼 */}
          <button
            onClick={handleReset}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <X size={18} />
            <span className="text-[15px]">초기화</span>
          </button>

          {/* 저장 버튼 (유효성 검사 상태 반영) */}
          <button
            onClick={handleSave}
            className={`flex-[2.5] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
                      ${
                        isReadyToSave
                          ? 'bg-blue-600 text-white shadow-blue-500/30'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
          >
            <CheckCircle2 size={18} />
            <span className="text-[16px]">
              {isReadyToSave ? '일지 저장 완료' : '필수 항목을 입력하세요'}
            </span>
          </button>
        </div>
      </nav>

      {/* 내비게이션 바 공간 확보를 위한 여백 (스크롤 방해 방지) */}
      <div className="h-28" />

      {/* Modals */}
      <DrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        imageSrc={drawingImgSrc}
        onSave={dataUrl => {
          setDrawings(prev => [...prev, dataUrl])
          showToast('도면 마킹 저장 완료')
          setIsDrawingModalOpen(false)
        }}
      />

      {/* Kept for potential future use or if direct edit is needed via other flows */}
      <PhotoEditor
        isOpen={isPhotoEditorOpen}
        onClose={() => setIsPhotoEditorOpen(false)}
        initialData={photos}
        onUpdate={newPhotos => setPhotos(newPhotos)}
        meta={{
          site: getAllSites().find(s => s.value === selectedSite)?.text || '',
          project: '균열보수 공사',
          member: workSets[0]?.member || '',
          process: workSets[0]?.process || '',
        }}
      />

      <WorkReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        siteName={getAllSites().find(s => s.value === selectedSite)?.text || ''}
        manpowerList={manpowerList}
        workSets={workSets}
        materials={materials}
      />
    </div>
  )
}

export default App
