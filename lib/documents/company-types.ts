export type CompanyDocumentType = {
  id?: string
  slug: string
  name: string
  description?: string | null
  display_order: number
  is_required: boolean
  is_active: boolean
  default_visibility?: string | null
}

export type CompanyDocumentTypeMap = Record<string, CompanyDocumentType>

export const COMPANY_DOC_SLUG_REGEX = /^[a-z0-9_-]{2,64}$/

export const DEFAULT_COMPANY_DOCUMENT_TYPES: CompanyDocumentType[] = [
  {
    slug: 'biz_reg',
    name: '사업자등록증',
    description: '본사 사업자등록증 최신본',
    display_order: 10,
    is_required: true,
    is_active: true,
    default_visibility: 'shared',
  },
  {
    slug: 'bankbook',
    name: '통장사본',
    description: '정산 계좌 통장사본',
    display_order: 20,
    is_required: true,
    is_active: true,
    default_visibility: 'shared',
  },
  {
    slug: 'npc1000_form',
    name: 'NPC-1000 승인확인서(양식)',
    description: 'NPC-1000 발주용 기본 양식',
    display_order: 30,
    is_required: false,
    is_active: true,
    default_visibility: 'shared',
  },
  {
    slug: 'completion_form',
    name: '작업완료확인서(양식)',
    description: '작업 완료 보고용 양식',
    display_order: 40,
    is_required: false,
    is_active: true,
    default_visibility: 'shared',
  },
]

const LEGACY_TYPE_ALIASES: Record<string, string> = {
  company_biz_reg: 'biz_reg',
  company_bankbook: 'bankbook',
}

const sanitizeSlug = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!COMPANY_DOC_SLUG_REGEX.test(normalized)) return null
  return normalized
}

export const buildCompanyDocTypeMap = (
  list: Iterable<CompanyDocumentType>
): CompanyDocumentTypeMap => {
  const map: CompanyDocumentTypeMap = {}
  Array.from(list).forEach(item => {
    const slug = sanitizeSlug(item?.slug) || ''
    if (!slug) return
    map[slug] = {
      ...item,
      slug,
      name: item?.name?.trim() || slug,
      description: item?.description ?? null,
      display_order: Number.isFinite(item?.display_order) ? item.display_order : 100,
      is_required: Boolean(item?.is_required),
      is_active: item?.is_active !== false,
      default_visibility: item?.default_visibility ?? 'shared',
    }
  })
  return map
}

export const normalizeCompanyDocumentTypes = (
  input: unknown,
  fallback: CompanyDocumentType[] = DEFAULT_COMPANY_DOCUMENT_TYPES
): CompanyDocumentType[] => {
  if (!Array.isArray(input)) return fallback
  const normalized: CompanyDocumentType[] = input
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const slug = sanitizeSlug((item as { slug?: unknown }).slug) || null
      const nameRaw = (item as { name?: unknown }).name
      const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
      if (!slug || !name) return null
      return {
        id:
          typeof (item as { id?: unknown }).id === 'string'
            ? (item as { id: string }).id
            : undefined,
        slug,
        name,
        description:
          typeof (item as { description?: unknown }).description === 'string'
            ? (item as { description: string }).description
            : null,
        display_order:
          typeof (item as { display_order?: unknown }).display_order === 'number'
            ? (item as { display_order: number }).display_order
            : 100,
        is_required: Boolean((item as { is_required?: unknown }).is_required),
        is_active: (item as { is_active?: unknown }).is_active !== false,
        default_visibility:
          typeof (item as { default_visibility?: unknown }).default_visibility === 'string'
            ? (item as { default_visibility: string }).default_visibility
            : 'shared',
        documents: Array.isArray((item as any).documents) ? (item as any).documents : undefined,
      }
    })
    .filter(Boolean) as CompanyDocumentType[]

  return normalized.length ? normalized : fallback
}

const extractCompanySlugFromTags = (tags?: unknown): string | null => {
  if (!Array.isArray(tags)) return null
  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    if (!tag.startsWith('company_slug:')) continue
    const [, raw] = tag.split(':')
    const slug = sanitizeSlug(raw)
    if (slug) return slug
  }
  return null
}

const extractSlugFromDescription = (description?: unknown): string | null => {
  if (typeof description !== 'string') return null
  const match = description.match(/company_slug:([a-zA-Z0-9_-]+)/)
  if (!match) return null
  return sanitizeSlug(match[1])
}

export type CompanyDocLike = {
  tags?: string[] | null
  metadata?: Record<string, any> | null
  description?: string | null
  document_type?: string | null
  documentType?: string | null
}

export const detectCompanyDocSlug = (
  doc: CompanyDocLike | null | undefined,
  options?: { fallbackSlug?: string }
): string | null => {
  if (!doc) return options?.fallbackSlug ?? null
  const tagSlug = extractCompanySlugFromTags(doc.tags)
  if (tagSlug) return tagSlug

  const metadataSlug =
    doc.metadata?.company_slug ||
    doc.metadata?.companySlug ||
    doc.metadata?.slug ||
    doc.metadata?.company_type ||
    null
  const metaSanitized = sanitizeSlug(metadataSlug)
  if (metaSanitized) return metaSanitized

  const descSlug = extractSlugFromDescription(doc.description)
  if (descSlug) return descSlug

  const docTypeRaw = (doc.document_type || doc.documentType || '').toLowerCase()
  const aliasSlug = LEGACY_TYPE_ALIASES[docTypeRaw]
  if (aliasSlug) return aliasSlug
  return sanitizeSlug(docTypeRaw) ?? options?.fallbackSlug ?? null
}

export const resolveCompanyDocLabel = (
  doc: CompanyDocLike | null | undefined,
  map: CompanyDocumentTypeMap = buildCompanyDocTypeMap(DEFAULT_COMPANY_DOCUMENT_TYPES)
): string => {
  if (!doc) return '회사 문서'
  const slug = detectCompanyDocSlug(doc)
  if (slug && map[slug]?.name) return map[slug].name
  return (
    doc?.metadata?.display_name ||
    doc?.metadata?.title ||
    doc?.description ||
    doc?.document_type ||
    doc?.documentType ||
    '회사 문서'
  )
}
