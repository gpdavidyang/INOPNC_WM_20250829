import React, { useState, useMemo, useEffect } from 'react'
import { Search, X, ChevronDown, ChevronUp, Bell, Menu } from 'lucide-react'
import { SummaryCard } from './components/SummaryCard'
import { InfoCard } from './components/InfoCard'
import { BottomNav } from './components/BottomNav'
import { REQUEST_DATA, PRODUCTION_DATA, SHIPPING_DATA } from './constants'
import { TabType, ToastState, KPIData, RequestData, ProductionData, ShippingData } from './types'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('request')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' })

  // 새로 추가된 아이템의 ID를 추적하여 하이라이트 효과 적용
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)

  // 데이터 상태 관리
  const [requests, setRequests] = useState<RequestData[]>(REQUEST_DATA)
  const [productions, setProductions] = useState<ProductionData[]>(PRODUCTION_DATA)
  const [shippings, setShippings] = useState<ShippingData[]>(SHIPPING_DATA)

  // 더보기/접기 상태 관리
  const INITIAL_VISIBLE_COUNT = 5
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  // 탭이나 검색어 변경 시 노출 개수 및 확장 카드 초기화
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
    setExpandedCards(new Set())
    setSearchTerm('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

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

  // 날짜 포맷 헬퍼 (YYYY. MM. DD.)
  const getTodayString = () => {
    const d = new Date()
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`
  }

  // 새 항목 등록 로직 (하이라이트 효과 추가)
  const handleAddItem = () => {
    const today = getTodayString()
    const newId = Math.random().toString(36).substr(2, 9)

    // 스크롤을 최상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 신규 아이템 ID 설정 (2초 후 해제)
    setNewlyAddedId(newId)
    setTimeout(() => setNewlyAddedId(null), 2000)

    if (activeTab === 'request') {
      const sites = ['성수 지식산업센터', '용산 재개발 지구', '마곡 R&D 센터', '여의도 파크원']
      const materials = ['NPC-1000', 'NPC-3000Q', 'NPC-500']
      const randomSite = sites[Math.floor(Math.random() * sites.length)]
      const randomMaterial = materials[Math.floor(Math.random() * materials.length)]

      const newItem: RequestData = {
        id: newId,
        type: 'request',
        site: randomSite,
        date: today,
        material: randomMaterial,
        qty: Math.floor(Math.random() * 100) + 10,
        priority: 'normal',
        partner: '미지정',
        memo: '신규 등록된 주문 건입니다.',
      }
      setRequests(prev => [newItem, ...prev])
      showToast('새 주문요청이 등록되었습니다.')
    } else if (activeTab === 'production') {
      const partners = ['서울전기공사', '경기배관(주)', '인천자재', '세종물산']
      const randomPartner = partners[Math.floor(Math.random() * partners.length)]

      const newItem: ProductionData = {
        id: newId,
        type: 'production',
        date: today,
        site: '제1공장',
        partner: randomPartner,
        productionQty: Math.floor(Math.random() * 400) + 100,
        material: 'NPC-3000Q',
        additionalMaterial: '일일 생산 보고',
      }
      setProductions(prev => [newItem, ...prev])
      showToast('새 생산정보가 등록되었습니다.')
    } else if (activeTab === 'shipping') {
      const sites = ['부산 LCT', '대전 신세계', '광주 터미널', '대구 동대구역']
      const randomSite = sites[Math.floor(Math.random() * sites.length)]
      const randomQty = Math.floor(Math.random() * 150) + 30

      const newItem: ShippingData = {
        id: newId,
        type: 'shipping',
        date: today,
        site: randomSite,
        partner: '대한건설(주)',
        status: 'waiting',
        material: '통합 자재 세트',
        totalQty: randomQty,
        amount: randomQty * 50000,
        tags: ['신규', '화물'],
      }
      setShippings(prev => [newItem, ...prev])
      showToast('새 출고배송 건이 등록되었습니다.')
    }
  }

  // 삭제 기능
  const handleDeleteItem = (id: string, type: string) => {
    if (!window.confirm('선택한 항목을 삭제하시겠습니까?')) return

    if (type === 'request') {
      setRequests(prev => prev.filter(item => item.id !== id))
    } else if (type === 'production') {
      setProductions(prev => prev.filter(item => item.id !== id))
    } else if (type === 'shipping') {
      setShippings(prev => prev.filter(item => item.id !== id))
    }
    showToast('항목이 삭제되었습니다.')
  }

  // 수정 기능 (간단히 수량 수정)
  const handleEditItem = (id: string, type: string) => {
    if (type === 'request') {
      const target = requests.find(item => item.id === id)
      if (!target) return
      const newQty = window.prompt('수정할 주문 수량을 입력하세요:', String(target.qty))
      if (newQty === null) return
      const parsed = parseInt(newQty, 10)
      if (isNaN(parsed) || parsed < 0) {
        showToast('유효한 숫자를 입력해주세요.')
        return
      }
      setRequests(prev => prev.map(item => (item.id === id ? { ...item, qty: parsed } : item)))
      showToast('주문 수량이 수정되었습니다.')
    } else if (type === 'production') {
      const target = productions.find(item => item.id === id)
      if (!target) return
      const newQty = window.prompt('수정할 생산 수량을 입력하세요:', String(target.productionQty))
      if (newQty === null) return
      const parsed = parseInt(newQty, 10)
      if (isNaN(parsed) || parsed < 0) {
        showToast('유효한 숫자를 입력해주세요.')
        return
      }
      setProductions(prev =>
        prev.map(item => (item.id === id ? { ...item, productionQty: parsed } : item))
      )
      showToast('생산 수량이 수정되었습니다.')
    } else if (type === 'shipping') {
      const target = shippings.find(item => item.id === id)
      if (!target) return
      const newQty = window.prompt('수정할 총 수량을 입력하세요:', String(target.totalQty))
      if (newQty === null) return
      const parsed = parseInt(newQty, 10)
      if (isNaN(parsed) || parsed < 0) {
        showToast('유효한 숫자를 입력해주세요.')
        return
      }
      // 수량 변경 시 금액도 대략적으로 조정 (단가 고정 가정, 혹은 단순히 수량만 업데이트)
      setShippings(prev =>
        prev.map(item => (item.id === id ? { ...item, totalQty: parsed } : item))
      )
      showToast('출고 수량이 수정되었습니다.')
    }
  }

  // 현재 탭에 따른 데이터 및 KPI 가져오기
  const { currentData, kpis } = useMemo(() => {
    const lowerQuery = searchTerm.toLowerCase()
    let data
    let kpiList: KPIData[] = []

    switch (activeTab) {
      case 'request':
        data = requests.filter(
          item =>
            item.site.toLowerCase().includes(lowerQuery) ||
            item.material.toLowerCase().includes(lowerQuery)
        )
        kpiList = [
          { label: '주문 건수', value: `${requests.length}건`, color: 'navy' },
          { label: '주문 현장', value: '5곳', color: 'sky' },
          {
            label: '총 수량',
            value: requests.reduce((acc, cur) => acc + cur.qty, 0).toLocaleString(),
            color: 'red',
          },
        ]
        break
      case 'production':
        data = productions.filter(
          item =>
            item.site.toLowerCase().includes(lowerQuery) ||
            item.material.toLowerCase().includes(lowerQuery)
        )
        kpiList = [
          {
            label: '생산량',
            value: productions.reduce((acc, cur) => acc + cur.productionQty, 0).toLocaleString(),
            color: 'navy',
          },
          { label: '출고량', value: '600', color: 'sky' },
          { label: '순증량', value: '+250', color: 'red' },
        ]
        break
      case 'shipping':
        data = shippings.filter(
          item =>
            item.site.toLowerCase().includes(lowerQuery) ||
            item.partner.toLowerCase().includes(lowerQuery)
        )
        kpiList = [
          {
            label: '출고 건수',
            value: `${shippings.filter(i => i.status === 'done').length} / ${shippings.length}`,
            color: 'navy',
          },
          {
            label: '출고 수량',
            value: shippings.reduce((acc, cur) => acc + cur.totalQty, 0).toLocaleString(),
            color: 'sky',
          },
          { label: '출고 금액', value: '240만', color: 'red' },
        ]
        break
      default:
        data = []
    }
    return { currentData: data, kpis: kpiList }
  }, [activeTab, searchTerm, requests, productions, shippings])

  const displayedData = currentData.slice(0, visibleCount)

  return (
    <div className="pb-24 bg-bg-body min-h-screen">
      {/* 1. 헤더 */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-header-navy text-white flex items-center justify-between px-5 z-50 shadow-md">
        <div className="text-[19px] font-bold tracking-tight">INOPNC 주문생산관리</div>
        <div className="flex gap-1">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bell size={22} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* 2. 상단 탭 (모바일 스타일) */}
      <div className="fixed top-[60px] left-0 right-0 bg-white border-b border-border flex h-[54px] z-40">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex-1 font-bold text-[15px] relative transition-colors ${activeTab === 'request' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`}
        >
          주문요청
          {activeTab === 'request' && (
            <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-primary rounded-t-md" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`flex-1 font-bold text-[15px] relative transition-colors ${activeTab === 'production' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`}
        >
          생산정보
          {activeTab === 'production' && (
            <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-primary rounded-t-md" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex-1 font-bold text-[15px] relative transition-colors ${activeTab === 'shipping' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`}
        >
          출고배송
          {activeTab === 'shipping' && (
            <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-primary rounded-t-md" />
          )}
        </button>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="w-full max-w-[600px] mx-auto px-4 box-border pt-[134px]">
        {/* 3. KPI 요약 카드 섹션 */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 animate-[slideDown_0.3s_ease-out]">
          {kpis.map((kpi, idx) => (
            <SummaryCard key={idx} value={kpi.value} label={kpi.label} type={kpi.color as any} />
          ))}
        </div>

        {/* 4. 검색창 */}
        <div className="relative mb-3 flex items-center">
          <input
            type="text"
            className="w-full h-14 rounded-2xl bg-white border border-transparent pl-[22px] pr-12 text-[17px] font-semibold text-slate-900 shadow-soft focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
            placeholder={
              activeTab === 'request'
                ? '현장명, 자재명 검색'
                : activeTab === 'production'
                  ? '생산일자, 거래처 검색'
                  : '거래처, 상태 검색'
            }
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

        {/* 5. 필터 */}
        <div className="flex gap-3 mb-6">
          <div className="relative w-full">
            <select className="w-full h-[54px] bg-white border border-border rounded-xl pl-[18px] pr-10 text-[16px] font-bold text-[#111] appearance-none shadow-soft focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none transition-all cursor-pointer">
              <option>전체 현장</option>
              <option>자이 아파트</option>
              <option>삼성 반도체</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={20} className="text-text-sub" />
            </div>
          </div>

          <div className="relative w-full">
            <select className="w-full h-[54px] bg-white border border-border rounded-xl pl-[18px] pr-10 text-[16px] font-bold text-[#111] appearance-none shadow-soft focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none transition-all cursor-pointer">
              <option>최신순</option>
              <option>상태순</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={20} className="text-text-sub" />
            </div>
          </div>
        </div>

        {/* 6. 리스트 섹션 */}
        <div className="space-y-4">
          {displayedData.map(item => (
            <InfoCard
              key={item.id}
              item={item}
              isExpanded={expandedCards.has(item.id)}
              onToggle={() => toggleCard(item.id)}
              isHighlighted={item.id === newlyAddedId} // 하이라이트 여부 전달
              onEdit={() => handleEditItem(item.id, item.type)}
              onDelete={() => handleDeleteItem(item.id, item.type)}
            />
          ))}

          {currentData.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Search size={32} />
              </div>
              <span className="font-bold text-lg">검색 결과가 없습니다.</span>
              <span className="text-sm mt-1 opacity-70">다른 검색어를 입력해보세요.</span>
            </div>
          )}
        </div>

        {/* 7. 더보기 버튼 */}
        {currentData.length > INITIAL_VISIBLE_COUNT && (
          <button
            onClick={() => {
              if (visibleCount < currentData.length) {
                setVisibleCount(prev => prev + 5)
              } else {
                setVisibleCount(INITIAL_VISIBLE_COUNT)
              }
            }}
            className="w-full h-12 mt-6 bg-white border border-border rounded-full flex items-center justify-center text-[15px] font-bold text-text-sub shadow-soft active:scale-[0.98] transition-all gap-1.5 hover:bg-gray-50"
          >
            {visibleCount < currentData.length ? (
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
      </div>

      {/* 8. 하단 내비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 9. FAB (플로팅 액션 버튼) - 실제 추가 기능 연결 */}
      <button
        className="fixed bottom-[100px] right-5 w-14 h-14 bg-primary text-white rounded-full shadow-[0_4px_12px_rgba(49,163,250,0.4)] flex items-center justify-center z-50 active:scale-90 transition-transform hover:brightness-110"
        onClick={handleAddItem}
      >
        <span className="text-3xl font-light mb-1">+</span>
      </button>

      {/* 토스트 메시지 */}
      <div
        className={`fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-header-navy/90 backdrop-blur-sm text-white px-6 py-3 rounded-full text-[15px] font-semibold transition-all duration-300 z-[100] pointer-events-none whitespace-nowrap shadow-lg ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {toast.message}
      </div>
    </div>
  )
}

export default App
