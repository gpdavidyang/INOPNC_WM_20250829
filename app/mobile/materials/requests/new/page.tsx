import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import MaterialRequestForm, { type MaterialOption } from '@/components/mobile/MaterialRequestForm'
import { createMaterialRequest as createRequestAction } from '@/app/actions/materials'

export const metadata: Metadata = { title: '새 자재 요청' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (me?.role === 'partner') redirect('/mobile')

  const site_id = (formData.get('site_id') as string) || ''
  const needed_by = (formData.get('needed_by') as string) || ''
  const priority = ((formData.get('priority') as string) || 'normal') as
    | 'low'
    | 'normal'
    | 'high'
    | 'urgent'
  const notes = (formData.get('notes') as string) || undefined

  const items: Array<{ material_id: string; requested_quantity: number; notes?: string }> = []
  // Collect items[0..n]
  for (const [key, value] of formData.entries()) {
    const match = /^items\[(\d+)\]\[(material_id|requested_quantity)\]$/.exec(key as string)
    if (match) {
      const idx = Number(match[1])
      const field = match[2]
      if (!items[idx]) items[idx] = { material_id: '', requested_quantity: 0 }
      if (field === 'material_id') items[idx].material_id = String(value)
      if (field === 'requested_quantity') items[idx].requested_quantity = Number(value)
    }
  }

  const validItems = items.filter(it => it?.material_id && it.requested_quantity > 0)
  if (!site_id || validItems.length === 0) {
    redirect('/mobile/materials/requests/new')
  }

  await createRequestAction({ site_id, needed_by, priority, notes, items: validItems })
  revalidatePath('/dashboard/admin/materials?tab=requests')
  redirect('/mobile/materials/requests')
}

export default async function NewMobileMaterialRequestPage() {
  await requireAuth('/mobile')
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  // 가장 최근 활성 현장
  const { data: assignments } = await supabase
    .from('site_assignments')
    .select('site_id, sites(name)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('assigned_date', { ascending: false })
    .limit(1)

  const siteId = (assignments?.[0] as any)?.site_id || ''
  const siteName = (assignments?.[0] as any)?.sites?.name || ''
  if (!siteId) {
    return (
      <div className="p-5">
        <h1 className="text-lg font-semibold">새 자재 요청</h1>
        <p className="text-sm text-muted-foreground mt-2">
          배정된 현장이 없어 요청을 생성할 수 없습니다.
        </p>
      </div>
    )
  }

  // 활성 자재 목록
  const { data: materialRows } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const materials: MaterialOption[] = (materialRows || []).map((m: any) => ({
    id: m.id as string,
    name: (m.name as string) || '-',
    code: (m.code as string) || null,
    unit: (m.unit as string) || null,
  }))

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">새 자재 요청</h1>
        <p className="text-sm text-muted-foreground">현장: {siteName || siteId}</p>
      </div>
      <MaterialRequestForm siteId={siteId} materials={materials} action={submit} />
    </div>
  )
}
