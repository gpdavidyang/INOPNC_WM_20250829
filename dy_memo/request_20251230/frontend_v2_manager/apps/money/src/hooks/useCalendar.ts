import React, { useState, useMemo } from 'react'
import { WorkDataMap, WorkEntry } from '@inopnc/shared'

export interface CalendarCell {
  type: 'empty' | 'date'
  key: string
  day?: number
  content?: React.ReactNode
  isToday?: boolean
}

export interface CalendarStats {
  totalSites: number
  totalMan: number
  workedDaysCount: number
}

export const useCalendar = (workData: WorkDataMap, filterSite: string, localSearch: string) => {
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)

  // Calendar Navigation
  const handleMonthChange = (delta: number) => {
    let nextMonth = currentMonth + delta
    let nextYear = currentYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    }
    if (nextMonth < 1) {
      nextMonth = 12
      nextYear--
    }
    setCurrentMonth(nextMonth)
    setCurrentYear(nextYear)
  }

  // Calendar Cells Generation
  const getCalendarCells = (): { cells: CalendarCell[]; stats: CalendarStats } => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const lastDate = new Date(currentYear, currentMonth, 0).getDate()
    const cells: CalendarCell[] = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` })
    }

    // Date cells
    let totalSites = 0
    let totalMan = 0
    let workedDaysCount = 0

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      const dayEntries = workData[dateStr] || []

      // Filter logic
      const filteredEntries = dayEntries.filter(entry => {
        const matchSite = filterSite === '' || entry.site === filterSite
        const matchSearch =
          localSearch === '' || entry.site.toLowerCase().includes(localSearch.toLowerCase())
        return matchSite && matchSearch
      })

      let dayTotalAmt = 0
      let dayTotalMan = 0
      let displayContent = null

      if (filteredEntries.length > 0) {
        filteredEntries.forEach(e => {
          dayTotalAmt += e.price
          dayTotalMan += e.man
        })

        // Site Name Summary (Shorten)
        const baseName = filteredEntries[0].site.replace(/\s+/g, '')
        const shortName = baseName.slice(0, 4)
        const siteDisplay =
          filteredEntries.length > 1 ? `${shortName}외${filteredEntries.length - 1}` : shortName

        displayContent = React.createElement(
          'div',
          { className: 'w-full flex flex-col items-center justify-center bg-transparent py-0.5' },
          React.createElement(
            'span',
            { className: 'text-[11px] font-bold text-[var(--text-sub)] leading-tight mb-[1px]' },
            dayTotalMan.toFixed(1)
          ),
          React.createElement(
            'span',
            { className: 'text-[12px] font-extrabold text-[var(--primary)] leading-tight' },
            `${(dayTotalAmt / 10000).toFixed(1)}만`
          ),
          React.createElement(
            'span',
            {
              className:
                'text-[10px] font-semibold text-[var(--text-sub)] leading-tight mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis max-w-full block text-center',
            },
            siteDisplay
          )
        )

        totalSites += filteredEntries.length
        totalMan += dayTotalMan
        workedDaysCount++
      }

      const isToday =
        new Date().toDateString() === new Date(currentYear, currentMonth - 1, d).toDateString()

      cells.push({
        type: 'date',
        key: dateStr,
        day: d,
        content: displayContent,
        isToday,
      })
    }

    return {
      cells,
      stats: { totalSites, totalMan, workedDaysCount },
    }
  }

  // Get unique sites for combobox
  const uniqueSites = useMemo(() => {
    const sites = new Set<string>()
    Object.keys(workData).forEach(key => {
      workData[key].forEach(entry => sites.add(entry.site))
    })
    return Array.from(sites).sort()
  }, [workData])

  return {
    currentYear,
    currentMonth,
    setCurrentYear,
    setCurrentMonth,
    handleMonthChange,
    getCalendarCells,
    uniqueSites,
  }
}
