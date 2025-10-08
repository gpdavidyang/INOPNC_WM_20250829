import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import TabbedDocumentsClient from '@/components/admin/documents/TabbedDocumentsClient'

export const metadata: Metadata = {
  title: '문서 관리(탭형)',
}

export default async function AdminDocumentsPage() {
  await requireAdminProfile()
  const supabase = createClient()

  const [counts] = await Promise.all([
    (async () => {
      const [sharedCount, markupCount, requiredCount, invoiceCount, photoGridCount] =
        await Promise.all([
          supabase
            .from('unified_document_system')
            .select('id', { count: 'exact', head: true })
            .eq('category_type', 'shared')
            .eq('is_archived', false),
          supabase.from('markup_documents').select('id', { count: 'exact', head: true }),
          supabase
            .from('unified_document_system')
            .select('id', { count: 'exact', head: true })
            .in('category_type', ['required', 'required_user_docs'])
            .eq('is_archived', false),
          supabase
            .from('unified_document_system')
            .select('id', { count: 'exact', head: true })
            .eq('category_type', 'invoice')
            .eq('is_archived', false),
          supabase.from('photo_grid_reports').select('id', { count: 'exact', head: true }),
        ])
      // Status breakdowns (approved/pending/rejected) where applicable
      const [sharedApproved, sharedPending, sharedRejected] = await Promise.all([
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'shared')
          .eq('is_archived', false)
          .eq('status', 'approved'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'shared')
          .eq('is_archived', false)
          .eq('status', 'pending'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'shared')
          .eq('is_archived', false)
          .eq('status', 'rejected'),
      ])
      const [reqApproved, reqPending, reqRejected] = await Promise.all([
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .in('category_type', ['required', 'required_user_docs'])
          .eq('is_archived', false)
          .eq('status', 'approved'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .in('category_type', ['required', 'required_user_docs'])
          .eq('is_archived', false)
          .eq('status', 'pending'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .in('category_type', ['required', 'required_user_docs'])
          .eq('is_archived', false)
          .eq('status', 'rejected'),
      ])
      const [invApproved, invPending, invRejected] = await Promise.all([
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'invoice')
          .eq('is_archived', false)
          .eq('status', 'approved'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'invoice')
          .eq('is_archived', false)
          .eq('status', 'pending'),
        supabase
          .from('unified_document_system')
          .select('id', { count: 'exact', head: true })
          .eq('category_type', 'invoice')
          .eq('is_archived', false)
          .eq('status', 'rejected'),
      ])
      const [markupApproved, markupPending, markupRejected] = await Promise.all([
        supabase
          .from('markup_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('markup_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('markup_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected'),
      ])
      return {
        shared: sharedCount.count || 0,
        markup: markupCount.count || 0,
        required: requiredCount.count || 0,
        invoice: invoiceCount.count || 0,
        photoGrid: photoGridCount.count || 0,
        total:
          (sharedCount.count || 0) +
          (markupCount.count || 0) +
          (requiredCount.count || 0) +
          (invoiceCount.count || 0) +
          (photoGridCount.count || 0),
        status: {
          shared: {
            approved: sharedApproved.count || 0,
            pending: sharedPending.count || 0,
            rejected: sharedRejected.count || 0,
          },
          required: {
            approved: reqApproved.count || 0,
            pending: reqPending.count || 0,
            rejected: reqRejected.count || 0,
          },
          invoice: {
            approved: invApproved.count || 0,
            pending: invPending.count || 0,
            rejected: invRejected.count || 0,
          },
          markup: {
            approved: markupApproved.count || 0,
            pending: markupPending.count || 0,
            rejected: markupRejected.count || 0,
          },
        },
      }
    })(),
  ])

  const stats = counts as {
    total: number
    shared: number
    markup: number
    required: number
    invoice: number
    photoGrid: number
    status: Record<string, { approved: number; pending: number; rejected: number }>
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="문서 관리"
        description="탭별로 문서함을 살펴보고 상세 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>전체</CardTitle>
            <CardDescription>모든 문서</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>회사서류함</CardTitle>
            <CardDescription>shared</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.shared}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border px-1.5 py-0.5">
                승인 {stats.status.shared?.approved ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                대기 {stats.status.shared?.pending ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                반려 {stats.status.shared?.rejected ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>도면마킹</CardTitle>
            <CardDescription>markup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.markup}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border px-1.5 py-0.5">
                승인 {stats.status.markup?.approved ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                대기 {stats.status.markup?.pending ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                반려 {stats.status.markup?.rejected ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>필수서류</CardTitle>
            <CardDescription>required</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.required}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border px-1.5 py-0.5">
                승인 {stats.status.required?.approved ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                대기 {stats.status.required?.pending ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                반려 {stats.status.required?.rejected ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>기성청구 관리</CardTitle>
            <CardDescription>invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.invoice}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border px-1.5 py-0.5">
                승인 {stats.status.invoice?.approved ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                대기 {stats.status.invoice?.pending ?? 0}
              </span>
              <span className="rounded border px-1.5 py-0.5">
                반려 {stats.status.invoice?.rejected ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>사진대지</CardTitle>
            <CardDescription>photo_grid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.photoGrid}</div>
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent>
            <EmptyState description="표시할 문서가 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <TabbedDocumentsClient defaultTab="shared" />
      )}
      </div>
    </div>
  )
}
