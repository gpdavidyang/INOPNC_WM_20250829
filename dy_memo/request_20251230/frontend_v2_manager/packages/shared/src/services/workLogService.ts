import { WorkLog, LogStatus } from '../types'

export interface WorkLogFilter {
  siteId?: string
  status?: LogStatus | 'all'
  month?: string
  searchQuery?: string
  sortOrder?: 'latest' | 'name' | 'pinned'
}

export interface WorkLogStats {
  total: number
  approved: number
  pending: number
  draft: number
  rejected: number
}

class WorkLogService {
  private static instance: WorkLogService
  private storageKey = 'inopnc_worklogs'
  private logs: WorkLog[] = []

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): WorkLogService {
    if (!WorkLogService.instance) {
      WorkLogService.instance = new WorkLogService()
    }
    return WorkLogService.instance
  }

  // Load logs from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.logs = JSON.parse(stored)
      } else {
        // Initialize with mock data if empty
        this.logs = this.getMockData()
        this.saveToStorage()
      }
    } catch (error) {
      console.error('Failed to load work logs:', error)
      this.logs = this.getMockData()
    }
  }

  // Save logs to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (error) {
      console.error('Failed to save work logs:', error)
    }
  }

  // Get all logs
  getAllLogs(): WorkLog[] {
    return [...this.logs]
  }

  // Get logs with filtering
  getFilteredLogs(filter: WorkLogFilter = {}): WorkLog[] {
    let result = [...this.logs]

    // Filter by site
    if (filter.siteId && filter.siteId !== 'all') {
      result = result.filter(log => log.siteId === filter.siteId)
    }

    // Filter by status
    if (filter.status && filter.status !== 'all') {
      result = result.filter(log => log.status === filter.status)
    }

    // Filter by month
    if (filter.month) {
      result = result.filter(log => log.date && log.date.startsWith(filter.month!))
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      result = result.filter(
        log =>
          log.site.toLowerCase().includes(query) ||
          log.process.toLowerCase().includes(query) ||
          log.member.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (filter.sortOrder) {
      case 'name':
        result.sort((a, b) => a.site.localeCompare(b.site))
        break
      case 'pinned':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          return b.id - a.id
        })
        break
      case 'latest':
      default:
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          return b.id - a.id
        })
        break
    }

    return result
  }

  // Get log by ID
  getLogById(id: number): WorkLog | null {
    return this.logs.find(log => log.id === id) || null
  }

  // Create new log
  createLog(logData: Omit<WorkLog, 'id' | 'updatedAt'>): WorkLog {
    const newLog: WorkLog = {
      ...logData,
      id: Date.now(),
      updatedAt: new Date().toISOString(),
    }

    this.logs.unshift(newLog)
    this.saveToStorage()
    return newLog
  }

  // Update log
  updateLog(id: number, updates: Partial<WorkLog>): WorkLog | null {
    const index = this.logs.findIndex(log => log.id === id)
    if (index === -1) return null

    this.logs[index] = {
      ...this.logs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveToStorage()
    return this.logs[index]
  }

  // Delete log
  deleteLog(id: number): boolean {
    const index = this.logs.findIndex(log => log.id === id)
    if (index === -1) return false

    this.logs.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Delete multiple logs
  deleteLogs(ids: number[]): number {
    const initialLength = this.logs.length
    this.logs = this.logs.filter(log => !ids.includes(log.id))
    const deletedCount = initialLength - this.logs.length

    if (deletedCount > 0) {
      this.saveToStorage()
    }

    return deletedCount
  }

  // Toggle pin status
  togglePin(id: number): WorkLog | null {
    const log = this.getLogById(id)
    if (!log) return null

    return this.updateLog(id, { isPinned: !log.isPinned })
  }

  // Update status
  updateStatus(id: number, status: LogStatus, rejectReason?: string): WorkLog | null {
    const updates: Partial<WorkLog> = { status }
    if (rejectReason) {
      updates.rejectReason = rejectReason
    }

    return this.updateLog(id, updates)
  }

  // Get statistics
  getStats(): WorkLogStats {
    const stats: WorkLogStats = {
      total: this.logs.length,
      approved: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
    }

    this.logs.forEach(log => {
      switch (log.status) {
        case 'approved':
          stats.approved++
          break
        case 'pending':
          stats.pending++
          break
        case 'draft':
          stats.draft++
          break
        case 'rejected':
          stats.rejected++
          break
      }
    })

    return stats
  }

  // Get unique sites from logs
  getUniqueSites(): Array<{ id: string; name: string; dept: string }> {
    const sitesMap = new Map<string, { id: string; name: string; dept: string }>()

    this.logs.forEach(log => {
      if (!sitesMap.has(log.siteId)) {
        sitesMap.set(log.siteId, {
          id: log.siteId,
          name: log.site,
          dept: log.affiliation,
        })
      }
    })

    return Array.from(sitesMap.values())
  }

  // Duplicate log with today's date
  duplicateLog(id: number): WorkLog | null {
    const originalLog = this.getLogById(id)
    if (!originalLog) return null

    const today = new Date().toISOString().split('T')[0]
    const duplicatedLog: Omit<WorkLog, 'id' | 'updatedAt'> = {
      ...originalLog,
      date: today,
      status: 'draft',
      isPinned: false,
      rejectReason: undefined,
    }

    return this.createLog(duplicatedLog)
  }

  // Mock data for initialization
  private getMockData(): WorkLog[] {
    return [
      {
        id: 1,
        site: '인천국제공항 T2',
        siteId: 'site1',
        date: '2024-12-20',
        updatedAt: '2024-12-20T10:00:00',
        status: 'approved',
        affiliation: '항공공사',
        member: '슬라브',
        process: '균열',
        type: '지상',
        location: '블럭 A-동 3층',
        manpower: [{ role: '작업자', val: 1, worker: '이현수' }],
        materials: [],
        missing: [],
        rejectReason: undefined,
        photos: [],
        drawings: [],
        confirmationFiles: [],
        isDirect: false,
        isPinned: true,
      },
      {
        id: 2,
        site: '김포공항 여객터미널',
        siteId: 'site2',
        date: '2024-12-21',
        updatedAt: '2024-12-21T14:30:00',
        status: 'pending',
        affiliation: '공항운영',
        member: '거더',
        process: '면',
        type: '지상',
        location: '블럭 B-동 2층',
        manpower: [
          { role: '작업자', val: 1, worker: '김철수' },
          { role: '작업자', val: 1, worker: '박영희' },
        ],
        materials: [{ type: 'HQ', name: '보수재료', qty: '10kg' }],
        missing: [],
        rejectReason: undefined,
        photos: [],
        drawings: [],
        confirmationFiles: [],
        isDirect: false,
        isPinned: false,
      },
    ]
  }

  // Clear all logs (for testing/reset)
  clearAllLogs(): void {
    this.logs = []
    this.saveToStorage()
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Import logs from JSON
  importLogs(jsonData: string): { success: number; failed: number } {
    try {
      const importedLogs = JSON.parse(jsonData) as WorkLog[]
      let success = 0
      let failed = 0

      importedLogs.forEach(log => {
        if (this.validateLog(log)) {
          // Generate new ID to avoid conflicts
          const newLog = { ...log, id: Date.now() + Math.random() }
          this.logs.push(newLog)
          success++
        } else {
          failed++
        }
      })

      if (success > 0) {
        this.saveToStorage()
      }

      return { success, failed }
    } catch (error) {
      console.error('Failed to import logs:', error)
      return { success: 0, failed: 0 }
    }
  }

  // Validate log structure
  private validateLog(log: any): log is WorkLog {
    return (
      log &&
      typeof log.id === 'number' &&
      typeof log.site === 'string' &&
      typeof log.siteId === 'string' &&
      typeof log.date === 'string' &&
      typeof log.status === 'string' &&
      Array.isArray(log.manpower) &&
      Array.isArray(log.materials)
    )
  }

  // Check for missing required fields
  checkMissingFields(log: WorkLog): string[] {
    const missing: string[] = []

    // Check required fields
    if (!log.site || log.site.trim() === '') missing.push('현장명')
    if (!log.affiliation || log.affiliation.trim() === '') missing.push('소속')
    if (!log.member || log.member.trim() === '') missing.push('작업자')
    if (!log.process || log.process.trim() === '') missing.push('공종')

    // Check manpower
    if (!log.manpower || log.manpower.length === 0) {
      missing.push('인력')
    } else {
      // Check if any manpower entry is incomplete
      const hasInvalidManpower = log.manpower.some(
        m => !m.worker || m.worker.trim() === '' || typeof m.val !== 'number' || m.val <= 0
      )
      if (hasInvalidManpower) missing.push('인력 정보')
    }

    // Check materials
    if (!log.materials || log.materials.length === 0) {
      missing.push('자재')
    } else {
      // Check if any material entry is incomplete
      const hasInvalidMaterial = log.materials.some(
        m => !m.name || m.name.trim() === '' || !m.qty || m.qty.trim() === ''
      )
      if (hasInvalidMaterial) missing.push('자재 정보')
    }

    // Check photos
    if (!log.photos || log.photos.length === 0) {
      missing.push('사진')
    }

    return missing
  }

  // Update log with missing fields
  updateLogWithMissingFields(id: number): WorkLog | null {
    const log = this.getLogById(id)
    if (!log) return null

    const missing = this.checkMissingFields(log)
    const updatedLog = { ...log, missing }

    // Update the log in storage
    this.updateLog(id, { missing })

    return updatedLog
  }

  // Check all logs and update missing fields
  checkAllLogsForMissingFields(): void {
    this.logs.forEach(log => {
      const missing = this.checkMissingFields(log)
      if (JSON.stringify(log.missing) !== JSON.stringify(missing)) {
        this.updateLog(log.id, { missing })
      }
    })
  }
}

export const workLogService = WorkLogService.getInstance()
