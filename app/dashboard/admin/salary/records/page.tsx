import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: '급여 레코드 목록',
}

const SalaryRecordsList = dynamic(() => import('./records-list'), { ssr: false })

export default async function AdminSalaryRecordsPage() {
  await requireAdminProfile()
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
              급여 저장 레코드 (HTML 아카이브)
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              발행 시점의 지급 명세서 원본 HTML 코드 리스트입니다.
              데이터 정합성 확인 및 과거 이력 조회를 위한 백업용 레코드입니다.
            </p>
          </div>
          
          <div className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden">
            <SalaryRecordsList />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
