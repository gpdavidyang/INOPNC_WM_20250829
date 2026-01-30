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
  Plus,
  Share2,
  ArrowLeft,
  Plus as PlusIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Site, FilterStatus, DrawingFile } from '@inopnc/shared'
import { INITIAL_SITES, A3_SAMPLE_SVG } from '../constants'
import { SiteCard } from '../components/SiteCard'
import { Toast } from '../components/Toast'

export const SitePage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sort, setSort] = useState<'latest' | 'name'>('latest')
  const [monthFilter, setMonthFilter] = useState('2025-12')
  const [visibleCount, setVisibleCount] = useState(5)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'warning' }>({
    show: false,
    msg: '',
    type: 'success',
  })
  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500)
  }

  const [showSearchOptions, setShowSearchOptions] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerContent, setViewerContent] = useState<string>('')
  const [viewerTitle, setViewerTitle] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [fmOpen, setFmOpen] = useState(false)
  const [fmType, setFmType] = useState<'construction' | 'progress' | 'completion'>('progress')

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

  const filteredSites = useMemo(() => {
    let result = sites.filter(site => {
      const matchesSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.addr.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || site.status === filterStatus
      const matchesDate =
        sort === 'latest' && monthFilter ? site.lastDate.startsWith(monthFilter) : true
      return matchesSearch && matchesStatus && matchesDate
    })

    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (sort === 'name') return a.name.localeCompare(b.name)
      return b.id - a.id
    })

    return result
  }, [sites, search, filterStatus, sort, monthFilter])

  const displaySites = filteredSites.slice(0, visibleCount)

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

  const openViewer = (siteId: number, type: string) => {
    const site = sites.find(s => s.id === siteId)
    if (!site) return
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
    if (type === 'draw-sample') {
      content = `<img src="${A3_SAMPLE_SVG}" style="width:100%; max-width:850px; box-shadow:0 0 30px rgba(0,0,0,0.2);" />`
    }
    setViewerContent(content)
    setViewerOpen(true)
  }

  const handleSearchSelect = (name: string) => {
    setSearch(name)
    setShowSearchOptions(false)
  }

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
    setFilterStatus('all')
    setVisibleCount(5)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div>
      <div className="relative z-50 bg-[var(--bg-body)] -ml-5 -mr-5 px-5 pt-4 pb-2 mb-2 transition-colors">
        <div
          className="relative mb-4 flex items-center group"
          id="searchComboWrapper"
          ref={searchWrapperRef}
        >
          <input
            type="text"
            className="w-full h-[54px] rounded-2xl bg-bg-surface border border-border px-[22px] pr-12 text-[17px] text-text-main font-medium transition-all duration-200 ease-out hover:border-border focus:outline-none focus:bg-bg-surface focus:border-primary focus:border-[1.5px] focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] cursor-pointer focus:cursor-text"
            placeholder="현장명을 입력하세요."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onClick={handleSearchInteraction}
            onFocus={handleSearchInteraction}
          />
          {search ? (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-btn-clear-bg text-btn-clear-text rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
              onClick={() => {
                setSearch('')
                setShowSearchOptions(false)
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <Search
              className="absolute right-[18px] top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none"
              size={20}
            />
          )}

          {showSearchOptions && (
            <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl animate-slideDown">
              {sites.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).length ===
              0 ? (
                <div className="p-4 text-slate-400 text-center">검색 결과 없음</div>
              ) : (
                <>
                  <div
                    className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-body)] text-[16px] text-[var(--text-main)]"
                    onClick={() => handleSearchSelect('')}
                  >
                    전체 현장
                  </div>
                  {sites
                    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                    .map(s => (
                      <div
                        key={s.id}
                        className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-body)] text-[16px] text-[var(--text-main)]"
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

        <div className="overflow-hidden relative">
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1 items-center scrollbar-hide">
            {(['all', 'ing', 'wait', 'done'] as FilterStatus[]).map(status => {
              const label = { all: '전체', ing: '진행중', wait: '예정', done: '완료' }[status]
              const active = filterStatus === status

              let activeClass = ''
              if (active) {
                if (status === 'all')
                  activeClass =
                    'border-[var(--primary)] text-[var(--primary)] shadow-[0_2px_8px_rgba(49,163,250,0.15)] bg-[var(--bg-surface)] font-extrabold'
                if (status === 'ing')
                  activeClass =
                    'border-[var(--st-ing-border)] text-[var(--st-ing-text)] shadow-[0_2px_8px_rgba(59,130,246,0.15)] bg-[var(--bg-surface)] font-extrabold'
                if (status === 'wait')
                  activeClass =
                    'border-[var(--st-wait-border)] text-[var(--st-wait-text)] shadow-[0_2px_8px_rgba(139,92,246,0.15)] bg-[var(--bg-surface)] font-extrabold'
                if (status === 'done')
                  activeClass =
                    'border-[var(--st-done-border)] text-[var(--st-done-text)] shadow-[0_2px_8px_rgba(100,116,139,0.15)] bg-[var(--bg-surface)] font-extrabold'
              } else {
                activeClass =
                  'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-sub)] font-semibold'
              }

              return (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status)
                    setVisibleCount(5)
                  }}
                  className={`flex-1 h-10 px-1 rounded-full border-[1.5px] text-[15px] whitespace-nowrap shadow-sm min-w-0 transition-all ${activeClass}`}
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

      <div className="flex flex-col pb-24">
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

        {filteredSites.length > 5 && (
          <button
            className="w-full h-[50px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-[var(--text-sub)] font-semibold text-[15px] flex items-center justify-center gap-1.5 mt-2.5 active:scale-95 transition-transform"
            onClick={() => {
              if (visibleCount >= filteredSites.length) {
                setVisibleCount(5)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                setVisibleCount(prev => Math.min(prev + 5, filteredSites.length))
              }
            }}
          >
            {visibleCount >= filteredSites.length ? (
              <>
                <span className="text-[var(--text-main)]">접기</span>{' '}
                <ChevronUp size={16} className="text-[var(--text-main)]" />
              </>
            ) : (
              <>
                <span className="text-[var(--text-main)]">더 보기</span>{' '}
                <ChevronDown size={16} className="text-[var(--text-main)]" />
              </>
            )}
          </button>
        )}
      </div>

      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity ${sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] rounded-t-3xl p-6 z-[2100] transition-transform duration-300 max-w-[600px] mx-auto ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="text-center font-bold text-[18px] mb-5 text-[var(--text-main)]">
          도면 선택
        </div>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-[var(--act-draw-bg)] text-[var(--act-draw-text)] border-[var(--act-draw-border)]"
          onClick={() => {
            setSheetOpen(false)
            openViewer(selectedSiteId!, 'draw-sample')
          }}
        >
          <Map size={20} /> 공사 도면 (조회)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)]"
          onClick={() => {
            setSheetOpen(false)
            setFmOpen(true)
            setFmType('progress')
          }}
        >
          <UploadCloud size={20} /> 진행 도면 (관리)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mb-2.5 font-semibold flex items-center justify-center gap-2 border bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)]"
          onClick={() => {
            setSheetOpen(false)
            openViewer(selectedSiteId!, 'draw-sample')
          }}
        >
          <CheckCircle2 size={20} /> 완료 도면 (확인)
        </button>
        <button
          className="w-full h-[54px] rounded-xl mt-2.5 font-semibold bg-[var(--header-navy)] text-white border-none"
          onClick={() => setSheetOpen(false)}
        >
          닫기
        </button>
      </div>

      <div
        className={`fixed inset-0 bg-[#121212] z-[2200] flex flex-col transition-transform duration-300 ${fmOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-14 px-4 border-b border-[#333] flex justify-between items-center font-extrabold text-[17px] bg-black text-white">
          <span>진행 도면 (관리)</span>
          <button onClick={() => setFmOpen(false)}>
            <X className="text-white" />
          </button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="text-center py-16 text-[#aaa]">파일이 없습니다.</div>
        </div>
        <div className="p-4 border-t border-[#333] flex gap-2.5 bg-[#0b0f19]">
          <button className="flex-1 h-[50px] rounded-xl font-bold bg-[#31a3fa] text-white border-none">
            파일 추가
          </button>
          <button
            className="flex-1 h-[50px] rounded-xl font-bold bg-[#111827] text-gray-200 border border-gray-600"
            onClick={() => setFmOpen(false)}
          >
            닫기
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-[#1e1e1e] z-[9999] flex flex-col ${viewerOpen ? 'flex' : 'hidden'}`}
      >
        <div className="bg-black h-14 flex items-center justify-between px-4 shrink-0 z-10">
          <button onClick={() => setViewerOpen(false)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <span className="text-white font-bold">{viewerTitle}</span>
          <button onClick={() => alert('Download')} className="text-white">
            <Download size={24} />
          </button>
        </div>
        <div className="flex-1 bg-[#333] overflow-hidden relative flex justify-center items-center">
          <div
            dangerouslySetInnerHTML={{ __html: viewerContent }}
            className="bg-transparent"
            style={{ transform: 'scale(0.8)' }}
          />
        </div>
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-8 py-2.5 rounded-full flex gap-8 z-[10000] border border-white/20">
          <button className="text-white/70 flex flex-col items-center text-[11px] gap-1">
            <Minus size={20} />
            축소
          </button>
          <button className="text-white/70 flex flex-col items-center text-[11px] gap-1">
            <Hand size={20} />
            이동
          </button>
          <button className="text-white/70 flex flex-col items-center text-[11px] gap-1">
            <PlusIcon size={20} />
            확대
          </button>
          <button className="text-white/70 flex flex-col items-center text-[11px] gap-1">
            <Share2 size={20} />
            공유
          </button>
        </div>
      </div>

      {addModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1500]"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] bg-[var(--bg-surface)] rounded-2xl z-[2100] p-6 shadow-2xl">
            <div className="text-[18px] font-extrabold mb-5 text-[var(--header-navy)]">
              새 현장 등록
            </div>
            <input
              type="text"
              id="newSiteName"
              className="w-full h-[50px] px-4 border border-[var(--border)] rounded-xl text-[16px] bg-[var(--bg-input)] font-medium mb-5 text-[var(--text-main)]"
              placeholder="현장명을 입력하세요"
            />
            <div className="flex gap-2.5">
              <button
                className="flex-1 h-12 rounded-xl text-[16px] font-bold bg-[var(--bg-body)] text-[var(--text-sub)] border border-[var(--border)]"
                onClick={() => setAddModalOpen(false)}
              >
                취소
              </button>
              <button
                className="flex-1 h-12 rounded-xl text-[16px] font-bold bg-[var(--header-navy)] text-white"
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
