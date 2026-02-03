export const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true
  const str = String(value).trim()
  if (!str) return true
  const lowered = str.toLowerCase()
  return lowered === 'null' || lowered === 'undefined' || str === '-'
}

export const formatMemberTypes = (row: any) => {
  if (Array.isArray(row?.member_types)) {
    const filtered = row.member_types
      .map((item: unknown) => (typeof item === 'string' ? item.trim() : String(item ?? '')))
      .filter(item => !isBlankValue(item))
    if (filtered.length > 0) return filtered.join(', ')
  }
  if (!isBlankValue(row?.component_name)) return String(row.component_name).trim()
  return ''
}

export const formatProcessName = (row: any) => {
  if (!isBlankValue(row?.work_process)) return String(row.work_process).trim()
  if (!isBlankValue(row?.process_type)) return String(row.process_type).trim()
  return ''
}

export const formatSectionName = (row: any) => {
  if (!isBlankValue(row?.work_section)) return String(row.work_section).trim()
  return ''
}

export const isLikelyUuid = (value: unknown) => {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export const resolveAuthorLabel = (row: any) => {
  const profile =
    row?.profiles ||
    row?.created_by_profile ||
    row?.submitted_by_profile ||
    row?.submitted_by_profile?.profiles ||
    null

  const nameCandidate =
    (typeof profile?.full_name === 'string' ? profile.full_name : '') ||
    (typeof profile?.name === 'string' ? profile.name : '') ||
    (typeof profile?.display_name === 'string' ? profile.display_name : '')

  const trimmedName = String(nameCandidate || '').trim()
  if (trimmedName) return trimmedName

  const email = typeof profile?.email === 'string' ? profile.email.trim() : ''
  if (email) return email.split('@')[0] || email

  const createdBy = typeof row?.created_by === 'string' ? row.created_by.trim() : ''
  if (createdBy && isLikelyUuid(createdBy)) return `사용자(${createdBy.slice(0, 8)})`

  return '-'
}

export const formatManhours = (v: unknown): string => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}

export const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: '임시', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: '제출', className: 'bg-sky-100 text-sky-700' },
  approved: { label: '승인', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '반려', className: 'bg-rose-100 text-rose-700' },
}
