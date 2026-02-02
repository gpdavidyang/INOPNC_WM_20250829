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
    <Card className="flex flex-col border shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
        <CardTitle className="text-base font-bold text-[#1A254F]">작업 인력 정보</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="overflow-x-auto px-5 pb-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-3 font-semibold">작업자</th>
                <th className="py-3 font-semibold text-right">공수</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(worker => (
                <tr
                  key={worker.id}
                  className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 text-foreground font-medium">
                    {worker.workerName || worker.workerId || '이름없음'}
                  </td>
                  <td className="py-3 text-right tabular-nums font-semibold text-blue-600">
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
