'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, FileSearch } from 'lucide-react'

interface PremiumSummaryCardProps {
  site: string
  workDate: string
  author: string
  memberTypes: string[]
  workContents: string[]
  workTypes: string[]
  personnelCount: number
  location: any
  materials: any[]
  manpower: number
}

export function PremiumSummaryCard({
  site,
  workDate,
  author,
  memberTypes,
  workContents,
  workTypes,
  personnelCount,
  location,
  materials,
  manpower,
}: PremiumSummaryCardProps) {
  const formatArray = (arr: string[]) => {
    const filtered = (arr || []).filter(v => v !== 'other' && !v.startsWith('기타: '))
    const custom = (arr || []).filter(v => v.startsWith('기타: ')).map(v => v.replace('기타: ', ''))
    const all = [...filtered, ...custom]
    return all.length > 0 ? all.join(', ') : '-'
  }

  const locStr =
    [
      location.block ? `${location.block}B` : '',
      location.dong ? `${location.dong}동` : '',
      location.unit ? `${location.unit}층` : '',
    ]
      .filter(Boolean)
      .join(' / ') || '-'

  return (
    <Card className="p-6 rounded-3xl border-none bg-blue-900 text-white shadow-2xl shadow-blue-900/40">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300">
          <FileSearch className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">작성 내용 요약</h3>
          <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Entry Summary</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Project Site
            </span>
            <span className="text-sm font-bold truncate block">{site || '미선택'}</span>
          </div>

          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Work Date
            </span>
            <span className="text-sm font-bold">{workDate || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Author
            </span>
            <span className="text-sm font-bold">{author || '-'}</span>
          </div>

          <div className="col-span-2 h-px bg-white/10" />

          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Member Types
            </span>
            <span className="text-sm font-bold line-clamp-1">{formatArray(memberTypes)}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Processes
            </span>
            <span className="text-sm font-bold line-clamp-1">{formatArray(workContents)}</span>
          </div>

          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Manpower
            </span>
            <span className="text-sm font-bold">
              {manpower.toFixed(1)}일 ({personnelCount}명)
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">
              Location
            </span>
            <span className="text-sm font-bold truncate block">{locStr}</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready to Submit
          </div>
        </div>
      </div>
    </Card>
  )
}
