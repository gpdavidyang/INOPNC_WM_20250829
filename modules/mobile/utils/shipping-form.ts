import type { SupabaseClient } from '@supabase/supabase-js'

export type OptionalShipmentColumn =
  | 'partner_company_id'
  | 'billing_method_id'
  | 'shipping_method_id'
  | 'freight_charge_method_id'
  | 'total_amount'
  | 'flag_etax'
  | 'flag_statement'
  | 'flag_freight_paid'
  | 'flag_bill_amount'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'carrier'
  | 'tracking_number'
  | 'shipment_number'

export const OPTIONAL_COLUMN_KEYS: OptionalShipmentColumn[] = [
  'partner_company_id',
  'billing_method_id',
  'shipping_method_id',
  'freight_charge_method_id',
  'total_amount',
  'flag_etax',
  'flag_statement',
  'flag_freight_paid',
  'flag_bill_amount',
  'created_by',
  'created_at',
  'updated_at',
  'carrier',
  'tracking_number',
  'shipment_number',
]

export const missingShipmentColumns = new Set<OptionalShipmentColumn>()

type OptionalItemColumn = 'unit_price' | 'total_price' | 'notes'
const OPTIONAL_ITEM_COLUMNS: OptionalItemColumn[] = ['unit_price', 'total_price', 'notes']
const missingItemColumns = new Set<OptionalItemColumn>()

export type SnapshotItemNote = {
  material_id?: string
  material_label?: string
  note: string
}

export type ShipmentMetadataSnapshot = {
  partner_company_label?: string
  flags?: {
    flag_etax: boolean
    flag_statement: boolean
    flag_freight_paid: boolean
    flag_bill_amount: boolean
  }
  total_amount_input?: number
  site_autofilled?: boolean
  billing_method_label?: string
  shipping_method_label?: string
  freight_method_label?: string
  item_notes?: SnapshotItemNote[]
}

export type MetadataSnapshotInput = {
  omit: Set<OptionalShipmentColumn>
  partnerLabel: string
  totalAmount: number
  flags: {
    flag_etax: boolean
    flag_statement: boolean
    flag_freight_paid: boolean
    flag_bill_amount: boolean
  }
  siteAutofilled: boolean
  billingLabel?: string
  shippingLabel?: string
  freightLabel?: string
  itemNotes?: SnapshotItemNote[]
}

export const METADATA_PREFIX = '__meta__:'

export type ShipmentItemInput = {
  material_id: string
  material_label?: string
  quantity: number
  unit_price: number | null
  notes: string | null
}

export function parseShipmentItems(formData: FormData): ShipmentItemInput[] {
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
      material_label: value.material_label ? value.material_label.trim() : '',
      quantity: Number(value.quantity || 0),
      unit_price: value.unit_price ? Number(value.unit_price) : null,
      notes: value.notes ? value.notes.trim() : null,
    }))
    .filter(item => item.material_id && item.quantity > 0)
}

export function legacyShipmentItems(formData: FormData): ShipmentItemInput[] {
  const legacyMaterial = (formData.get('material_id') as string) || ''
  const legacyQty = Number(formData.get('quantity') || 0)
  if (!legacyMaterial || legacyQty <= 0) return []
  return [
    {
      material_id: legacyMaterial,
      quantity: legacyQty,
      unit_price: null,
      notes: null,
    },
  ]
}

export function extractMissingColumnName(error: any): OptionalShipmentColumn | null {
  if (!error) return null
  const rawMessage = String(error.message || '')

  if (error.code === '42703') {
    const match = rawMessage.match(
      /column\s+(?:public\.)?(?:"?material_shipments"?\.)?"?([a-zA-Z0-9_]+)"?\s+does not exist/i
    )
    if (match) return match[1] as OptionalShipmentColumn
  }

  if (error.code === 'PGRST204') {
    const match = rawMessage.match(/'([a-zA-Z0-9_]+)'\s+column/i)
    if (match) return match[1] as OptionalShipmentColumn
  }

  return null
}

export async function resolveSiteForPartner(
  supabase: SupabaseClient<any, 'public', any>,
  partnerCompanyId: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', partnerCompanyId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
    const mapped = (data || []).find(entry => entry?.site_id)?.site_id
    if (mapped) {
      return String(mapped)
    }
  } catch (error) {
    console.warn('[Shipping] Failed to lookup site for partner', error)
  }
  return null
}

