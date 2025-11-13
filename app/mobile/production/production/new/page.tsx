import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ProductionItemsFieldArray from '@/modules/mobile/components/production/ProductionItemsFieldArray'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import {
  hasProductionItemsTable,
  hasMaterialProductionColumn,
} from '@/lib/materials/production-support'
import {
  materialIdFromLegacy,
  parseProductionItems,
  persistFallbackItemsMetadata,
  type ProductionItemInput,
} from '@/modules/mobile/utils/production-items'

export const metadata: Metadata = { title: '생산 정보 입력' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const rawSiteId = ((formData.get('site_id') as string) || '').trim()
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
  const fallbackItems = items.length === 0 ? materialIdFromLegacy(formData) : []
  const effectiveItems = items.length ? items : fallbackItems

  if (!production_date || effectiveItems.length === 0) {
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

  const insertPayload: Record<string, any> = {
    site_id: rawSiteId || null,
    material_id: effectiveItems[0]?.material_id || null,
    production_date,
    produced_quantity: totalProduced,
    quality_status: 'pending',
    quality_notes: notes ? `${notes}\n${JSON.stringify(extended)}` : JSON.stringify(extended),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const supportsCreatedBy = await hasMaterialProductionColumn(supabase, 'created_by')
  if (supportsCreatedBy) insertPayload.created_by = session.user.id

  insertPayload.production_number = await generateProductionNumber(
    supabase,
    typeof insertPayload.production_date === 'string'
      ? insertPayload.production_date
      : production_date
  )
  const supportsStatusCol = await hasMaterialProductionColumn(supabase, 'status')
  if (supportsStatusCol) {
    insertPayload.status = 'pending'
  }

  const { data: production, error: productionError } = await insertProductionRecord(
    supabase,
    insertPayload
  )

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

  revalidatePath('/dashboard/admin/materials?tab=productions')
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

async function generateProductionNumber(
  supabase: any,
  productionDate?: string | null
): Promise<string> {
  const normalizedDate =
    typeof productionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(productionDate)
      ? productionDate
      : new Date().toISOString().slice(0, 10)
  const datePart = normalizedDate.replace(/-/g, '')
  try {
    const counterClient = createServiceRoleClient()
    const { data } = await counterClient
      .from('material_productions')
      .select('production_number')
      .ilike('production_number', `P${datePart}-%`)
      .limit(1000)
    const usedSequences = new Set<string>()
    for (const row of data || []) {
      const value = typeof row.production_number === 'string' ? row.production_number : ''
      const match = value.match(/^P\d{8}-(\d{3})$/)
      if (match) usedSequences.add(match[1])
    }
    let seqNumber = 1
    while (usedSequences.has(String(seqNumber).padStart(3, '0'))) {
      seqNumber += 1
    }
    const sequence = String(seqNumber).padStart(3, '0')
    return `P${datePart}-${sequence}`
  } catch (error) {
    console.error('[ProductionCreate] failed to generate production number', error)
    return `P${datePart}-${Date.now()}`
  }
}

async function insertProductionRecord(
  supabase: any,
  payload: Record<string, any>
): Promise<{ data: { id: string } | null; error: any }> {
  const attemptPayload = await pruneMissingProductionColumns(supabase, payload)
  const maxAttempts = Object.keys(attemptPayload).length + 5
  let lastError: any = null
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('material_productions')
      .insert(attemptPayload as any)
      .select('id')
      .single()

    if (!error) {
      return { data, error: null }
    }

    lastError = error
    const missingColumn = parseMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
      delete attemptPayload[missingColumn]
      continue
    }

    if (isProductionNumberConflict(error)) {
      const targetDate =
        typeof attemptPayload.production_date === 'string' ? attemptPayload.production_date : null
      attemptPayload.production_number = await generateProductionNumber(supabase, targetDate)
      continue
    }

    return { data: null, error }
  }

  return { data: null, error: lastError || new Error('Failed to insert material production') }
}

function parseMissingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/column\s+"([^"]+)"\s+does\s+not\s+exist/i)
  return match ? match[1] : null
}

function isProductionNumberConflict(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('material_productions_production_number_key') ||
    (message.includes('production_number') && message.includes('duplicate'))
  )
}

const REQUIRED_COLUMNS = new Set(['site_id', 'production_date', 'produced_quantity'])

async function pruneMissingProductionColumns(
  supabase: any,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const sanitized: Record<string, any> = { ...payload }
  for (const key of Object.keys(payload)) {
    if (REQUIRED_COLUMNS.has(key)) continue
    const exists = await hasMaterialProductionColumn(supabase, key)
    if (!exists) {
      delete sanitized[key]
    }
  }
  return sanitized
}
