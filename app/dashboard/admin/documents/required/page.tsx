import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import RequiredManagerClient from '@/components/admin/required/RequiredManagerClient'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '필수서류 관리',
}

export default async function AdminRequiredDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const defaultTab = (typeof searchParams?.tab === 'string' ? searchParams?.tab : '') === 'settings' ? 'settings' : 'submissions'

  // 제출현황 데이터(SSR)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/documents/required`,
    { cache: 'no-store' }
  ).catch(() => null)
  const json = await res?.json().catch(() => null)
  const docs: any[] = Array.isArray(json?.documents) ? json.documents : []

  // 설정(유형) 데이터(SSR)
  const { data: typesData } = await supabase
    .from('required_document_types')
    .select(
      `
      id,
      code,
      name_ko,
      name_en,
      description,
      instructions,
      file_types,
      max_file_size,
      is_active,
      sort_order,
      created_at
    `
    )
    .order('sort_order', { ascending: true })
  const types = Array.isArray(typesData) ? typesData : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="필수서류 관리"
        description="근로자 필수 제출 서류의 현황 파악 및 유형을 설정합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '필수서류 관리' }
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <RequiredManagerClient initialDocs={docs} types={types} defaultTab={defaultTab as any} />
        </CardContent>
      </Card>
    </div>
  )
}
