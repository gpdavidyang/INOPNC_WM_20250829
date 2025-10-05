import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import NewSiteClient from '@/components/admin/sites/NewSiteClient'

export const metadata: Metadata = { title: '새 현장 등록' }

export default async function NewSitePage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">새 현장 등록</h1>
        <p className="text-sm text-muted-foreground">
          현장 정보를 입력해 새로운 현장을 생성합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <NewSiteClient />
      </div>
    </div>
  )
}
