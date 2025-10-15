import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const metadata: Metadata = { title: '입고요청 조회' }

export default async function ProductionRequestsPage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  // 최근 100건 요청 조회 (조직 제한 없음: production_manager는 제한되지 않음)
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
      sites(name),
      requester:profiles!material_requests_requested_by_fkey(full_name),
      material_request_items(id)
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <MobileLayoutWithAuth>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">입고요청 조회</h1>
          <a href="/mobile/production" className="rounded-md border px-3 py-1.5 text-sm">
            홈으로
          </a>
        </div>

        {!requests || requests.length === 0 ? (
          <div className="text-sm text-muted-foreground">요청이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {requests.map(rq => (
              <div key={rq.id} className="rounded-lg border p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {rq.request_number || `요청 ${rq.id.slice(-6)}`}
                  </div>
                  <span className="text-xs rounded px-2 py-0.5 border">
                    {rq.status || 'pending'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  현장: {rq.sites?.name || '-'} · 요청자: {rq.requester?.full_name || '-'} · 품목{' '}
                  {rq.material_request_items?.length || 0}개
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  필요일: {rq.needed_by ? new Date(rq.needed_by).toLocaleDateString('ko-KR') : '-'}{' '}
                  · 생성일: {rq.created_at ? new Date(rq.created_at).toLocaleString('ko-KR') : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayoutWithAuth>
  )
}
