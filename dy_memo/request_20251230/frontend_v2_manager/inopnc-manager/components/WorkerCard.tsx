import React from 'react'
import { ChevronDown, ClipboardList, CheckCircle, Phone, AlertTriangle, Map } from 'lucide-react'
import { WorkerData, WorkerAction } from '../types'

interface WorkerCardProps {
  worker: WorkerData
  isExpanded: boolean
  onToggle: () => void
  onAction: (action: WorkerAction, workerName: string) => void
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  isExpanded,
  onToggle,
  onAction,
}) => {
  const getStatusBadge = () => {
    if (worker.status === 'pending') {
      return (
        <span className="absolute top-0 right-0 z-10 text-sm font-extrabold px-4 py-1.5 rounded-bl-xl text-white bg-[#f59e0b]">
          일지검토요청
        </span>
      )
    }
    return (
      <span className="absolute top-0 right-0 z-10 text-sm font-extrabold px-4 py-1.5 rounded-bl-xl text-white bg-primary">
        현장작업중
      </span>
    )
  }

  const renderActionButton = (action: WorkerAction) => {
    switch (action) {
      case 'log':
        return (
          <button
            key="log"
            onClick={e => {
              e.stopPropagation()
              onAction('log', worker.name)
            }}
            className="h-14 rounded-xl border-[1.5px] flex items-center justify-center text-base font-extrabold cursor-pointer transition-all bg-pastel-blue-bg text-pastel-blue-text border-pastel-blue-border gap-2 active:scale-95 active:opacity-90"
          >
            <ClipboardList size={20} /> 일지
          </button>
        )
      case 'approve':
        return (
          <button
            key="approve"
            onClick={e => {
              e.stopPropagation()
              onAction('approve', worker.name)
            }}
            className="h-14 rounded-xl border-[1.5px] flex items-center justify-center text-base font-extrabold cursor-pointer transition-all bg-pastel-navy-bg text-pastel-navy-text border-pastel-navy-border gap-2 active:scale-95 active:opacity-90"
          >
            <CheckCircle size={20} /> 승인
          </button>
        )
      case 'call':
        return (
          <button
            key="call"
            onClick={e => {
              e.stopPropagation()
              onAction('call', worker.name)
            }}
            className="h-14 rounded-xl border-[1.5px] flex items-center justify-center text-base font-extrabold cursor-pointer transition-all bg-pastel-mint-bg text-pastel-mint-text border-pastel-mint-border gap-2 active:scale-95 active:opacity-90"
          >
            <Phone size={20} /> 통화
          </button>
        )
      case 'defect':
        return (
          <button
            key="defect"
            onClick={e => {
              e.stopPropagation()
              onAction('defect', worker.name)
            }}
            className="h-14 rounded-xl border-[1.5px] flex items-center justify-center text-base font-extrabold cursor-pointer transition-all bg-pastel-navy-bg text-pastel-navy-text border-pastel-navy-border gap-2 active:scale-95 active:opacity-90"
          >
            <AlertTriangle size={20} /> 하자
          </button>
        )
      case 'drawing':
        return (
          <button
            key="drawing"
            onClick={e => {
              e.stopPropagation()
              onAction('drawing', worker.name)
            }}
            className="h-14 rounded-xl border-[1.5px] flex items-center justify-center text-base font-extrabold cursor-pointer transition-all bg-pastel-blue-bg text-pastel-blue-text border-pastel-blue-border gap-2 active:scale-95 active:opacity-90"
          >
            <Map size={20} /> 도면
          </button>
        )
    }
  }

  return (
    <div
      className={`bg-bg-surface rounded-[20px] shadow-soft mb-4 relative overflow-hidden border border-border ${isExpanded ? 'expanded' : ''}`}
    >
      {getStatusBadge()}

      <div className="p-6 border-b border-border cursor-pointer relative" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <div
            className="w-[58px] h-[58px] rounded-full flex items-center justify-center font-extrabold text-[21px]"
            style={worker.avatarStyle || { backgroundColor: '#eaf6ff', color: '#31a3fa' }}
          >
            {worker.avatarChar}
          </div>
          <div className="flex flex-col">
            <span className="text-[21px] font-extrabold text-header-navy">
              {worker.name} {worker.role}
            </span>
            <span className="text-[16px] text-primary font-bold mt-[2px]">{worker.site}</span>
          </div>
        </div>
      </div>

      <div
        className={`px-6 py-6 bg-bg-surface ${isExpanded ? 'block animate-[slideDown_0.3s_ease-out]' : 'hidden'}`}
      >
        {worker.details.map((detail, idx) => (
          <div
            key={idx}
            className="flex justify-between py-3.5 border-b border-dashed border-border last:border-0"
          >
            <span className="text-lg text-text-sub font-bold">{detail.label}</span>
            <span
              className="text-lg font-extrabold text-text-main"
              style={detail.valueColor ? { color: detail.valueColor } : {}}
            >
              {detail.value}
            </span>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-2.5 mt-6">
          {worker.actions.map(action => renderActionButton(action))}
        </div>
      </div>

      <div
        className="h-12 flex items-center justify-center cursor-pointer gap-1.5 text-text-sub text-[15px] font-bold bg-[#fafafa] border-t border-border"
        onClick={onToggle}
      >
        <span>{isExpanded ? '정보 접기' : '상세 정보 보기'}</span>
        <ChevronDown
          size={22}
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  )
}
