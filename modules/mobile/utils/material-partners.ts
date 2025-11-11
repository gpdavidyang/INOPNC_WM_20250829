import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'

const PARTNER_TYPE_LABEL: Record<string, string> = {
  npc: '원도급사',
  subcontractor: '협력업체',
  supplier: '자재거래처',
}

type PartnerRow = {
  id: string
  company_name?: string | null
  status?: string | null
  company_type?: string | null
}

interface BuildOptionsConfig {
  includeAllOption?: boolean
  allLabel?: string
  allValue?: string
}

export function buildMaterialPartnerOptions(
  rows: PartnerRow[] | null | undefined,
  config: BuildOptionsConfig = {}
): MaterialPartnerOption[] {
  const list =
    rows?.map(row => ({
      value: String(row.id),
      label: row.company_name || '-',
      status: row.status || null,
      description: row.company_type
        ? PARTNER_TYPE_LABEL[row.company_type] || row.company_type
        : null,
    })) || []

  if (!config.includeAllOption) {
    return list
  }

  const allLabel = config.allLabel || '전체 자재거래처'
  const allValue = config.allValue ?? 'all'
  return [{ value: allValue, label: allLabel }, ...list]
}

export { PARTNER_TYPE_LABEL }
