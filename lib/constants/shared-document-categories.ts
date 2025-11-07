export type SharedDocumentCategoryOption = {
  value: string
  label: string
  description?: string | null
}

const RESERVED_VALUES = new Set(['all', '__none'])
const MAX_VALUE_LENGTH = 64

function sanitizeSharedCategoryValueRaw(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
  if (normalized.length < 2 || normalized.length > MAX_VALUE_LENGTH) return ''
  if (RESERVED_VALUES.has(normalized)) return ''
  return normalized
}

function slugifySharedCategoryLabel(label: string): string {
  if (typeof label !== 'string') return ''
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!base) return ''
  if (base.length > MAX_VALUE_LENGTH) return base.slice(0, MAX_VALUE_LENGTH)
  return base
}

function ensureLength(value: string): string {
  if (value.length >= 2) return value
  return value.padEnd(2, 'x')
}

function buildCandidate(base: string, suffix: number): string {
  if (suffix === 0) {
    return ensureLength(base.slice(0, MAX_VALUE_LENGTH))
  }
  const suffixText = `_${suffix}`
  const maxBaseLength = Math.max(1, MAX_VALUE_LENGTH - suffixText.length)
  const trimmedBase = base.slice(0, maxBaseLength).replace(/_+$/g, '')
  return ensureLength(`${trimmedBase}${suffixText}`)
}

export function generateSharedCategoryValue(
  label: string,
  usedValues: Iterable<string>,
  preferred?: string
): string {
  const used = new Set(Array.from(usedValues, value => value.toLowerCase()))

  const sanitizedPreferred = sanitizeSharedCategoryValueRaw(preferred)
  if (sanitizedPreferred && !used.has(sanitizedPreferred)) {
    return sanitizedPreferred
  }

  const slugBase = slugifySharedCategoryLabel(label) || 'category'
  let suffix = 0
  while (suffix < 10_000) {
    const candidate = buildCandidate(slugBase, suffix)
    if (!used.has(candidate) && !RESERVED_VALUES.has(candidate)) {
      return candidate
    }
    suffix += 1
  }
  return `category_${Math.random().toString(36).slice(2, 8)}`
}

export const DEFAULT_SHARED_DOCUMENT_CATEGORIES: SharedDocumentCategoryOption[] = [
  { value: 'construction_drawing', label: '공도면' },
  { value: 'progress_drawing', label: '진행도면' },
  { value: 'ptw', label: 'PTW(작업허가서)' },
  { value: 'general', label: '일반' },
  { value: 'notice', label: '공지' },
  { value: 'safety', label: '안전' },
  { value: 'inspection', label: '점검' },
  { value: 'checklist', label: '체크리스트' },
  { value: 'form', label: '양식' },
  { value: 'reference', label: '자료' },
  { value: 'drawing', label: '도면' },
  { value: 'blueprint', label: '도면' },
  { value: 'other', label: '기타' },
]

export function normalizeSharedDocumentCategories(input: unknown): SharedDocumentCategoryOption[] {
  if (!Array.isArray(input)) return DEFAULT_SHARED_DOCUMENT_CATEGORIES

  const normalized: SharedDocumentCategoryOption[] = []
  const usedValues: string[] = []

  input.forEach(item => {
    if (!item || typeof item !== 'object') return
    const labelRaw = (item as { label?: unknown }).label
    if (typeof labelRaw !== 'string') return
    const label = labelRaw.trim()
    if (!label) return

    const preferredValue =
      typeof (item as { value?: unknown }).value === 'string'
        ? ((item as { value: string }).value as string)
        : undefined

    const value = generateSharedCategoryValue(label, usedValues, preferredValue)
    usedValues.push(value)

    normalized.push({
      value,
      label,
      description:
        typeof (item as { description?: unknown }).description === 'string'
          ? (item as { description: string }).description.trim() || null
          : null,
    })
  })

  return normalized.length > 0 ? normalized : DEFAULT_SHARED_DOCUMENT_CATEGORIES
}

export function buildSharedCategoryMap(
  categories: SharedDocumentCategoryOption[]
): Record<string, string> {
  return categories.reduce(
    (acc, option) => {
      acc[option.value] = option.label
      return acc
    },
    {} as Record<string, string>
  )
}
