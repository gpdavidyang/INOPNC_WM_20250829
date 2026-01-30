import React from 'react'
import { ChevronDown, MessageSquare, Building2, Calendar } from 'lucide-react'
import { AnyItem, RequestData, ProductionData, ShippingData } from '../types'

interface InfoCardProps {
  item: AnyItem
  isExpanded: boolean
  onToggle: () => void
  isHighlighted?: boolean // 하이라이트 여부 prop 추가
  onEdit: () => void
  onDelete: () => void
}

export const InfoCard: React.FC<InfoCardProps> = ({
  item,
  isExpanded,
  onToggle,
  isHighlighted,
  onEdit,
  onDelete,
}) => {
  // 1. 주문요청 카드 렌더링
  const renderRequestContent = (data: RequestData) => {
    const priorityColors = {
      low: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: '낮음',
      },
      normal: {
        bg: 'bg-pastel-blue-bg',
        text: 'text-pastel-blue-text',
        border: 'border-pastel-blue-border',
        label: '보통',
      },
      high: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: '높음',
      },
      urgent: {
        bg: 'bg-pastel-red-bg',
        text: 'text-pastel-red-text',
        border: 'border-pastel-red-border',
        label: '긴급',
      },
    }
    const pStyle = priorityColors[data.priority]

    return (
      <>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-[19px] font-extrabold text-header-navy flex items-center gap-2">
              {data.site}
            </div>
            <div className="text-[13px] text-text-sub mt-0.5 font-medium flex items-center gap-1.5">
              <Calendar size={12} /> {data.date}
              <span className="w-0.5 h-2.5 bg-gray-300 mx-0.5 inline-block"></span>
              <span className="truncate max-w-[120px]">{data.partner || '거래처 미지정'}</span>
            </div>
          </div>
          {/* 배지 위치: 우측 상단 */}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
          >
            {pStyle.label}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-t border-dashed border-border mt-3">
          <span className="text-[15px] font-bold text-text-sub">주문수량</span>
          <span className="text-[18px] font-extrabold text-primary">
            {data.qty.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-[15px] font-medium text-text-sub">자재명</span>
          <span className="text-[15px] font-bold text-text-main">{data.material}</span>
        </div>

        {data.memo && (
          <div className="mt-3 bg-bg-body px-3 py-2.5 rounded-xl flex gap-2 items-start">
            <MessageSquare size={14} className="mt-0.5 text-text-sub shrink-0" />
            <span className="text-[13px] text-text-sub font-medium leading-snug">{data.memo}</span>
          </div>
        )}
      </>
    )
  }

  // 2. 생산정보 카드 렌더링
  const renderProductionContent = (data: ProductionData) => {
    return (
      <>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-[19px] font-extrabold text-header-navy">{data.date}</div>
            <div className="text-[13px] text-text-sub mt-0.5 font-medium flex items-center gap-1.5">
              <Building2 size={12} /> {data.partner}
            </div>
          </div>
          {/* 수량 표시를 배지 위치와 통일된 레이아웃으로 배치 */}
          <div className="text-right">
            <div className="text-[11px] text-text-sub font-bold mb-0.5">생산수량</div>
            <div className="text-[22px] font-black text-primary leading-none">
              {data.productionQty.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-border mt-3 pt-3 flex justify-between items-center">
          <span className="text-[15px] font-bold text-text-sub">주자재</span>
          <span className="text-[15px] font-bold text-text-main">{data.material}</span>
        </div>

        {data.additionalMaterial && (
          <div className="mt-3 bg-bg-body px-3 py-2.5 rounded-xl text-[13px] text-text-sub font-medium">
            <span className="font-bold text-text-main mr-1">추가정보:</span>{' '}
            {data.additionalMaterial}
          </div>
        )}
      </>
    )
  }

  // 3. 출고배송 카드 렌더링
  const renderShippingContent = (data: ShippingData) => {
    return (
      <>
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="text-[19px] font-extrabold text-header-navy flex items-center gap-2">
              {data.partner}
            </div>
            <div className="text-[13px] text-text-sub mt-1 font-medium flex items-center gap-1.5">
              {data.site} <span className="text-gray-300">|</span> {data.date}
            </div>
          </div>
          {/* 배지 위치: 우측 상단 (주문요청 카드와 위치 통일) */}
          {data.status === 'done' ? (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pastel-mint-bg text-pastel-mint-text font-bold border border-pastel-mint-border">
              완료
            </span>
          ) : (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pastel-red-bg text-pastel-red-text font-bold border border-pastel-red-border">
              대기
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 mb-2">
          <span className="text-[15px] font-medium text-text-sub">출고 자재</span>
          <span className="text-[15px] font-bold text-text-main">{data.material}</span>
        </div>

        <div className="bg-primary-bg rounded-xl p-3 mb-3 border border-blue-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[14px] font-bold text-text-sub">총 수량</span>
            <span className="text-[18px] font-black text-primary">
              {data.totalQty.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-bold text-text-sub">금액</span>
            <span className="text-[15px] font-bold text-text-main">
              {data.amount.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {data.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-1 rounded-md bg-white border border-border text-text-sub font-bold shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </>
    )
  }

  const renderContent = () => {
    switch (item.type) {
      case 'request':
        return renderRequestContent(item as RequestData)
      case 'production':
        return renderProductionContent(item as ProductionData)
      case 'shipping':
        return renderShippingContent(item as ShippingData)
      default:
        return null
    }
  }

  const renderExpandedActions = () => {
    return (
      <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
        <button
          onClick={onEdit}
          className="h-11 rounded-xl border border-border bg-white text-text-sub font-bold text-[14px] hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          수정하기
        </button>
        <button
          onClick={onDelete}
          className="h-11 rounded-xl border border-pastel-red-border bg-pastel-red-bg text-pastel-red-text font-bold text-[14px] hover:brightness-95 active:scale-[0.98] transition-all"
        >
          삭제하기
        </button>
      </div>
    )
  }

  // 하이라이트 스타일: 배경색 파랑, 테두리 진하게, 크기 약간 확대, ring 효과
  const highlightStyles = isHighlighted
    ? 'bg-blue-50 border-primary ring-2 ring-primary/30 scale-[1.02] z-10'
    : 'bg-bg-surface border-border'

  return (
    <div
      className={`rounded-[20px] shadow-soft mb-4 relative overflow-hidden border transition-all duration-500 ${highlightStyles} ${isExpanded ? 'ring-1 ring-primary border-primary' : ''}`}
    >
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        {renderContent()}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 animate-[fadeIn_0.3s_ease-out]">{renderExpandedActions()}</div>
      )}

      <div
        className="h-10 flex items-center justify-center cursor-pointer gap-1 text-text-sub text-[13px] font-bold bg-[#fafafa]/50 border-t border-border hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <span>{isExpanded ? '접기' : '상세보기'}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  )
}
