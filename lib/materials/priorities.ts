export const MATERIAL_PRIORITY_VALUES = ['low', 'normal', 'high', 'urgent'] as const

export type MaterialPriorityValue = (typeof MATERIAL_PRIORITY_VALUES)[number]

export const DEFAULT_MATERIAL_PRIORITY: MaterialPriorityValue = 'normal'

export const MATERIAL_PRIORITY_LABELS: Record<MaterialPriorityValue, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  urgent: '긴급',
}

export const MATERIAL_PRIORITY_OPTIONS = MATERIAL_PRIORITY_VALUES.map(value => ({
  value,
  label: MATERIAL_PRIORITY_LABELS[value],
}))

export const MATERIAL_PRIORITY_BADGE_VARIANTS: Record<
  MaterialPriorityValue,
  'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
> = {
  low: 'outline',
  normal: 'secondary',
  high: 'warning',
  urgent: 'error',
}

export function isMaterialPriorityValue(value: unknown): value is MaterialPriorityValue {
  return (
    typeof value === 'string' && MATERIAL_PRIORITY_VALUES.includes(value as MaterialPriorityValue)
  )
}

export function normalizeMaterialPriority(value?: string | null): MaterialPriorityValue {
  if (isMaterialPriorityValue(value)) {
    return value
  }
  return DEFAULT_MATERIAL_PRIORITY
}

export function formatMaterialPriority(value?: string | null): string {
  if (isMaterialPriorityValue(value)) {
    return MATERIAL_PRIORITY_LABELS[value]
  }
  return MATERIAL_PRIORITY_LABELS[DEFAULT_MATERIAL_PRIORITY]
}
