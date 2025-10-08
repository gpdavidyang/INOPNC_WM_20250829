import React from 'react'
import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import RequiredManagerClient from '@/components/admin/required/RequiredManagerClient'

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
    <div className="px-0 pb-8">
      <PageHeader
        title="필수서류 관리"
        description="제출현황과 유형 설정을 한 화면에서 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리', href: '/dashboard/admin/documents' }, { label: '필수서류 관리' }]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <RequiredManagerClient initialDocs={docs} types={types} defaultTab={defaultTab as any} />
      </div>
    </div>
  )
}
