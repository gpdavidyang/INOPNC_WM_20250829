import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = {
  title: '필수 문서 유형 상세',
}

export default async function RequiredDocTypeDetailPage({ params }: { params: { id: string } }) {
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
      description,
      file_types,
      max_file_size,
      is_active,
      sort_order,
      role_mappings:required_documents_by_role(
        role_type,
        is_required
      ),
      site_customizations:site_required_documents(
        site_id,
        is_required,
        due_days,
        notes,
        sites(name)
      )
    `
    )
    .eq('id', params.id)
    .maybeSingle()

  const docType = data || null

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="필수 문서 유형 상세"
        description="역할별/현장별 요구사항 확인"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '필수 문서 유형', href: '/dashboard/admin/document-requirements' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/document-requirements"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{docType?.name_ko || docType?.name_en || '-'}</CardTitle>
            <CardDescription>{docType?.code}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div>허용 확장자: {(docType?.file_types || []).join(', ') || '-'}</div>
            <div>
              최대 크기:{' '}
              {docType?.max_file_size
                ? `${Math.round(docType.max_file_size / (1024 * 1024))} MB`
                : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>역할별 요구사항</CardTitle>
            <CardDescription>role → required 매핑</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<any>
              data={docType?.role_mappings || []}
              rowKey={(m: any, idx?: number) => `${m.role_type}-${idx ?? 0}`}
              stickyHeader
              emptyMessage="설정된 역할 매핑이 없습니다."
              columns={
                [
                  {
                    key: 'role_type',
                    header: '역할',
                    sortable: true,
                    render: (m: any) => m?.role_type || '-',
                  },
                  {
                    key: 'is_required',
                    header: '필수 여부',
                    sortable: true,
                    render: (m: any) => (m?.is_required ? '필수' : '선택'),
                  },
                ] as Column<any>[]
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>현장별 커스터마이징</CardTitle>
            <CardDescription>site → required/due_days/notes</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<any>
              data={docType?.site_customizations || []}
              rowKey={(s: any, idx?: number) => `${s.site_id}-${idx ?? 0}`}
              stickyHeader
              emptyMessage="설정된 현장 매핑이 없습니다."
              columns={
                [
                  {
                    key: 'site',
                    header: '현장',
                    sortable: true,
                    render: (s: any) => s?.sites?.name || s?.site_id,
                  },
                  {
                    key: 'is_required',
                    header: '필수 여부',
                    sortable: true,
                    render: (s: any) => (s?.is_required ? '필수' : '선택'),
                  },
                  {
                    key: 'due_days',
                    header: '마감일(일)',
                    sortable: true,
                    align: 'right',
                    render: (s: any) => s?.due_days ?? '-',
                  },
                  {
                    key: 'notes',
                    header: '메모',
                    sortable: false,
                    render: (s: any) => (
                      <span className="truncate inline-block max-w-[360px]" title={s?.notes || ''}>
                        {s?.notes || '-'}
                      </span>
                    ),
                  },
                ] as Column<any>[]
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
