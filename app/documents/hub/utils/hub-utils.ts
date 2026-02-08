import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateShort(dateStr: string | undefined | null) {
  if (!dateStr || dateStr === '-') return '-'
  try {
    const date = new Date(dateStr.replace(/\./g, '-'))
    if (isNaN(date.getTime())) return dateStr

    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yy}.${mm}.${dd}`
  } catch {
    return dateStr
  }
}

export function getStatusText(status: string | undefined | null) {
  const map: Record<string, string> = {
    open: '제출',
    ing: '제출',
    done: '승인',
    pending: '심사중',
    approved: '승인',
    rejected: '반려',
    returned: '반려',
    not_submitted: '미제출',
    submitted: '제출',
  }
  return map[status || ''] || status || '미정'
}

export function getStatusColor(status: string | undefined | null) {
  switch (status) {
    case 'approved':
    case 'done':
      return 'bg-slate-100 text-slate-500 border-slate-200'
    case 'rejected':
    case 'returned':
      return 'bg-red-50 text-red-500 border-red-100'
    default: // submitted, pending, open, etc.
      return 'bg-blue-50 text-blue-500 border-blue-100'
  }
}

export function buildWorkDescription(report: any): string {
  const parts: string[] = []

  // 1. Component (부재명) - Fallback to member_name if component is empty (as per user request)
  // Logic aligned with user feedback: member_name field often contains component name in some datasets
  let cName =
    report.component_name || report.componentName || report.component_type || report.componentType

  if (!cName && report.member_name) {
    // If explicit component name is missing, use member_name as fallback
    cName = report.member_name
  }

  if (cName && String(cName).trim()) parts.push(String(cName).trim())

  // 2. Process (작업공정)
  const pType =
    report.work_process || report.workProcess || report.process_type || report.processType
  if (pType && String(pType).trim()) parts.push(String(pType).trim())

  // 3. Section (작업위치/유형)
  const wSection = report.work_section || report.workSection
  if (wSection && String(wSection).trim()) parts.push(String(wSection).trim())

  // B. Fallback to parsed work_content JSON if flat columns failed
  if (parts.length === 0) {
    try {
      let raw = report.work_content
      // If raw is already an object, use it directly
      let parsed = typeof raw === 'object' ? raw : null

      // If raw is string, try to parse
      if (!parsed && typeof raw === 'string') {
        const trimmed = raw.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            parsed = JSON.parse(trimmed)
          } catch {
            /* ignore */
          }
        } else if (trimmed) {
          // It's a plain string description
          parts.push(trimmed)
        }
      }

      if (parsed) {
        if (Array.isArray(parsed.tasks)) {
          parsed.tasks.forEach((t: any) => {
            if (t.component_type) parts.push(String(t.component_type))
            if (t.content || t.process_type) parts.push(String(t.content || t.process_type))
            if (t.location || t.work_section) parts.push(String(t.location || t.work_section))
          })
        } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          // maybe it has tasks but not array? or different structure
          // fallback to nothing
        }
      }
    } catch (e) {
      // ignore parse error
    }
  }

  return Array.from(new Set(parts.filter(Boolean))).join(' | ')
}
