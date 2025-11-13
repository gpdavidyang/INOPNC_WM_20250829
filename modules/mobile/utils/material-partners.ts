import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'

type SupplierRow = {
  id: string
  company_name?: string | null
  status?: string | null
  contact_name?: string | null
  contact_phone?: string | null
}

interface BuildOptionsConfig {
  includeAllOption?: boolean
  allLabel?: string
  allValue?: string
}

export function buildMaterialPartnerOptions(
  rows: SupplierRow[] | null | undefined,
  config: BuildOptionsConfig = {}
): MaterialPartnerOption[] {
  const list =
    rows?.map(row => ({
      value: String(row.id),
      label: row.company_name || '-',
      status: row.status || null,
      description: row.contact_name || row.contact_phone || null,
    })) || []

  if (!config.includeAllOption) {
    return list
  }

  const allLabel = config.allLabel || '전체 자재거래처'
  const allValue = config.allValue ?? 'all'
  return [{ value: allValue, label: allLabel }, ...list]
}
