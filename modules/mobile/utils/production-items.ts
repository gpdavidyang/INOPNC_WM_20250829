export type ProductionItemInput = {
  material_id: string
  produced_quantity: number
  order_quantity: number | null
  notes: string | null
}

export async function persistFallbackItemsMetadata(
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
    console.error('[Production] fallback metadata update failed', fallbackError)
  }
}

export function parseProductionItems(formData: FormData): ProductionItemInput[] {
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

export function materialIdFromLegacy(formData: FormData): ProductionItemInput[] {
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
