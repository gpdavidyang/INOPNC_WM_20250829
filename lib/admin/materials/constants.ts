export type InventorySortKey = 'material' | 'site' | 'current_stock' | 'updated_at'

export const INVENTORY_SORT_COLUMNS: Record<
  InventorySortKey,
  { column: string; foreignTable?: string; nullsFirst?: boolean }
> = {
  material: { column: 'name', foreignTable: 'materials' },
  site: { column: 'name', foreignTable: 'sites' },
  current_stock: { column: 'current_stock' },
  updated_at: { column: 'updated_at', nullsFirst: true },
}
