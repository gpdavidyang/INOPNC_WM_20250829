import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import DocumentRequirementsTable from '@/components/admin/DocumentRequirementsTable'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '필수 문서 유형',
}

export default async function AdminDocumentRequirementsPage() {
  await requireAdminProfile()
  const supabase = createClient()

  const { data } = await supabase
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

  const types = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 유형</h1>
        <p className="text-sm text-muted-foreground">
          역할/현장 요구사항은 내부 상세 화면에서 관리 예정
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <DocumentRequirementsTable types={types} />
      </div>
    </div>
  )
}
