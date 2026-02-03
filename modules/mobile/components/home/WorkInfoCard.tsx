'use client'

import { Card } from '@/components/ui/card'
import { Calendar, Info, User2 } from 'lucide-react'

interface WorkInfoCardProps {
  workDate: string
  onDateChange: (date: string) => void
  userProfile: any
}

export function WorkInfoCard({ workDate, onDateChange, userProfile }: WorkInfoCardProps) {
  return (
    <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">작성 정보</h3>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
            Entry Details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
            Work Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={workDate}
              onChange={e => onDateChange(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 pr-12 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-bold appearance-none"
            />
            <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
            Author
          </label>
          <div className="relative">
            <input
              type="text"
              value={userProfile?.full_name || '로그인 필요'}
              readOnly
              className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/10 px-5 pr-12 text-base font-bold text-muted-foreground/50 cursor-not-allowed"
            />
            <User2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 pointer-events-none" />
          </div>
        </div>
      </div>
    </Card>
  )
}
