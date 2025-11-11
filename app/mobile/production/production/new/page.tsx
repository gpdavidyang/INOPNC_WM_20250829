import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ProductionItemsFieldArray from '@/modules/mobile/components/production/ProductionItemsFieldArray'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import { hasProductionItemsTable } from '@/lib/materials/production-support'

export const metadata: Metadata = { title: '생산 정보 입력' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const production_date = (formData.get('production_date') as string) || ''
  const notes = ((formData.get('notes') as string) || '').trim() || null

  // Extended fields (notes JSON merge)
  const order_date = (formData.get('order_date') as string) || ''
  const order_quantity = Number(formData.get('order_quantity') || 0)
  const site_name = (formData.get('site_name') as string) || ''
  const org_id = (formData.get('org_id') as string) || ''
  const org_name = (formData.get('org_name') as string) || ''
  const billing_method = (formData.get('billing_method') as string) || ''
  const shipping_method = (formData.get('shipping_method') as string) || ''
  const freight_pay = (formData.get('freight_pay') as string) || ''
  const receipt = formData.get('receipt') as File | null
  const memo = ((formData.get('memo') as string) || '').trim()

  const items = parseProductionItems(formData)
  const fallbackItems = items.length === 0 ? material_idFromLegacy(formData) : []
  const effectiveItems = items.length ? items : fallbackItems

  if (!site_id || !production_date || effectiveItems.length === 0) {
    console.error('[ProductionCreate] validation failed', {
      site_id,
      production_date,
      itemsLength: effectiveItems.length,
    })
    throw new Error('필수 항목을 입력해 주세요.')
  }

  const extended = {
    order_date,
    order_quantity,
    site_name,
    org_id,
    org_name,
    billing_method,
    shipping_method,
    freight_pay,
    receipt_name: receipt ? receipt.name : undefined,
    memo,
  }

  const totalProduced = effectiveItems.reduce(
    (sum, item) => sum + Number(item.produced_quantity || 0),
    0
  )

  const { data: production, error: productionError } = await supabase
    .from('material_productions')
    .insert({
      site_id,
      material_id: effectiveItems[0]?.material_id || null,
      production_date,
      produced_quantity: totalProduced,
      quality_status: 'pending',
      quality_notes: notes ? `${notes}\n${JSON.stringify(extended)}` : JSON.stringify(extended),
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single()

  if (productionError || !production) {
    console.error('[ProductionCreate] insert error', productionError)
    const message = productionError?.message || '생산 정보를 저장하지 못했습니다.'
    throw new Error(message)
  }

  if (production.id && effectiveItems.length > 0) {
    const supportsProductionItems = await hasProductionItemsTable(supabase)
    if (supportsProductionItems) {
      const { error: itemError } = await supabase.from('material_production_items').insert(
        effectiveItems.map(item => ({
          production_id: production.id,
          material_id: item.material_id,
          produced_quantity: item.produced_quantity,
          order_quantity: item.order_quantity,
          notes: item.notes,
        })) as any
      )
      if (itemError) {
        console.error('[ProductionCreate] item insert error (continuing with fallback)', itemError)
        await persistFallbackItemsMetadata(
          supabase,
          production.id,
          extended,
          effectiveItems,
          'item_insert_failed'
        )
      }
    } else {
      console.warn(
        '[ProductionCreate] material_production_items table missing; storing inline items'
      )
      await persistFallbackItemsMetadata(
        supabase,
        production.id,
        extended,
        effectiveItems,
        'table_missing'
      )
    }
  }

  revalidatePath('/dashboard/admin/materials?tab=production')
  revalidatePath('/mobile/production/production')
  redirect('/mobile/production/production')
}

export default async function ProductionCreatePage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const defaultSite = Array.isArray(sites) && sites.length > 0 ? sites[0] : null
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')

  const materialOptions: OptionItem[] = (materials || []).map(m => ({
    value: m.id as string,
    label: `${m.name || '-'}${m.code ? ` (${m.code})` : ''}`,
  }))

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="production" />}>
      <div className="p-5 space-y-5 pb-safe min-h-screen-safe">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">생산 정보 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={submit} className="pm-form space-y-3">
            <input type="hidden" name="site_id" value={defaultSite?.id ?? ''} />
            <input type="hidden" name="site_name" value={defaultSite?.name ?? ''} />
            {!defaultSite && (
              <div className="rounded-md bg-amber-50 text-amber-800 text-sm px-3 py-2">
                등록된 현장이 없어 생산 정보를 저장할 수 없습니다. 관리자에게 문의해 주세요.
              </div>
            )}
            {/* 생산 날짜 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                생산날짜<span className="req-mark"> *</span>
              </label>
              <input
                type="date"
                name="production_date"
                className="w-full rounded border px-3 py-2"
                required
              />
            </div>

            {/* 생산 품목 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                생산 품목<span className="req-mark"> *</span>
              </label>
              <ProductionItemsFieldArray
                materialOptions={materialOptions}
                showOrderQuantity={false}
                showItemMemo={false}
              />
            </div>

            {/* Removed 주문/거래/배송 관련 필드 per 최신 요구사항 */}

            {/* 메모: 별도 1행 (참고와 동일하게 크게) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">메모</label>
              <textarea
                name="memo"
                placeholder="요청사항을 입력하세요."
                rows={3}
                className="w-full rounded border px-3 py-2 h-20"
              />
            </div>

            <div className="pm-form-actions">
              <button type="reset" className="pm-btn pm-btn-secondary">
                취소하기
              </button>
              <button
                type="submit"
                className="pm-btn pm-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!defaultSite}
              >
                저장하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}

type ProductionItemInput = {
  material_id: string
  produced_quantity: number
  order_quantity: number | null
  notes: string | null
}

async function persistFallbackItemsMetadata(
  supabase: any,
  productionId: string,
  extended: Record<string, unknown>,
  items: ProductionItemInput[],
  reason: 'table_missing' | 'item_insert_failed'
) {
  try {
    const materialIds = Array.from(
      new Set(items.map(item => item.material_id).filter(Boolean))
    ) as string[]
    const materialSnapshotMap = new Map<
      string,
      { name?: string | null; code?: string | null; unit?: string | null }
    >()

    if (materialIds.length > 0) {
      const { data: materialRows } = await supabase
        .from('materials')
        .select('id, name, code, unit')
        .in('id', materialIds)
      for (const row of materialRows || []) {
        materialSnapshotMap.set(String(row.id), {
          name: row.name ?? null,
          code: row.code ?? null,
          unit: row.unit ?? null,
        })
      }
    }

    const enrichedItems = items.map(item => ({
      ...item,
      material_snapshot: item.material_id
        ? (materialSnapshotMap.get(item.material_id) ?? null)
        : null,
    }))

    await supabase
      .from('material_productions')
      .update({
        quality_notes: JSON.stringify({
          ...extended,
          fallback_items: enrichedItems,
          fallback_reason: reason,
        }),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', productionId)
  } catch (fallbackError) {
    console.error('[ProductionCreate] fallback metadata update failed', fallbackError)
  }
}

function parseProductionItems(formData: FormData): ProductionItemInput[] {
  const buckets = new Map<number, Record<string, string>>()
  for (const [key, rawValue] of formData.entries()) {
    if (typeof rawValue !== 'string') continue
    const match = key.match(/^items\[(\d+)\]\[(\w+)\]$/)
    if (!match) continue
    const index = Number(match[1])
    const field = match[2]
    if (!buckets.has(index)) buckets.set(index, {})
    buckets.get(index)![field] = rawValue
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, value]) => ({
      material_id: value.material_id || '',
      produced_quantity: Number(value.produced_quantity || 0),
      order_quantity: value.order_quantity ? Number(value.order_quantity) : null,
      notes: value.notes ? value.notes.trim() : null,
    }))
    .filter(item => item.material_id && item.produced_quantity > 0)
}

function material_idFromLegacy(formData: FormData): ProductionItemInput[] {
  const legacyMaterial = (formData.get('material_id') as string) || ''
  const legacyQuantity = Number(formData.get('produced_quantity') || 0)
  if (!legacyMaterial || legacyQuantity <= 0) return []
  const legacyOrder = Number(formData.get('order_quantity') || 0)
  return [
    {
      material_id: legacyMaterial,
      produced_quantity: legacyQuantity,
      order_quantity: legacyOrder > 0 ? legacyOrder : null,
      notes: null,
    },
  ]
}
