import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  X,
  Map,
  UploadCloud,
  CheckCircle2,
  Download,
  Minus,
  Hand,
  Share2,
  ArrowLeft,
  Plus as PlusIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Site, FilterStatus } from '@inopnc/shared'
import { INITIAL_SITES, A3_SAMPLE_SVG } from '../../site/constants'
import { SiteCard } from '../../site/components/SiteCard'
import { Toast } from '../../site/components/Toast'

export const SitePage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sort, setSort] = useState<'latest' | 'name'>('latest')
  const [monthFilter, setMonthFilter] = useState('2025-12')
  const [visibleCount, setVisibleCount] = useState(5)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'warning' }>({
    show: false,
    msg: '',
    type: 'success',
  })
  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500)
  }

  // UI State
  const [showSearchOptions, setShowSearchOptions] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null) // Ref for click outside logic

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerContent, setViewerContent] = useState<string>('')
  const [viewerTitle, setViewerTitle] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [fmOpen, setFmOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  // Drawing Viewer State
  const [drawingPage, setDrawingPage] = useState(1)
  const totalDrawingPages = 5 // 예시: 5페이지

  // Click Outside Handler for Search Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSearchOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter Logic
  const filteredSites = useMemo(() => {
    let result = sites.filter(site => {
      const matchesSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.addr.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || site.status === filterStatus

      // Date Filter (only for 'latest' sort)
      const matchesDate =
        sort === 'latest' && monthFilter ? site.lastDate.startsWith(monthFilter) : true

      return matchesSearch && matchesStatus && matchesDate
    })

    // Sorting
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (sort === 'name') return a.name.localeCompare(b.name)
      // Latest: Sort by ID descending (simulating date)
      return b.id - a.id
    })

    return result
  }, [sites, search, filterStatus, sort, monthFilter])

  const displaySites = filteredSites.slice(0, visibleCount)

  // Handlers
  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedIds(newSet)
  }

  const togglePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSites(prev =>
      prev.map(s => {
        if (s.id === id) {
          const newPinned = !s.pinned
          showToast(newPinned ? '상단에 고정되었습니다.' : '고정이 해제되었습니다.')
          return { ...s, pinned: newPinned }
        }
        return s
      })
    )
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('이 현장을 삭제하시겠습니까?')) {
      setSites(prev => prev.filter(s => s.id !== id))
    }
  }

  const handleEdit = (id: number, field: keyof Site, e: React.MouseEvent) => {
    e.stopPropagation()
    const site = sites.find(s => s.id === id)
    if (!site) return
    let label: string = field
    if (field === 'addr') label = '주소'
    if (field === 'manager') label = '현장소장 이름'
    if (field === 'safety') label = '안전담당 이름'

    const val = window.prompt(`새로운 ${label}를 입력하세요:`, String(site[field] || ''))
    if (val !== null) {
      setSites(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)))
    }
  }

  const handleActionClick = (site: Site, type: string) => {
    // 3. Inactive Button Logic: Check data, if empty prevent and toast
    if (type === 'draw') {
      const hasDraw =
        (site.drawings.construction.length ||
          site.drawings.progress.length ||
          site.drawings.completion.length) > 0
      if (!hasDraw) {
        showToast('등록된 데이터가 없습니다.', 'warning')
        return
      }
      setSelectedSiteId(site.id)
      setSheetOpen(true)
    } else if (type === 'photo') {
      if (site.images.length === 0) {
        showToast('등록된 데이터가 없습니다.', 'warning')
        return
      }
      openViewer(site.id, 'photo')
    } else if (type === 'ptw') {
      if (!site.ptw) {
        showToast('등록된 데이터가 없습니다.', 'warning')
        return
      }
      openViewer(site.id, 'ptw')
    } else if (type === 'log') {
      if (!site.workLog) {
        showToast('등록된 데이터가 없습니다.', 'warning')
        return
      }
      openViewer(site.id, 'log')
    } else if (type === 'action') {
      if (!site.punch) {
        showToast('등록된 데이터가 없습니다.', 'warning')
        return
      }
      openViewer(site.id, 'action')
    }
  }

  // File Upload Handlers
  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '*/*'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const files = Array.from(target.files || [])
      if (files.length > 0) {
        setUploadedFiles(prev => [...prev, ...files] as File[])
        showToast(`${files.length}개 파일이 업로드되었습니다.`)
      }
    }
    input.click()
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    showToast('파일이 삭제되었습니다.')
  }

  const handleClearAllFiles = () => {
    setUploadedFiles([])
    showToast('모든 파일이 삭제되었습니다.')
  }

  // Preview handlers
  const handlePreviewFile = (file: File) => {
    setPreviewFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewFile(null)
    setPreviewUrl('')
  }

  const handleReplaceFile = (index: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '*/*'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const newFile = target.files?.[0]
      if (newFile) {
        setUploadedFiles(prev => {
          const updated = [...prev]
          updated[index] = newFile
          return updated
        })
        showToast('파일이 교체되었습니다.')
      }
    }
    input.click()
  }

  const openViewer = (siteId: number, type: string) => {
    const site = sites.find(s => s.id === siteId)
    if (!site) return

    if (type === 'draw-sample') {
      setViewerTitle(`공사 도면 (${drawingPage}/${totalDrawingPages})`)
      setViewerContent(
        `<img src="${A3_SAMPLE_SVG}" style="width:100%; max-width:850px; box-shadow:0 0 30px rgba(0,0,0,0.2);" />`
      )
      setViewerOpen(true)
      setDrawingPage(1) // 페이지 초기화
    } else {
      setViewerTitle(
        type === 'photo'
          ? '사진대지'
          : type === 'ptw'
            ? 'PTW'
            : type === 'log'
              ? '작업일지'
              : '조치사항'
      )
      let content = `<div class="p-10 text-center">Preview for ${type} of ${site.name}</div>`
      setViewerContent(content)
      setViewerOpen(true)
    }
  }

  const handleSearchSelect = (name: string) => {
    setSearch(name)
    setShowSearchOptions(false)
  }

  // Update Search Handler: Show dropdown only if search is present
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setShowSearchOptions(val.trim().length > 0)
  }

  const handleSearchInteraction = () => {
    if (search.trim().length > 0) setShowSearchOptions(true)
  }

  const handleAddSite = () => {
    const name = (document.getElementById('newSiteName') as HTMLInputElement).value
    if (!name) {
      alert('현장명은 필수입니다.')
      return
    }
    const newSite: Site = {
      id: Date.now(),
      pinned: false,
      status: 'ing',
      affil: '직접',
      name: name,
      addr: '',
      days: 1,
      mp: 0,
      manager: '',
      safety: '',
      phoneM: '',
      phoneS: '',
      lodge: '',
      note: '',
      lastDate: '2025-12-12',
      lastTime: '09:00',
      drawings: { construction: [], progress: [], completion: [] },
      ptw: null,
      workLog: null,
      doc: null,
      punch: null,
      images: [],
      isLocal: true,
    }
    setSites([newSite, ...sites])
    setAddModalOpen(false)
  }

  return (
    <div
      className="w-full max-w-[600px] mx-auto p-4 box-border min-h-screen"
      style={{
        backgroundColor: 'var(--bg-body)',
        color: 'var(--text-main)',
        paddingTop: '0px',
        paddingBottom: '10px',
      }}
    >
      {/* Sticky Header */}
      <div
        className="relative z-50 bg-bg-body -ml-4 -mr-4 px-4 transition-colors"
        style={{ paddingTop: '0px', paddingBottom: '0px', marginBottom: '24px' }}
      >
        {/* Search */}
        <div
          className="relative mb-2 flex items-center group"
          id="searchComboWrapper"
          ref={searchWrapperRef}
        >
          <input
            type="text"
            className="
                            w-full h-[54px] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-[22px] pr-12 text-[17px] text-[var(--text-main)] font-medium 
                            transition-all duration-200 ease-out 
                            hover:border-slate-300 dark:hover:border-slate-600 
                            focus:outline-none focus:bg-[var(--bg-surface)] 
                            focus:border-primary focus:border-[1.5px] 
                            focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] 
                            cursor-pointer focus:cursor-text
                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                        "
            placeholder="현장명을 입력하세요."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onClick={handleSearchInteraction}
            onFocus={handleSearchInteraction}
          />
          {search ? (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
              onClick={() => {
                setSearch('')
                setShowSearchOptions(false)
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <Search
              className="absolute right-[18px] top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
              size={20}
            />
          )}

          {showSearchOptions && (
            <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl animate-slideDown">
              {sites.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).length ===
              0 ? (
                <div className="p-4 text-slate-400 dark:text-slate-500 text-center">
                  검색 결과 없음
                </div>
              ) : (
                <>
                  <div
                    className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                    onClick={() => handleSearchSelect('')}
                  >
                    전체 현장
                  </div>
                  {sites
                    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                    .map(s => (
                      <div
                        key={s.id}
                        className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                        onClick={() => handleSearchSelect(s.name)}
                      >
                        {s.name}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </div>

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

        {/* Chip Filter */}
        <div className="overflow-hidden relative">
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1 items-center scrollbar-hide">
            {(['all', 'ing', 'wait', 'done'] as FilterStatus[]).map(status => {
              const label = {
                all: '전체',
                ing: '진행중',
                wait: '예정',
                hold: '보류',
                done: '완료',
              }[status]
              const active = filterStatus === status

              // Style Mapping with new design requirements
              let activeClass = ''
              if (active) {
                if (status === 'all')
                  activeClass =
                    'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(49,163,250,0.15)] font-bold'
                if (status === 'ing')
                  activeClass =
                    'bg-sky-600 text-white border-sky-600 shadow-[0_2px_8px_rgba(59,130,246,0.15)] font-bold'
                if (status === 'wait')
                  activeClass =
                    'bg-purple-500 text-white border-purple-500 shadow-[0_2px_8px_rgba(139,92,246,0.15)] font-bold'
                if (status === 'done')
                  activeClass =
                    'bg-slate-500 text-white border-slate-500 shadow-[0_2px_8px_rgba(100,116,139,0.15)] font-bold'
              } else {
                activeClass =
                  'bg-[var(--bg-surface)] border-[var(--border)] text-slate-400 dark:text-slate-500 font-medium'
              }

              return (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status)
                    setVisibleCount(5)
                  }}
                  className={`flex-1 h-10 px-2 text-[14px] whitespace-nowrap shadow-sm min-w-0 transition-all font-bold
                                        rounded-full ${activeClass}`}
                >
                  {label}
                </button>
              )
            })}
            <button
              className="border-[1.5px] border-primary bg-primary-bg text-primary px-3 h-10 rounded-full text-[14px] font-extrabold flex items-center justify-center gap-1 shrink-0 ml-1 active:scale-95"
              onClick={() => setAddModalOpen(true)}
            >
              <PlusIcon size={16} /> 추가
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {displaySites.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          displaySites.map(site => (
            <SiteCard
              key={site.id}
              site={site}
              expanded={expandedIds.has(site.id)}
              onToggleExpand={toggleExpand}
              onTogglePin={togglePin}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onActionClick={handleActionClick}
            />
          ))
        )}
      </div>

      {/* Load More / Collapse */}
      {filteredSites.length > 5 && (
        <button
          className="w-full h-[50px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-text-sub font-semibold text-[15px] flex items-center justify-center gap-1.5 mt-2.5 active:scale-95 transition-transform hover:bg-[var(--bg-hover)]"
          onClick={() => {
            if (visibleCount >= filteredSites.length) {
              // 접기: 초기값으로 리셋하고 맨 위로 스크롤
              setVisibleCount(5)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              // 더보기: 5개씩 추가
              setVisibleCount(prev => Math.min(prev + 5, filteredSites.length))
            }
          }}
        >
          {visibleCount >= filteredSites.length ? (
            <>
              접기 <ChevronUp size={16} />
            </>
          ) : (
            <>
              더 보기 <ChevronDown size={16} />
            </>
          )}
        </button>
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity ${sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] rounded-t-3xl p-6 z-[2100] transition-transform duration-300 max-w-[600px] mx-auto ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="text-center font-bold text-[18px] mb-5 text-[var(--text-main)]">
          도면 선택
        </div>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-primary-bg text-primary border-primary"
          onClick={() => {
            setSheetOpen(false)
            openViewer(selectedSiteId!, 'draw-sample')
          }}
        >
          <Map size={20} /> 공사 도면 (조회)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
          onClick={() => {
            setSheetOpen(false)
            setFmOpen(true)
          }}
        >
          <UploadCloud size={20} /> 진행 도면 (관리)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
          onClick={() => {
            setSheetOpen(false)
            setViewerTitle(`완료 도면 (${drawingPage}/${totalDrawingPages})`)
            setViewerContent(
              `<img src="${A3_SAMPLE_SVG}" style="width:100%; max-width:850px; box-shadow:0 0 30px rgba(0,0,0,0.2);" />`
            )
            setViewerOpen(true)
            setDrawingPage(1)
          }}
        >
          <CheckCircle2 size={20} /> 완료 도면 (확인)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mt-2.5 font-semibold bg-header-navy text-white border-none hover:opacity-90"
          onClick={() => setSheetOpen(false)}
        >
          닫기
        </button>
      </div>

      {/* File Manager (Simple Mock) */}
      <div
        className={`fixed inset-0 bg-[var(--bg-body)] z-[2200] flex flex-col transition-transform duration-300 ${fmOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-14 px-4 border-b border-[var(--border)] flex justify-between items-center font-extrabold text-[17px] bg-[var(--bg-surface)] text-[var(--text-main)]">
          <span>진행 도면 (관리)</span>
          <button onClick={() => setFmOpen(false)}>
            <X className="text-[var(--text-main)]" />
          </button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  {uploadedFiles.length}개 파일
                </span>
                <button
                  onClick={handleClearAllFiles}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  모두 삭제
                </button>
              </div>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-[var(--border)] rounded-lg shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p
                      className="text-sm font-medium text-[var(--text-main)] truncate"
                      title={file.name}
                    >
                      {file.name.length > 20 ? `${file.name.slice(0, 17)}...` : file.name}
                    </p>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePreviewFile(file)}
                      className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="미리보기"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleReplaceFile(index)}
                      className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="교체"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="삭제"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-sub">파일이 없습니다.</div>
          )}
        </div>
        <div className="p-4 border-t border-[var(--border)] flex gap-2.5 bg-[var(--bg-surface)]">
          <button
            className="flex-1 h-[50px] rounded-xl font-bold bg-header-navy text-white border-none hover:bg-header-navy/90 transition-colors"
            onClick={handleFileUpload}
          >
            파일 추가
          </button>
          <button
            className="flex-1 h-[50px] rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setFmOpen(false)}
          >
            닫기
          </button>
        </div>
      </div>

      {/* Viewer Modal */}
      <div
        className={`fixed inset-0 bg-slate-950 z-[9999] flex flex-col ${viewerOpen ? 'flex' : 'hidden pointer-events-none'}`}
      >
        <div className="bg-slate-950 h-14 flex items-center justify-between px-4 shrink-0 z-10 border-b border-white/10">
          <button onClick={() => setViewerOpen(false)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <span className="text-white font-bold">{viewerTitle}</span>
          <button onClick={() => alert('Download')} className="text-white">
            <Download size={24} />
          </button>
        </div>
        <div className="flex-1 bg-slate-900 overflow-hidden relative flex justify-center items-center">
          <div
            dangerouslySetInnerHTML={{ __html: viewerContent }}
            className="bg-transparent"
            style={{ transform: 'scale(0.8)' }}
          />
        </div>
        {(viewerTitle.includes('공사 도면') || viewerTitle.includes('완료 도면')) && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 z-[10001] border border-white/20">
            <button
              onClick={() => {
                if (drawingPage > 1) {
                  setDrawingPage(drawingPage - 1)
                  const title = viewerTitle.includes('완료 도면') ? '완료 도면' : '공사 도면'
                  setViewerTitle(`${title} (${drawingPage - 1}/${totalDrawingPages})`)
                }
              }}
              className={`text-white/70 hover:text-white transition-colors ${drawingPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={drawingPage === 1}
            >
              <ChevronDown size={20} className="rotate-90" />
            </button>
            <span className="text-white font-medium text-sm">
              {drawingPage} / {totalDrawingPages}
            </span>
            <button
              onClick={() => {
                if (drawingPage < totalDrawingPages) {
                  setDrawingPage(drawingPage + 1)
                  const title = viewerTitle.includes('완료 도면') ? '완료 도면' : '공사 도면'
                  setViewerTitle(`${title} (${drawingPage + 1}/${totalDrawingPages})`)
                }
              }}
              className={`text-white/70 hover:text-white transition-colors ${drawingPage === totalDrawingPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={drawingPage === totalDrawingPages}
            >
              <ChevronDown size={20} className="-rotate-90" />
            </button>
          </div>
        )}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-50/10 backdrop-blur-md px-6 py-2.5 rounded-full flex gap-6 z-[10000] border border-white/20">
          <button className="text-white/70 hover:text-white flex flex-col items-center text-[10px] gap-1 transition-colors">
            <Minus size={18} />
            축소
          </button>
          <button className="text-white/70 hover:text-white flex flex-col items-center text-[10px] gap-1 transition-colors">
            <Hand size={18} />
            이동
          </button>
          <button className="text-white/70 hover:text-white flex flex-col items-center text-[10px] gap-1 transition-colors">
            <PlusIcon size={18} />
            확대
          </button>
          <button className="text-white/70 hover:text-white flex flex-col items-center text-[10px] gap-1 transition-colors">
            <Share2 size={18} />
            공유
          </button>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col">
          <div className="bg-[var(--bg-surface)] h-14 flex items-center justify-between px-4 shrink-0 z-10 border-b border-[var(--border)]">
            <button
              onClick={handleClosePreview}
              className="text-[var(--text-main)] hover:bg-[var(--bg-hover)] p-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <span className="font-bold text-[var(--text-main)] text-base">
              {previewFile.name.length > 25
                ? `${previewFile.name.slice(0, 22)}...`
                : previewFile.name}
            </span>
            <button
              onClick={() => {
                const a = document.createElement('a')
                a.href = previewUrl
                a.download = previewFile.name
                a.click()
              }}
              className="text-[var(--text-main)] hover:bg-[var(--bg-hover)] p-2 rounded-lg transition-colors"
            >
              <Download size={24} />
            </button>
          </div>
          <div className="flex-1 bg-[var(--bg-body)] overflow-auto flex justify-center items-center p-4">
            {previewFile.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            ) : previewFile.type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg shadow-2xl"
                title={previewFile.name}
              />
            ) : (
              <div className="text-center text-[var(--text-sub)]">
                <div className="mb-6">
                  <div className="w-32 h-32 mx-auto bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center shadow-lg">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-[var(--text-main)]"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-semibold mb-2 text-[var(--text-main)]">
                  {previewFile.name}
                </p>
                <p className="text-sm mb-6 text-[var(--text-sub)]">
                  {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = previewUrl
                    a.download = previewFile.name
                    a.click()
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
                >
                  다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Site Modal */}
      {addModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1500]"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl z-[2100] p-6 shadow-2xl">
            <div className="text-[18px] font-extrabold mb-5 text-header-navy">새 현장 등록</div>
            <input
              type="text"
              id="newSiteName"
              className="w-full h-[50px] px-4 border border-[var(--border)] rounded-xl text-[16px] bg-[var(--bg-surface)] text-[var(--text-main)] font-medium mb-5 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="현장명을 입력하세요"
            />
            <div className="flex gap-2.5">
              <button
                className="flex-1 h-12 rounded-xl text-[16px] font-bold bg-[var(--bg-hover)] text-text-sub border border-[var(--border)]"
                onClick={() => setAddModalOpen(false)}
              >
                취소
              </button>
              <button
                className="flex-1 h-12 rounded-xl text-[16px] font-bold bg-header-navy text-white hover:opacity-90"
                onClick={handleAddSite}
              >
                생성
              </button>
            </div>
          </div>
        </>
      )}

      <Toast show={toast.show} message={toast.msg} type={toast.type} />
    </div>
  )
}
