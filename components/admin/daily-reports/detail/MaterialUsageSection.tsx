'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnifiedDailyReport } from '@/types/daily-reports'

interface MaterialUsageSectionProps {
  materials: UnifiedDailyReport['materials']
  formatNumber: (value: unknown, fractionDigits?: number) => string
}

export function MaterialUsageSection({ materials, formatNumber }: MaterialUsageSectionProps) {
  if (!materials || materials.length === 0) {
    return (
      <Card className="flex flex-col border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
          <CardTitle className="text-base font-bold text-[#1A254F]">자재 사용 내역</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="text-sm text-muted-foreground p-5">자재 사용 정보가 없습니다.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col border shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
        <CardTitle className="text-base font-bold text-[#1A254F]">자재 사용 내역</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="overflow-x-auto px-5 pb-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-3 font-semibold">자재명</th>
                <th className="py-3 font-semibold">수량</th>
                <th className="py-3 font-semibold">단위</th>
                <th className="py-3 font-semibold">비고</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(material => (
                <tr
                  key={material.id}
                  className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 text-foreground font-medium">
                    {material.materialName || material.materialCode || '자재'}
                  </td>
                  <td className="py-3 tabular-nums">{formatNumber(material.quantity, 2)}</td>
                  <td className="py-3">{material.unit || '-'}</td>
                  <td className="py-3 text-slate-500">{material.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
