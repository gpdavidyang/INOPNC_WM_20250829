import React from 'react'

interface SummaryCardProps {
  value: string
  label: string
  type: 'navy' | 'sky' | 'red'
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ value, label, type }) => {
  const getStyle = () => {
    switch (type) {
      case 'navy':
        // Navy text (#1e3a8a) -> Light Blue/Indigo background (#eff6ff)
        return 'bg-[#eff6ff] text-[#1e3a8a] border-[#1e3a8a]'
      case 'sky':
        // Sky text (#0284c7) -> Light Sky background (#f0f9ff)
        return 'bg-[#f0f9ff] text-[#0284c7] border-[#0284c7]'
      case 'red':
        return 'bg-pastel-red-bg text-pastel-red-text border-pastel-red-border'
      default:
        return 'bg-bg-surface'
    }
  }

  return (
    <div
      className={`sum-card px-1 py-4 rounded-2xl text-center flex flex-col gap-1.5 shadow-soft border ${getStyle()}`}
    >
      <span className="text-2xl font-extrabold leading-[1.1] tracking-[-0.5px]">{value}</span>
      <span className="text-sm font-bold opacity-90">{label}</span>
    </div>
  )
}