export function buildMetadataSnapshot(
  input: MetadataSnapshotInput
): ShipmentMetadataSnapshot | null {
  const { omit, partnerLabel, flags, siteAutofilled } = input
  const totalAmount =
    typeof input.totalAmount === 'number' && Number.isFinite(input.totalAmount)
      ? input.totalAmount
      : 0
  const snapshot: ShipmentMetadataSnapshot = {}
  if (omit.has('partner_company_id') && partnerLabel) {
    snapshot.partner_company_label = partnerLabel
  }
  const missingFlag =
    omit.has('flag_etax') ||
    omit.has('flag_statement') ||
    omit.has('flag_freight_paid') ||
    omit.has('flag_bill_amount')
  if (missingFlag) {
    snapshot.flags = { ...flags }
  }
  if (omit.has('total_amount') && totalAmount > 0) {
    snapshot.total_amount_input = totalAmount
  }
  if (siteAutofilled) {
    snapshot.site_autofilled = true
  }
  if (omit.has('billing_method_id') && input.billingLabel) {
    snapshot.billing_method_label = input.billingLabel
  }
  if (omit.has('shipping_method_id') && input.shippingLabel) {
    snapshot.shipping_method_label = input.shippingLabel
  }
  if (omit.has('freight_charge_method_id') && input.freightLabel) {
    snapshot.freight_method_label = input.freightLabel
  }
  if (input.itemNotes && input.itemNotes.length > 0) {
    snapshot.item_notes = input.itemNotes
  }
  return Object.keys(snapshot).length > 0 ? snapshot : null
}

export function encodeMetadataSnapshot(snapshot: ShipmentMetadataSnapshot | null): string | null {
  if (!snapshot) return null
  try {
    return `${METADATA_PREFIX}${JSON.stringify(snapshot)}`
  } catch {
    return null
  }
}

export async function insertShipmentItems(
  supabase: SupabaseClient<any, 'public', any>,
  shipmentId: string,
  items: ShipmentItemInput[]
): Promise<void> {
  const detectedMissing = new Set<OptionalItemColumn>(missingItemColumns)
  const maxAttempts = OPTIONAL_ITEM_COLUMNS.length + 1
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const payload = items.map(item => {
      const row: Record<string, any> = {
        shipment_id: shipmentId,
        material_id: item.material_id,
        quantity: item.quantity,
      }
      if (!detectedMissing.has('unit_price') && item.unit_price != null) {
        row.unit_price = item.unit_price
      }
      if (!detectedMissing.has('total_price')) {
        row.total_price =
          item.unit_price != null ? Number(item.unit_price) * Number(item.quantity || 0) : null
      }
      if (!detectedMissing.has('notes') && item.notes) {
        row.notes = item.notes
      }
      return row
    })
    const { error } = await supabase.from('shipment_items').insert(payload as any)
    if (!error) return
    const missingColumn = extractMissingItemColumnName(error)
    if (missingColumn && OPTIONAL_ITEM_COLUMNS.includes(missingColumn)) {
      console.warn('[Shipping] shipment_items missing column, retrying', {
        missingColumn,
        message: error?.message,
      })
      detectedMissing.add(missingColumn)
      missingItemColumns.add(missingColumn)
      continue
    }
    console.error('[Shipping] item insert error (giving up)', error)
    break
  }
}

export function extractMissingItemColumnName(error: any): OptionalItemColumn | null {
  if (!error) return null
  const raw = String(error.message || '')
  if (error.code === '42703') {
    const match = raw.match(
      /column\s+(?:public\.)?(?:"?shipment_items"?\.)?"?([a-zA-Z0-9_]+)"?\s+does not exist/i
    )
    if (match) return match[1] as OptionalItemColumn
  }
  if (error.code === 'PGRST204') {
    const match = raw.match(/'([a-zA-Z0-9_]+)'\s+column/i)
    if (match) return match[1] as OptionalItemColumn
  }
  return null
}

export function parseMetadataSnapshot(notes: any): ShipmentMetadataSnapshot | null {
  if (!notes) return null
  const rawValue = typeof notes === 'string' ? notes : String(notes)
  if (!rawValue) return null
  const trimmed = rawValue.trim()
  if (!trimmed) return null
  const prefixIndex = trimmed.indexOf(METADATA_PREFIX)
  if (prefixIndex === -1) return null
  const jsonSegment = trimmed.slice(prefixIndex + METADATA_PREFIX.length).trim()
  if (!jsonSegment) return null
  try {
    const parsed = JSON.parse(jsonSegment)
    if (parsed && typeof parsed === 'object') {
      return parsed as ShipmentMetadataSnapshot
    }
  } catch {
    return null
  }
  return null
}
