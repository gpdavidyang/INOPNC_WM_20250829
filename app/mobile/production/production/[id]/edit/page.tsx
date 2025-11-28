import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ProductionItemsFieldArray, {
  type ProductionItemDefault,
} from '@/modules/mobile/components/production/ProductionItemsFieldArray'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import {
  hasProductionItemsTable,
  hasMaterialProductionColumn,
  parseProductionMetadata,
  extractProductionMemo,
} from '@/lib/materials/production-support'
import {
  materialIdFromLegacy,
  parseProductionItems,
  persistFallbackItemsMetadata,
  type ProductionItemInput,
} from '@/modules/mobile/utils/production-items'

export const metadata: Metadata = { title: '생산 정보 수정' }

async function updateProduction(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const id = ((formData.get('production_id') as string) || '').trim()
  if (!id) throw new Error('잘못된 요청입니다.')

  const site_id = ((formData.get('site_id') as string) || '').trim() || null
  const site_name = ((formData.get('site_name') as string) || '').trim() || ''
  const production_date = (formData.get('production_date') as string) || ''
  const memo = ((formData.get('memo') as string) || '').trim()

  const items = parseProductionItems(formData)
  const fallbackItems = items.length === 0 ? materialIdFromLegacy(formData) : []
  const effectiveItems = items.length ? items : fallbackItems

  if (!production_date || effectiveItems.length === 0) {
    throw new Error('필수 항목을 입력해 주세요.')
  }

  const { data: existing } = await supabase
    .from('material_productions')
    .select('quality_notes')
    .eq('id', id)
    .maybeSingle()
  const parsedMetadata = parseProductionMetadata(existing?.quality_notes)
  const { fallback_items: _ignored, ...restMetadata } = parsedMetadata || {}

  const extended = { ...restMetadata, site_name, memo }
  const totalProduced = effectiveItems.reduce(
    (sum, item) => sum + Number(item.produced_quantity || 0),
    0
  )
  const qualityNotes = memo ? `${memo}\n${JSON.stringify(extended)}` : JSON.stringify(extended)

  const updatePayload: Record<string, any> = {
    site_id,
    production_date,
    produced_quantity: totalProduced,
    quality_notes: qualityNotes,
    updated_at: new Date().toISOString(),
  }

  if (await hasMaterialProductionColumn(supabase, 'material_id')) {
    updatePayload.material_id = effectiveItems[0]?.material_id || null
  }

  await supabase
    .from('material_productions')
    .update(updatePayload as any)
    .eq('id', id)

  const supportsProductionItems = await hasProductionItemsTable(supabase)
  if (supportsProductionItems) {
    await supabase.from('material_production_items').delete().eq('production_id', id)
    if (effectiveItems.length > 0) {
      await supabase.from('material_production_items').insert(
        effectiveItems.map(item => ({
          production_id: id,
          material_id: item.material_id,
          produced_quantity: item.produced_quantity,
          order_quantity: item.order_quantity,
          notes: item.notes,
        })) as any
      )
    }
  } else {
    await persistFallbackItemsMetadata(supabase, id, extended, effectiveItems, 'table_missing')
  }

  revalidatePath('/mobile/production/production')
  redirect('/mobile/production/production')
}

export default async function ProductionEditPage({ params }: { params: { id: string } }) {
  await requireAuth('/mobile/production')
  const supabase = createClient()
  const { id } = params

  const supportsProductionItems = await hasProductionItemsTable(supabase)

  const selectColumns = [
    'id',
    'site_id',
    'production_date',
    'produced_quantity',
    'quality_notes',
    'production_number',
    'sites(name)',
  ]
  if (supportsProductionItems) {
    selectColumns.push(
      'material_production_items(material_id, produced_quantity, order_quantity, notes)'
    )
  }

  const { data: production } = await supabase
    .from('material_productions')
    .select(selectColumns.join(',\n'))
    .eq('id', id)
    .maybeSingle()

  if (!production) {
    redirect('/mobile/production/production')
  }

  const metadata = parseProductionMetadata(production.quality_notes)
  const memoDefault =
    metadata?.memo ?? extractProductionMemo(production.quality_notes, metadata) ?? ''

  const defaultItems: ProductionItemDefault[] = []
  if (supportsProductionItems && Array.isArray(production.material_production_items)) {
    production.material_production_items.forEach((item: any) => {
      defaultItems.push({
        material_id: item.material_id || '',
        produced_quantity: item.produced_quantity ?? 0,
        order_quantity: item.order_quantity ?? null,
        notes: item.notes ?? '',
      })
    })
  } else if (Array.isArray(metadata?.fallback_items)) {
    metadata!.fallback_items!.forEach(item => {
      defaultItems.push({
        material_id: item.material_id || '',
        produced_quantity: item.produced_quantity ?? 0,
        order_quantity: item.order_quantity ?? null,
        notes: item.notes ?? '',
      })
    })
  }

  if (defaultItems.length === 0) {
    defaultItems.push({
      material_id: '',
      produced_quantity: 0,
      order_quantity: null,
      notes: '',
    })
  }

  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')

  const materialOptions: OptionItem[] = (materials || []).map(m => ({
    value: m.id as string,
    label: `${m.name || '-'}${m.code ? ` (${m.code})` : ''}`,
  }))

  const siteName = production.sites?.name || ''

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="production" />}>
      <div className="p-5 space-y-5 pb-safe min-h-screen-safe">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">생산 정보 수정</div>
          </div>
          <form action={updateProduction} className="pm-form space-y-3">
            <input type="hidden" name="production_id" value={id} />
            <input type="hidden" name="site_id" value={production.site_id ?? ''} />
            <input type="hidden" name="site_name" value={siteName} />
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              현장: {siteName || '미지정'}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                생산날짜<span className="req-mark"> *</span>
              </label>
              <input
                type="date"
                name="production_date"
                className="w-full rounded-lg border px-3 py-2"
                required
                defaultValue={
                  production.production_date ? String(production.production_date).slice(0, 10) : ''
                }
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                생산 품목<span className="req-mark"> *</span>
              </label>
              <ProductionItemsFieldArray
                materialOptions={materialOptions}
                showOrderQuantity={false}
                showItemMemo={false}
                defaultItems={defaultItems}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">메모</label>
              <textarea
                name="memo"
                placeholder="요청사항을 입력하세요."
                rows={3}
                className="w-full rounded-lg border px-3 py-2 h-20"
                defaultValue={memoDefault}
              />
            </div>

            <div className="pm-form-actions">
              <a href="/mobile/production/production" className="pm-btn pm-btn-secondary">
                취소하기
              </a>
              <button type="submit" className="pm-btn pm-btn-primary">
                저장하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
