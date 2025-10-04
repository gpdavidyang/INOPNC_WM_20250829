import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import RequiredDocumentsTable from '@/components/admin/RequiredDocumentsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'

export const metadata: Metadata = {
  title: '필수 문서 관리',
}

export default async function AdminRequiredDocumentsPage() {
  await requireAdminProfile()

  // 서버에서 내부 API 호출(권한/RLS 반영)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/documents/required`,
    { cache: 'no-store' }
  ).catch(() => null)
  const json = await res?.json().catch(() => null)
  const docs: any[] = Array.isArray(json?.documents) ? json.documents : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 관리</h1>
        <p className="text-sm text-muted-foreground">역할/현장 요구 문서 제출 현황</p>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form method="GET" className="flex items-center gap-2">
          <Input name="search" placeholder={t('common.search')} />
          <Button type="submit" variant="outline">
            {t('common.search')}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <RequiredDocumentsTable docs={docs} />
      </div>
    </div>
  )
}
