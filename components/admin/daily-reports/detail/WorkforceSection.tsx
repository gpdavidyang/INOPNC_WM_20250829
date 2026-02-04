'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnifiedWorkerEntry } from '@/types/daily-reports'

interface WorkforceSectionProps {
  workers: UnifiedWorkerEntry[]
  formatNumber: (value: unknown, fractionDigits?: number) => string
}

export function WorkforceSection({ workers, formatNumber }: WorkforceSectionProps) {
  if (!workers || workers.length === 0) {
    return (
      <Card className="flex flex-col border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
          <CardTitle className="text-base font-bold text-[#1A254F]">작업 인력 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="text-sm text-muted-foreground p-5">작업자 배정 정보가 없습니다.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
        <CardTitle className="text-base font-black text-foreground tracking-tight">
          인력 투입 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="overflow-x-auto px-5 pb-3 pt-1">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30 border-b border-gray-100">
                <th className="py-3 px-1">성명</th>
                <th className="py-3 px-1 text-right">공수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workers.map(worker => (
                <tr key={worker.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="py-3.5 px-1 text-foreground font-bold">
                    {worker.workerName || worker.workerId || '-'}
                  </td>
                  <td className="py-3.5 px-1 text-right tabular-nums font-black italic text-blue-600 text-base">
                    {formatNumber(worker.hours, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
