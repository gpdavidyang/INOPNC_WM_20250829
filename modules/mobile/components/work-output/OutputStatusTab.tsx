'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Filter, Calendar } from 'lucide-react'
import CalendarView from './CalendarView'
import SiteFilter from './SiteFilter'
import MonthlyStats from './MonthlyStats'

interface WorkLog {
  date: string
  siteId: string
  siteName: string
  workHours: number
  isPublicService: boolean
  status: 'completed' | 'pending' | 'approved'
}

// localStorage keys
const STORAGE_KEYS = {
  WORK_LOGS: 'inopnc_work_logs',
  SELECTED_SITE: 'inopnc_selected_site',
  CURRENT_DATE: 'inopnc_current_date',
  ADMIN_BASE_PAY: 'adminBasePay',
}

export default function OutputStatusTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(false)

  // Load saved data from localStorage on mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Load saved site selection
        const savedSite = localStorage.getItem(STORAGE_KEYS.SELECTED_SITE)
        if (savedSite) {
          setSelectedSite(savedSite)
        }

        // Load saved date
        const savedDate = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE)
        if (savedDate) {
          setCurrentDate(new Date(savedDate))
        }

        // Load saved work logs
        const savedLogs = localStorage.getItem(STORAGE_KEYS.WORK_LOGS)
        if (savedLogs) {
          setWorkLogs(JSON.parse(savedLogs))
        }
      } catch (error) {
        console.error('Failed to load saved data:', error)
      }
    }

    loadSavedData()
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SITE, selectedSite)
  }, [selectedSite])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, currentDate.toISOString())
  }, [currentDate])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(workLogs))
  }, [workLogs])

  useEffect(() => {
    fetchWorkLogs()
  }, [currentDate, selectedSite])

  const fetchWorkLogs = async () => {
    setLoading(true)
    try {
      // Get current user info
      const userResponse = await fetch('/api/auth/user')
      const userData = await userResponse.json()

      if (!userData?.user?.id) {
        console.error('User not authenticated')
        return
      }

      // Fetch work logs from admin/salary/worker-calendar API
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const response = await fetch(
        `/api/admin/salary/worker-calendar?worker_id=${userData.user.id}&year=${year}&month=${month}`
      )
      const result = await response.json()

      if (result.success && result.data) {
        // Transform API data to WorkLog format
        const transformedLogs: WorkLog[] = result.data.map((item: any) => ({
          date: item.date,
          siteId: item.site_id || 'site1',
          siteName: item.site_name || '현장',
          workHours: item.work_hours || item.labor_hours || 8,
          isPublicService: item.is_public_service || false,
          status: item.status || 'completed',
        }))

        setWorkLogs(transformedLogs)

        // Save to localStorage for persistence
        localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(transformedLogs))
      } else {
        // Fallback to localStorage data if API fails
        const savedLogs = localStorage.getItem(STORAGE_KEYS.WORK_LOGS)
        if (savedLogs) {
          setWorkLogs(JSON.parse(savedLogs))
        }
      }
    } catch (error) {
      console.error('Failed to fetch work logs:', error)

      // Fallback to localStorage data on error
      const savedLogs = localStorage.getItem(STORAGE_KEYS.WORK_LOGS)
      if (savedLogs) {
        setWorkLogs(JSON.parse(savedLogs))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return (
      currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth()
    )
  }

  return (
    <div className="space-y-4">
      {/* Month navigation and site filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {!isCurrentMonth() && (
            <button
              onClick={handleToday}
              className="ml-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
              aria-label="Go to today"
            >
              <Calendar className="w-4 h-4" />
              오늘
            </button>
          )}
        </div>

        <SiteFilter selectedSite={selectedSite} onSiteChange={setSelectedSite} />
      </div>

      {/* Calendar view */}
      <CalendarView currentDate={currentDate} workLogs={workLogs} loading={loading} />

      {/* Monthly statistics */}
      <MonthlyStats workLogs={workLogs} />
    </div>
  )
}
