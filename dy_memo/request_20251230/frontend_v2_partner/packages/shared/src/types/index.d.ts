export interface ManpowerItem {
  id: number
  worker: string
  workHours: number
  isCustom: boolean
  locked: boolean
}
export interface WorkSet {
  id: number
  member: string
  process: string
  type: string
  location: {
    block: string
    dong: string
    floor: string
  }
  isCustomMember: boolean
  isCustomProcess: boolean
  customMemberValue: string
  customProcessValue: string
  customTypeValue: string
}
export interface MaterialItem {
  id: number
  name: string
  qty: number
}
export interface PhotoData {
  img: string
  member: string
  process: string
  desc: string
}
export interface DrawingPage {
  id: string
  name: string
  type: string
  bgImage: string
  bgW: number
  bgH: number
  thumbUrl: string
  objects: DrawingObject[]
  camera: {
    x: number
    y: number
    scale: number
  } | null
  dirty: boolean
}
export interface DrawingObject {
  type: 'rect' | 'brush' | 'text' | 'stamp'
  x: number
  y: number
  w?: number
  h?: number
  points?: {
    x: number
    y: number
  }[]
  text?: string
  shape?: string
  stroke: string
  fill?: string
  size: number
}
export type SearchType = 'ALL' | 'SITE' | 'LOG' | 'DOC' | 'PHOTO' | 'DRAWING' | 'EXPENSE'
export interface ContentFlags {
  hasPhoto: boolean
  hasDraw: boolean
  hasDoc: boolean
}
export interface SearchRecord {
  id: string
  type: SearchType
  title: string
  subtitle: string
  meta: string
  flags: ContentFlags
  searchText: string
  score?: number
  timestamp: number
}
export interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (id: string, type: SearchType) => void
}
export type NotificationType = 'alert' | 'info' | 'success'
export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  desc: string
  time: string
  unread: boolean
}
export interface WorkEntry {
  site: string
  man: number
  price: number
}
export interface WorkDataMap {
  [date: string]: WorkEntry[]
}
export interface SalaryHistoryItem {
  rawDate: string
  month: string
  baseTotal: number
  man: number
  price: number
  year: number
  netPay: number
  grossPay: number
  deductions: number
}
export interface DrawingFile {
  name: string
  type: 'img' | 'doc'
  url: string
  createdAt?: string
}
export interface Drawings {
  construction: DrawingFile[]
  progress: DrawingFile[]
  completion: DrawingFile[]
}
export interface PunchItem {
  no: string
  loc: string
  issue: string
  before: string
  after: string
  status: string
}
export interface Punch {
  title: string
  status: string
  list: PunchItem[]
  content: string
}
export interface SiteWorkLog {
  title: string
  status: string
  docNumber: string
  date: string
  weather: string
  temp: string
  workers: {
    total: number
    manager: number
    engineer: number
    worker: number
  }
  materials: {
    name: string
    unit: string
    quantity: number
    note: string
  }[]
  workContent: string
  issues: string
  nextPlan: string
  inspector: string
  safetyOfficer: string
}
export interface PTW {
  title: string
  status: string
  date: string
  company: string
  department: string
  period: string
  location: string
  writer: string
  phone: string
  workType: string
  workContent: string
  teamLeader: string
  equipment: string
  workers: string
  safety: string
  requirements: string
  weather: string
  safetyManagerName: string
  risks: {
    work: string
    risk: string
    level: string
    measure: string
  }[]
}
export interface SiteImage {
  src: string
  member: string
  process: string
  content: string
}
export interface Doc {
  title: string
  status: string
  content: string
}
export interface Site {
  id: number
  pinned: boolean
  status: 'ing' | 'wait' | 'done'
  affil: string
  name: string
  addr: string
  days: number
  mp: number
  manager: string
  safety: string
  phoneM: string
  phoneS: string
  lodge: string
  note: string
  lastDate: string
  lastTime: string
  drawings: Drawings
  ptw: PTW | null
  workLog: SiteWorkLog | null
  doc: Doc | null
  punch: Punch | null
  images: SiteImage[]
  isLocal: boolean
}
export type FilterStatus = 'all' | 'ing' | 'wait' | 'done'
export type SortOption = 'latest' | 'name'
export type LogStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export interface Manpower {
  role: string
  val: number
  worker?: string
}
export interface Material {
  type: 'HQ' | 'Worker'
  name: string
  qty: string
  receipt?: string
}
export interface MediaFile {
  id: number
  url: string
  tag: string
}
export interface ConfirmationFile {
  name: string
  size: number
  url: string
  type: string
  uploadedAt: string
}
export interface WorkLog {
  id: number
  site: string
  siteId: string
  date: string
  updatedAt?: string
  status: LogStatus
  affiliation: string
  member: string
  process: string
  type?: string
  location?: string
  manpower: Manpower[]
  materials: Material[]
  missing?: string[]
  rejectReason?: string
  photos: MediaFile[]
  drawings: MediaFile[]
  confirmationFiles: ConfirmationFile[]
  isDirect?: boolean
  isPinned?: boolean
}
export type ViewMode = 'dashboard' | 'timeline'
export type TabType = 'my-docs' | 'company-docs' | 'drawings' | 'photos' | 'punch'
export type FileType = 'img' | 'file'
export type ViewType = 'before' | 'after'
export type DrawingState = 'base' | 'ing' | 'done'
export type PunchStatus = 'open' | 'done' | 'ing'
export interface FileItem {
  id: string
  name: string
  type: FileType
  url: string
  url_before?: string
  url_after?: string
  size: string
  ext: string
  currentView?: ViewType
  drawingState?: DrawingState
}
export interface PunchData {
  location: string
  issue: string
  priority: '높음' | '중간' | '낮음'
  status: PunchStatus
  assignee: string
  dueDate: string
}
export interface DocumentGroup {
  id: string
  title: string
  author: string
  date: string
  time: string
  files: FileItem[]
  hasLogData?: boolean
  punchData?: PunchData
}
declare global {
  interface Window {
    html2canvas: any
    jspdf: any
  }
}
//# sourceMappingURL=index.d.ts.map
