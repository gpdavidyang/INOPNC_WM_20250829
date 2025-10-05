import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = {
  title: '필수 문서 상세',
}

interface DocumentTypePageProps {
  params: {
    documentType: string
  }
}

export default async function RequiredDocumentTypePage({ params }: DocumentTypePageProps) {
  await requireAdminProfile()
  const supabase = createClient()
  const type = decodeURIComponent(params.documentType)

  const { data } = await supabase
    .from('unified_document_system')
    .select(
      'id, title, status, created_at, uploaded_by, profiles:profiles!unified_document_system_uploaded_by_fkey(full_name,email)'
    )
    .in('category_type', ['required', 'required_user_docs'])
    .eq('sub_category', type)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 - {type}</h1>
        <p className="text-sm text-muted-foreground">유형별 제출 문서 목록</p>
      </div>

      <DataTable<any>
        data={docs}
        rowKey={(d: any) => d.id}
        stickyHeader
        className="p-0"
        columns={([
          {
            key: 'created_at',
            header: '제출일',
            sortable: true,
            render: (d: any) => (d?.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : '-'),
            accessor: (d: any) => d?.created_at || '',
            width: '16%'
          },
          {
            key: 'title',
            header: '문서명',
            sortable: true,
            render: (d: any) => <span className="font-medium text-foreground">{d?.title || '-'}</span>,
            accessor: (d: any) => d?.title || '',
          },
          {
            key: 'uploader',
            header: '제출자',
            sortable: true,
            render: (d: any) => d?.profiles?.full_name || d?.profiles?.email || '-',
            accessor: (d: any) => d?.profiles?.full_name || d?.profiles?.email || '',
            width: '22%'
          },
          {
            key: 'status',
            header: '상태',
            sortable: true,
            render: (d: any) => d?.status || '-',
            accessor: (d: any) => d?.status || '',
            width: '14%'
          },
        ] as Column<any>[])}
        emptyMessage="표시할 문서가 없습니다."
      />
    </div>
  )
}
