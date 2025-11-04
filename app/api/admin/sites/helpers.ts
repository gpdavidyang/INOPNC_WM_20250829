import type { UpdateSiteData } from '@/app/actions/admin/sites'

const ALLOWED_STATUSES = new Set<UpdateSiteData['status']>([
  'planning',
  'active',
  'inactive',
  'completed',
])

const NULLABLE_FIELDS: Array<keyof UpdateSiteData> = [
  'description',
  'end_date',
  'manager_name',
  'manager_phone',
  'manager_email',
  'safety_manager_name',
  'safety_manager_phone',
  'accommodation_name',
  'accommodation_address',
  'accommodation_phone',
  'organization_id',
]

const ALLOWED_FIELDS: Array<keyof UpdateSiteData> = [
  'name',
  'address',
  'description',
  'construction_manager_phone',
  'manager_phone',
  'manager_email',
  'safety_manager_phone',
  'accommodation_name',
  'accommodation_address',
  'accommodation_phone',
  'manager_name',
  'safety_manager_name',
  'status',
  'start_date',
  'end_date',
  'organization_id',
]

const NULLABLE_SET = new Set(NULLABLE_FIELDS)

function coerceValue(value: unknown, nullable: boolean) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return nullable ? null : undefined
    }
    return trimmed
  }
  if (value === '') {
    return nullable ? null : undefined
  }
  return value
}

export function sanitizeSitePayload(payload: unknown): Partial<UpdateSiteData> {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const source = payload as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}

  for (const field of ALLOWED_FIELDS) {
    if (!(field in source)) continue
    const nullable = NULLABLE_SET.has(field)
    const coerced = coerceValue(source[field], nullable)
    if (coerced === undefined) continue
    sanitized[field] = coerced
  }

  if (sanitized.status && typeof sanitized.status === 'string') {
    if (!ALLOWED_STATUSES.has(sanitized.status as UpdateSiteData['status'])) {
      delete sanitized.status
    }
  }

  if (sanitized.start_date && typeof sanitized.start_date === 'string') {
    const trimmed = sanitized.start_date.trim()
    if (!trimmed) {
      delete sanitized.start_date
    } else {
      sanitized.start_date = trimmed
    }
  }

  if (sanitized.manager_phone && !sanitized.construction_manager_phone) {
    sanitized.construction_manager_phone = sanitized.manager_phone
  }

  return sanitized as Partial<UpdateSiteData>
}
