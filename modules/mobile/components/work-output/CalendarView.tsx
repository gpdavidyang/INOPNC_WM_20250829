'use client'

import React from 'react'
import { Users, Building2, Calendar, Clock, Briefcase } from 'lucide-react'

interface WorkLog {
  date: string
  siteId: string
  siteName: string
  workHours: number
  isPublicService: boolean
  status: 'completed' | 'pending' | 'approved'
}

interface CalendarViewProps {
  currentDate: Date
  workLogs: WorkLog[]
  loading: boolean
}

export default function CalendarView({ currentDate, workLogs, loading }: CalendarViewProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days: (number | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getWorkLogForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return workLogs.find(log => log.date === dateStr)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'approved':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const calendarDays = generateCalendarDays()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-1">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0
                ? 'text-red-500'
                : index === 6
                  ? 'text-blue-500'
                  : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const workLog = day ? getWorkLogForDay(day) : null
          const isWeekend = index % 7 === 0 || index % 7 === 6
          const isToday =
            day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear()

          return (
            <div
              key={index}
              className={`
                aspect-square border rounded-lg p-1
                ${day ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''}
                ${isToday ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-600'}
                ${isWeekend && day ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}
              `}
            >
              {day && (
                <div className="h-full flex flex-col">
                  <div
                    className={`text-sm font-medium ${
                      isWeekend
                        ? index % 7 === 0
                          ? 'text-red-500'
                          : 'text-blue-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {day}
                  </div>

                  {workLog && (
                    <div className="flex-1 flex items-end justify-center pb-1">
                      <div className="flex items-center gap-1">
                        {workLog.isPublicService ? (
                          <div
                            className="flex items-center gap-0.5"
                            title={`공무 - ${workLog.workHours}시간`}
                          >
                            <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                              {workLog.workHours}h
                            </span>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(workLog.status)}`}
                              title={`${workLog.siteName} - ${workLog.workHours}시간`}
                            />
                            <span className="text-[10px] text-gray-600 dark:text-gray-400">
                              {workLog.workHours}h
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">완료</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">승인</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">대기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="text-gray-600 dark:text-gray-400">공무</span>
        </div>
      </div>
    </div>
  )
}
