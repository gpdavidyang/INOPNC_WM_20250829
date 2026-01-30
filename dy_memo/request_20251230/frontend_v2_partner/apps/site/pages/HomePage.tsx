import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, MapPin, FileText, DollarSign } from 'lucide-react'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()

  const quickMenuItems = [
    {
      id: 1,
      icon: ClipboardList,
      label: '작업일지',
      path: '/worklog',
      color: 'bg-[#f0fdf4]',
      textColor: 'text-[#166534]',
      borderColor: 'border-[#bbf7d0]',
    },
    {
      id: 2,
      icon: MapPin,
      label: '현장정보',
      path: '/site',
      color: 'bg-[#eff6ff]',
      textColor: 'text-[#2563eb]',
      borderColor: 'border-[#dbeafe]',
    },
    {
      id: 3,
      icon: DollarSign,
      label: '정산관리',
      path: '/money',
      color: 'bg-[#fef3c7]',
      textColor: 'text-[#92400e]',
      borderColor: 'border-[#fde68a]',
    },
  ]

  return (
    <div className="p-5">
      <h1 className="text-[28px] font-[800] text-[var(--text-main)] mb-6">메인 대시보드</h1>

      <div className="grid grid-cols-2 gap-4">
        {quickMenuItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`${item.color} ${item.borderColor} border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.05)]`}
            >
              <Icon size={40} className={item.textColor} strokeWidth={2.5} />
              <span className={`text-[17px] font-bold ${item.textColor}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
