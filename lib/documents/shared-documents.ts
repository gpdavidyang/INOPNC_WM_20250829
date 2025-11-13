import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  buildSharedCategoryMap,
} from '@/lib/constants/shared-document-categories'

export type SharedDocCategoryKey = 'ptw' | 'construction' | 'progress'

const RAW_CATEGORY_TARGETS: Record<SharedDocCategoryKey, string[]> = {
  ptw: ['PTW', 'PTW(작업허가서)', '작업허가서'],
  construction: ['공도면', 'Construction Drawing', 'Blueprint', 'Drawing', 'Construction_Drawing'],
  progress: ['진행도면', 'Progress Drawing', 'Progress_Drawing'],
}

const normalizeCategoryValue = (value: unknown): string => {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}

const slugifyCategoryValue = (value: string): string =>
  value.replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')

const buildNormalizedTargets = () => {
  const result = {} as Record<SharedDocCategoryKey, Set<string>>
  ;(Object.keys(RAW_CATEGORY_TARGETS) as SharedDocCategoryKey[]).forEach(key => {
    const set = new Set<string>()
    RAW_CATEGORY_TARGETS[key].forEach(rawValue => {
      const normalized = normalizeCategoryValue(rawValue)
      if (!normalized) return
      set.add(normalized)
      set.add(slugifyCategoryValue(normalized))
    })
    result[key] = set
  })
  return result
}

export const SHARED_DOC_CATEGORY_TARGETS = buildNormalizedTargets()
const DEFAULT_SHARED_CATEGORY_LABEL_MAP = buildSharedCategoryMap(DEFAULT_SHARED_DOCUMENT_CATEGORIES)

const normalizeLabelMap = (map: Record<string, string>) => {
  const normalized: Record<string, string> = {}
  Object.entries(map).forEach(([key, value]) => {
    if (!key) return
    normalized[key.trim().toLowerCase()] = value
  })
  return normalized
}

const DEFAULT_NORMALIZED_LABEL_MAP = normalizeLabelMap(DEFAULT_SHARED_CATEGORY_LABEL_MAP)

export const collectDocCategoryValues = (doc: Record<string, any>): string[] => {
  if (!doc || typeof doc !== 'object') return []
  const metadata =
    doc?.metadata && typeof doc.metadata === 'object' ? (doc.metadata as Record<string, any>) : {}
  const rawValues = [
    doc?.sub_category,
    doc?.subCategory,
    doc?.category_type_label,
    doc?.categoryLabel,
    doc?.category_label,
    doc?.label,
    doc?.display_category,
    metadata?.sub_category,
    metadata?.subcategory,
    metadata?.category,
    metadata?.category_label,
    metadata?.label,
  ]
  const normalized: string[] = []
  rawValues.forEach(value => {
    const normalizedValue = normalizeCategoryValue(value)
    if (!normalizedValue) return
    normalized.push(normalizedValue)
    normalized.push(slugifyCategoryValue(normalizedValue))
  })
  return Array.from(new Set(normalized))
}

export const matchesSharedDocCategory = (
  doc: Record<string, any>,
  key: SharedDocCategoryKey
): boolean => {
  const values = collectDocCategoryValues(doc)
  const targets = SHARED_DOC_CATEGORY_TARGETS[key]
  if (!values.length || !targets.size) return false
  return values.some(value => targets.has(value))
}

const lookupCategoryLabel = (
  map: Record<string, string>,
  key?: string | null | undefined
): string | null => {
  if (!key) return null
  const normalized = key.trim().toLowerCase()
  if (!normalized) return null
  return map[normalized] || null
}

export const resolveSharedDocCategoryLabel = (
  doc: Record<string, any>,
  overrideMap?: Record<string, string>
): string => {
  const normalizedOverrideMap = overrideMap ? normalizeLabelMap(overrideMap) : null
  const combinedLookup = normalizedOverrideMap
    ? { ...DEFAULT_NORMALIZED_LABEL_MAP, ...normalizedOverrideMap }
    : DEFAULT_NORMALIZED_LABEL_MAP

  const metadata =
    doc?.metadata && typeof doc.metadata === 'object' ? (doc.metadata as Record<string, any>) : {}

  const explicitLabel =
    metadata?.category_label ||
    metadata?.categoryLabel ||
    doc?.category_label ||
    doc?.categoryLabel ||
    doc?.label
  if (typeof explicitLabel === 'string' && explicitLabel.trim()) return explicitLabel.trim()

  const subCategoryRaw =
    doc?.sub_category ||
    doc?.subCategory ||
    metadata?.sub_category ||
    metadata?.subcategory ||
    metadata?.category ||
    ''
  const categoryTypeRaw = doc?.category_type || doc?.categoryType || metadata?.category_type || ''

  const subLabel = lookupCategoryLabel(combinedLookup, subCategoryRaw)
  if (subLabel) return subLabel
  const catLabel = lookupCategoryLabel(combinedLookup, categoryTypeRaw)
  if (catLabel) return catLabel

  const documentType = (doc?.document_type || doc?.documentType || '').toLowerCase()
  if (documentType === 'blueprint') return '공도면'
  if (documentType === 'progress_drawing') return '진행도면'
  if (documentType === 'ptw' || documentType === 'work_permit') return 'PTW'

  const fallback = String(subCategoryRaw || categoryTypeRaw || '').trim()
  return fallback || '기타'
}
