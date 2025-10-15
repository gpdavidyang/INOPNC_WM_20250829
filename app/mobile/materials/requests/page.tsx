import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'

export const metadata: Metadata = { title: '자재 요청 내역' }

export default async function MobileMaterialRequestsPage() {
  await requireAuth('/mobile')
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  // 역할 제한: 파트너는 접근 불가
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (me?.role === 'partner') redirect('/mobile')

  // 현재 사용자 관련 site_assignments에서 가장 최근 활성 현장 추출
  const { data: assignments } = await supabase
    .from('site_assignments')
    .select('site_id, assigned_date')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('assigned_date', { ascending: false })
    .limit(1)

  const siteId = assignments?.[0]?.site_id || null

  if (!siteId) {
    return (
      <div className="p-5">
        <h1 className="text-lg font-semibold">자재 요청 내역</h1>
        <p className="text-sm text-muted-foreground mt-2">
          배정된 현장이 없어 요청 내역을 표시할 수 없습니다.
        </p>
      </div>
    )
  }

  const { data: requests } = await supabase
    .from('material_requests')
    .select(
      `
      id,
      request_number,
      status,
      created_at,
      needed_by,
      priority,
      requester:profiles!material_requests_requested_by_fkey(full_name),
      items:material_request_items(id)
    `
    )
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">자재 요청 내역</h1>
        <a
          href="/mobile/materials/requests/new"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          새 요청
        </a>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="text-sm text-muted-foreground">요청이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(rq => (
            <div key={rq.id} className="rounded-lg border p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="font-medium">{rq.request_number || `요청 ${rq.id.slice(-6)}`}</div>
                <span className="text-xs rounded px-2 py-0.5 border">{rq.status || 'pending'}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                요청자: {rq.requester?.full_name || '-'} · 필요일:{' '}
                {rq.needed_by ? new Date(rq.needed_by).toLocaleDateString('ko-KR') : '-'} · 품목{' '}
                {rq.items?.length || 0}개
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                생성일: {rq.created_at ? new Date(rq.created_at).toLocaleString('ko-KR') : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
