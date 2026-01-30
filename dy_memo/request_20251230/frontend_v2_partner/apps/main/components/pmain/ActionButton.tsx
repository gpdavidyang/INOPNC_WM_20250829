import React from 'react'
import { Map, Camera, FileText, ClipboardList, CheckCircle2 } from 'lucide-react'

interface ActionButtonProps {
  hasData: boolean
  type: 'draw' | 'photo' | 'ptw' | 'log' | 'action'
  label: string
  onClick: (e: React.MouseEvent) => void
}

export const ActionButton: React.FC<ActionButtonProps> = ({ hasData, type, label, onClick }) => {
  let colorClass = ''
  let Icon = Map

  // Set icon based on type
  switch (type) {
    case 'draw':
      Icon = Map
      break
    case 'photo':
      Icon = Camera
      break
    case 'ptw':
      Icon = FileText
      break
    case 'log':
      Icon = ClipboardList
      break
    case 'action':
      Icon = CheckCircle2
      break
  }

  // Set color class based on data and type
  if (!hasData) {
    colorClass = 'bg-[var(--badge-gray-bg)] text-[var(--text-placeholder)] cursor-pointer'
  } else {
    switch (type) {
      case 'draw':
        colorClass =
          'bg-[var(--act-draw-bg)] border border-[var(--act-draw-border)] text-[var(--act-draw-text)] active:scale-95 cursor-pointer'
        break
      case 'photo':
        colorClass =
          'bg-[var(--st-wait-bg)] border border-[var(--st-wait-border)] text-[var(--st-wait-text)] active:scale-95 cursor-pointer'
        break
      case 'ptw':
        colorClass =
          'bg-[var(--act-ptw-bg)] border border-[var(--act-ptw-border)] text-[var(--act-ptw-text)] active:scale-95 cursor-pointer'
        break
      case 'log':
        colorClass =
          'bg-[var(--act-log-bg)] border border-[var(--act-log-border)] text-[var(--act-log-text)] active:scale-95 cursor-pointer'
        break
      case 'action':
        colorClass =
          'bg-[var(--del-btn-bg)] border border-[var(--danger)]/30 text-[var(--danger)] active:scale-95 cursor-pointer'
        break
      default:
        colorClass =
          'bg-[var(--badge-gray-bg)] text-[var(--text-placeholder)] active:scale-95 cursor-pointer'
    }
  }

  return (
    <button
      className={`flex flex-col items-center justify-center gap-1.5 h-[74px] rounded-xl transition-all duration-200 outline-none border-none ${colorClass}`}
      onClick={onClick}
    >
      <Icon size={24} className={hasData ? '' : 'text-[var(--text-placeholder)]'} />
      <span
        className={`text-[14px] font-bold tracking-tighter ${hasData ? '' : 'text-[var(--text-placeholder)]'}`}
      >
        {label}
      </span>
    </button>
  )
}
