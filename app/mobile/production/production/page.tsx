import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const metadata: Metadata = { title: '생산정보 관리' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const material_id = (formData.get('material_id') as string) || ''
  const production_date = (formData.get('production_date') as string) || ''
  const produced_quantity = Number(formData.get('produced_quantity') || 0)
  const notes = ((formData.get('notes') as string) || '').trim() || null

  if (!site_id || !material_id || !production_date || produced_quantity <= 0) {
    redirect('/mobile/production/production')
  }

  // 기본 상태: pending, 승인/품질은 관리자에서 처리
  await supabase.from('material_productions').insert({
    site_id,
    material_id,
    production_date,
    produced_quantity,
    quality_status: 'pending',
    quality_notes: notes,
    created_by: session.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any)

  revalidatePath('/dashboard/admin/materials?tab=production')
  redirect('/mobile/production/production')
}

export default async function ProductionManagePage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  // 사이트 및 자재 목록
  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')

  // 최근 생산기록 50건
  const { data: productions } = await supabase
    .from('material_productions')
    .select(
      'id, production_date, produced_quantity, quality_status, sites(name), materials(name, code)'
    )
    .order('production_date', { ascending: false })
    .limit(50)

  return (
    <MobileLayoutWithAuth>
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">생산정보 관리</h1>
          <a href="/mobile/production" className="rounded-md border px-3 py-1.5 text-sm">
            홈으로
          </a>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm font-medium mb-3">생산 등록</div>
          <form action={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">현장 *</label>
              <select name="site_id" className="w-full rounded border px-3 py-2" required>
                <option value="">현장 선택</option>
                {(sites || []).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">자재 *</label>
              <select name="material_id" className="w-full rounded border px-3 py-2" required>
                <option value="">자재 선택</option>
                {(materials || []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.code ? `(${m.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">생산일 *</label>
              <input
                type="date"
                name="production_date"
                className="w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">생산수량 *</label>
              <input
                type="number"
                min="0"
                step="1"
                name="produced_quantity"
                className="w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">특이사항/메모</label>
              <textarea name="notes" rows={3} className="w-full rounded border px-3 py-2" />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded border px-3 py-2 bg-black text-white">
                저장
              </button>
              <button type="reset" className="flex-1 rounded border px-3 py-2">
                초기화
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm font-medium mb-3">최근 생산 기록</div>
          {(!productions || productions.length === 0) && (
            <div className="text-sm text-muted-foreground">생산 기록이 없습니다.</div>
          )}
          <div className="space-y-2">
            {(productions || []).map(p => (
              <div key={p.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.materials?.name || '-'}</div>
                  <span className="text-xs rounded px-2 py-0.5 border">
                    {p.quality_status || 'pending'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  현장: {p.sites?.name || '-'} · 수량: {p.produced_quantity ?? 0} · 일자:{' '}
                  {p.production_date
                    ? new Date(p.production_date).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
