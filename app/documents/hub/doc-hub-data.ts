export type DocStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'open'
  | 'ing'
  | 'done'
  | 'not_submitted'

export interface MyDoc {
  id: string
  typeId?: string // Link to required_document_types
  title: string
  desc: string
  status: DocStatus
  date: string
  endDate?: string
  author: string // Uploader or worker name
  fileName: string // Actual file name
  hasFile: boolean
  fileUrl?: string // For preview
}

export interface CompanyDoc {
  id: string
  title: string
  category: string
  date: string
  author: string
  fileName: string
  fileType: string
  fileSize: string
  url?: string
}

export interface DrawingItem {
  id: string
  title: string
  type: string
  source: 'file' | 'markup'
  date: string
  url: string
  originalUrl?: string
  markupData?: any[]
  markupId?: string
}

export interface DrawingWorklog {
  id: string
  siteId: string
  siteName: string
  type: string
  date: string
  desc: string
  author: string
  status: DocStatus
  drawings: DrawingItem[]
}

export interface PhotoItem {
  id: string
  url: string
  type?: 'before' | 'after' | 'ref' | 'ing'
  caption?: string
  tags?: string[]
  date: string
  // For UI state
  currentView?: 'before' | 'after'
  url_before?: string
  url_after?: string
  // For modify actions
  source?: 'doc_attach' | 'add_photo' | 'daily_report'
  ref?: string // row ID (UUID) or file path
  reportId?: string
}

export interface PhotoGroup {
  id: string
  title: string
  contractor: string
  affiliation: string
  author: string
  date: string
  time?: string
  status?: string // Added for Filter
  desc?: string
  photos: PhotoItem[]
  files?: PhotoItem[] // Alias for compatibility with shared logic if needed
}

export interface PunchItem {
  id: string
  issue: string
  priority: '높음' | '중간' | '낮음'
  status: 'open' | 'done'
  check: string
  date: string
  author: string
}

export interface PunchGroup {
  id: string
  title: string
  contractor: string
  affiliation: string
  author: string
  date: string
  punchItems: PunchItem[]
  // Extended for UI logic
  thumbUrl?: string
}

// MOCK_DOCS removed - using real data from actions.ts

export const formatDateShort = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-'
  // dateStr format: YYYY.MM.DD or YYYY-MM-DD
  // returns YY.MM.DD
  const date = new Date(dateStr.replace(/\./g, '-'))
  if (isNaN(date.getTime())) return dateStr

  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

export function getStatusText(status: DocStatus) {
  const statusMap: Record<string, string> = {
    open: '제출',
    ing: '제출',
    done: '승인',
    pending: '심사중',
    approved: '승인됨',
    rejected: '반려됨',
    not_submitted: '미제출',
  }
  return statusMap[status] || status
}

export const FILTERS = {
  'my-docs': ['전체', '승인완료', '심사중', '반려됨', '미제출'],
  'company-docs': [],
  drawings: [],
  photos: [],
  punch: ['전체', '전기', '설비', '건축', '소방', '통신'],
}
