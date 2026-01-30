import React, { useState, useMemo, useEffect } from 'react'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { SummaryCard } from './components/SummaryCard'
import { WorkerCard } from './components/WorkerCard'
import { WORKER_DATA } from './constants'
import { WorkerAction, ToastState } from './types'

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' })

  // 더보기/접기 상태 관리 (기본 5개 노출)
  const INITIAL_VISIBLE_COUNT = 5
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  // 필터나 검색어 변경 시 노출 개수 초기화
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [searchTerm, siteFilter])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 2000)
  }

  const handleAction = (action: WorkerAction, workerName: string) => {
    switch (action) {
      case 'log':
        alert('일지 상세 보기')
        break
      case 'approve':
        showToast('일지가 승인되었습니다.')
        break
      case 'call':
        window.location.href = 'tel:01012345678'
        break
      case 'defect':
        alert('하자 관리 이동')
        break
      case 'drawing':
        alert('도면 조회 이동')
        break
    }
  }

  const filteredWorkers = useMemo(() => {
    const lowerQuery = searchTerm.toLowerCase()
    return WORKER_DATA.filter(worker => {
      const matchesSearch =
        worker.name.toLowerCase().includes(lowerQuery) ||
        worker.site.toLowerCase().includes(lowerQuery)

      const matchesSite =
        siteFilter === 'all' ||
        worker.site.includes(siteFilter.replace('자이', '자이').replace('삼성', '삼성'))
      // Simple includes logic based on HTML value='자이', value='삼성'

      return matchesSearch && matchesSite
    })
  }, [searchTerm, siteFilter])

  const displayedWorkers = filteredWorkers.slice(0, visibleCount)

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-5 box-border font-sans text-text-main">
      {/* 2. 요약 카드 섹션 */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <SummaryCard value="5개" label="투입현장" type="navy" />
        <SummaryCard value="12명" label="오늘투입" type="sky" />
        <SummaryCard value="4건" label="미승인일지" type="red" />
      </div>

      {/* 3. 검색창 인터랙션 */}
      <div className="relative mb-3 mt-1 flex items-center">
        <input
          type="text"
          className="w-full h-14 rounded-2xl bg-white border border-transparent pl-[22px] pr-12 text-[17px] font-semibold text-slate-900 shadow-soft focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
          placeholder="작업자 또는 현장명 검색"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div
          className={`absolute right-[18px] top-1/2 -translate-y-1/2 text-gray-400 transition-opacity duration-200 pointer-events-none ${searchTerm ? 'opacity-0' : 'opacity-100'}`}
        >
          <Search size={20} />
        </div>
        <button
          className={`absolute right-[14px] top-1/2 -translate-y-1/2 bg-[#cbd5e1] text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer transition-opacity duration-200 z-10 ${searchTerm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={clearSearch}
        >
          <X size={14} />
        </button>
      </div>

      {/* 4. 필터 셀렉트 */}
      <div className="flex gap-3 mb-6">
        <div className="relative w-full">
          <select
            className="w-full h-[54px] bg-white border border-border rounded-xl pl-[18px] pr-10 text-[17px] font-bold text-[#111] appearance-none shadow-soft focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none transition-all cursor-pointer"
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
          >
            <option value="all">전체 현장</option>
            <option value="자이">자이 아파트</option>
            <option value="삼성">삼성 반도체</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div className="relative w-full">
          <select className="w-full h-[54px] bg-white border border-border rounded-xl pl-[18px] pr-10 text-[17px] font-bold text-[#111] appearance-none shadow-soft focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none transition-all cursor-pointer">
            <option>최신순</option>
            <option>이름순</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* 5. 작업자 카드 섹션 */}
      <div id="workerList">
        {displayedWorkers.map(worker => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            isExpanded={expandedCards.has(worker.id)}
            onToggle={() => toggleCard(worker.id)}
            onAction={handleAction}
          />
        ))}
        {filteredWorkers.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-bold">검색 결과가 없습니다.</div>
        )}
      </div>

      {/* 6. 더보기 / 접기 버튼 */}
      {filteredWorkers.length > INITIAL_VISIBLE_COUNT && (
        <button
          onClick={() => {
            if (visibleCount < filteredWorkers.length) {
              setVisibleCount(prev => prev + 5)
            } else {
              setVisibleCount(INITIAL_VISIBLE_COUNT)
            }
          }}
          className="w-full h-11 mt-6 bg-white border border-border rounded-full flex items-center justify-center text-[15px] font-bold text-text-sub shadow-soft active:scale-[0.96] transition-all gap-1.5 hover:bg-gray-50"
        >
          {visibleCount < filteredWorkers.length ? (
            <>
              더보기 <ChevronDown size={18} />
            </>
          ) : (
            <>
              접기 <ChevronUp size={18} />
            </>
          )}
        </button>
      )}

      {/* 토스트 알림 */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/85 text-white px-7 py-3.5 rounded-[30px] text-base font-semibold transition-all duration-300 z-[10000] pointer-events-none whitespace-nowrap ${toast.show ? 'opacity-100 -translate-y-2.5' : 'opacity-0'}`}
      >
        {toast.message}
      </div>
    </div>
  )
}

export default App
