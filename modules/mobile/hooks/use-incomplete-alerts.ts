import { useState, useCallback, useEffect } from 'react'

interface WorkLogData {
  site?: string
  workDate?: string
  workContent?: string
  memberType?: string[]
  workType?: string[]
  laborHours?: number
  materials?: any[]
  photos?: any[]
  notes?: string
}

interface ValidationResult {
  isValid: boolean
  missingFields: string[]
  warnings: string[]
}

interface WorkSummary {
  site: string
  date: string
  totalHours: number
  tasksCount: number
}

export const useIncompleteAlerts = () => {
  const [showUncompletedAlert, setShowUncompletedAlert] = useState(false)
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState(false)
  const [showWorkCompleteAlert, setShowWorkCompleteAlert] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [workSummary, setWorkSummary] = useState<WorkSummary | null>(null)

  // Validate work log data
  const validateWorkLog = useCallback((data: WorkLogData): ValidationResult => {
    const required = ['site', 'workDate', 'workContent', 'laborHours']
    const optional = ['memberType', 'workType', 'materials', 'photos']
    
    const missing: string[] = []
    const warnings: string[] = []

    // Check required fields
    required.forEach(field => {
      const value = data[field as keyof WorkLogData]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missing.push(field)
      }
    })

    // Check optional but recommended fields
    optional.forEach(field => {
      const value = data[field as keyof WorkLogData]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        warnings.push(field)
      }
    })

    return {
      isValid: missing.length === 0,
      missingFields: missing,
      warnings,
    }
  }, [])

  // Show appropriate alert based on validation
  const checkAndShowAlert = useCallback((data: WorkLogData, onSave?: () => void) => {
    const validation = validateWorkLog(data)

    if (!validation.isValid) {
      // Show missing fields alert
      setMissingFields(validation.missingFields)
      setShowMissingFieldsAlert(true)
      return false
    }

    if (validation.warnings.length > 0) {
      // Show uncompleted alert (has warnings but not required)
      setShowUncompletedAlert(true)
      return false
    }

    // All good, show completion confirmation
    const summary: WorkSummary = {
      site: data.site || '',
      date: data.workDate || '',
      totalHours: data.laborHours || 0,
      tasksCount: (data.workContent ? 1 : 0) + (data.materials?.length || 0),
    }
    
    setWorkSummary(summary)
    setShowWorkCompleteAlert(true)
    return true
  }, [validateWorkLog])

  // Save incomplete work log to local storage
  const saveIncompleteWorkLog = useCallback((data: WorkLogData) => {
    try {
      const incompleteData = {
        ...data,
        savedAt: new Date().toISOString(),
        isIncomplete: true,
      }
      
      localStorage.setItem('incomplete_work_log', JSON.stringify(incompleteData))
      
      // Show toast notification
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: '미완성 작업일지가 저장되었습니다',
            type: 'info',
          }
        }))
      }
      
      return true
    } catch (error) {
      console.error('Failed to save incomplete work log:', error)
      return false
    }
  }, [])

  // Load incomplete work log from local storage
  const loadIncompleteWorkLog = useCallback((): WorkLogData | null => {
    try {
      const saved = localStorage.getItem('incomplete_work_log')
      if (saved) {
        const data = JSON.parse(saved)
        // Check if saved within last 24 hours
        const savedAt = new Date(data.savedAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          return data
        } else {
          // Remove expired data
          localStorage.removeItem('incomplete_work_log')
        }
      }
      return null
    } catch (error) {
      console.error('Failed to load incomplete work log:', error)
      return null
    }
  }, [])

  // Clear saved incomplete work log
  const clearIncompleteWorkLog = useCallback(() => {
    localStorage.removeItem('incomplete_work_log')
  }, [])

  // Check for incomplete work log on mount
  useEffect(() => {
    const incomplete = loadIncompleteWorkLog()
    if (incomplete) {
      // Show notification about incomplete work log
      setTimeout(() => {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('show-incomplete-notification', {
            detail: {
              data: incomplete,
              savedAt: incomplete.savedAt,
            }
          }))
        }
      }, 1000)
    }
  }, [loadIncompleteWorkLog])

  // Alert handlers
  const handleUncompletedComplete = useCallback(() => {
    setShowUncompletedAlert(false)
  }, [])

  const handleUncompletedSave = useCallback((data: WorkLogData) => {
    saveIncompleteWorkLog(data)
    setShowUncompletedAlert(false)
  }, [saveIncompleteWorkLog])

  const handleMissingFieldsComplete = useCallback(() => {
    setShowMissingFieldsAlert(false)
  }, [])

  const handleWorkCompleteConfirm = useCallback((onConfirm?: () => void) => {
    clearIncompleteWorkLog()
    setShowWorkCompleteAlert(false)
    if (onConfirm) onConfirm()
  }, [clearIncompleteWorkLog])

  const closeAllAlerts = useCallback(() => {
    setShowUncompletedAlert(false)
    setShowMissingFieldsAlert(false)
    setShowWorkCompleteAlert(false)
  }, [])

  return {
    // Alert states
    showUncompletedAlert,
    showMissingFieldsAlert, 
    showWorkCompleteAlert,
    missingFields,
    workSummary,

    // Functions
    validateWorkLog,
    checkAndShowAlert,
    saveIncompleteWorkLog,
    loadIncompleteWorkLog,
    clearIncompleteWorkLog,

    // Alert handlers
    handleUncompletedComplete,
    handleUncompletedSave,
    handleMissingFieldsComplete,
    handleWorkCompleteConfirm,
    closeAllAlerts,

    // Manual alert triggers
    setShowUncompletedAlert,
    setShowMissingFieldsAlert,
    setShowWorkCompleteAlert,
  }
}