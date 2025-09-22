'use client'


interface WorkerCalendarProps {
  calendarData: WorkerCalendarData[]
  year: number
  month: number
  workerName: string
  onMonthChange?: (year: number, month: number) => void
}

export default function WorkerCalendar({
  calendarData,
  year,
  month,
  workerName,
  onMonthChange
}: WorkerCalendarProps) {
  // Get days in month and first day of week
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  
  // Create calendar grid
  const calendarGrid = useMemo(() => {
    const days = []
    
    // Previous month's trailing days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find(data => data.date === dateString)
      
      days.push({
        day,
        date: dateString,
        workHours: dayData?.work_hours || 0,
        siteName: dayData?.site_name || null,
        hasWork: !!dayData
      })
    }
    
    return days
  }, [calendarData, year, month, daysInMonth, firstDayOfMonth])

  // Calculate statistics
  const statistics = useMemo(() => {
    const workDays = calendarData.length
    const totalHours = calendarData.reduce((sum, data) => sum + data.work_hours, 0)
    const avgHours = workDays > 0 ? totalHours / workDays : 0
    const sites = [...new Set(calendarData.map(data => data.site_name))]
    
    return {
      workDays,
      totalHours,
      avgHours,
      sites: sites.length
    }
  }, [calendarData])

  const getWorkHoursColor = (hours: number) => {
    if (hours === 0) return 'bg-gray-100 dark:bg-gray-700'
    if (hours <= 0.5) return 'bg-blue-100 dark:bg-blue-900'
    if (hours <= 1.0) return 'bg-green-100 dark:bg-green-900'
    if (hours <= 1.5) return 'bg-yellow-100 dark:bg-yellow-900'
    return 'bg-red-100 dark:bg-red-900'
  }

  const getWorkHoursTextColor = (hours: number) => {
    if (hours === 0) return 'text-gray-400 dark:text-gray-500'
    if (hours <= 0.5) return 'text-blue-800 dark:text-blue-200'
    if (hours <= 1.0) return 'text-green-800 dark:text-green-200'
    if (hours <= 1.5) return 'text-yellow-800 dark:text-yellow-200'
    return 'text-red-800 dark:text-red-200'
  }

  const handlePrevMonth = () => {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    onMonthChange?.(prevYear, prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    onMonthChange?.(nextYear, nextMonth)
  }

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {workerName} - 월간 출력 캘린더
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            일별 근무시간(공수)을 확인할 수 있습니다
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[100px] text-center">
            {year}년 {monthNames[month - 1]}
          </div>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">근무일수</div>
          <div className="text-2xl font-bold text-blue-600">{statistics.workDays}일</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 공수</div>
          <div className="text-2xl font-bold text-green-600">{statistics.totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">일평균 공수</div>
          <div className="text-2xl font-bold text-yellow-600">{statistics.avgHours.toFixed(1)}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">근무 현장 수</div>
          <div className="text-2xl font-bold text-purple-600">{statistics.sites}개</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">휴무</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">0.5공수 이하</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">1.0공수</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">1.5공수</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">2.0공수 이상</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
          {weekdays.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center text-sm font-medium ${
                index === 0 || index === 6
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarGrid.map((dayInfo, index) => (
            <div
              key={index}
              className={`min-h-[80px] p-2 border-r border-b border-gray-200 dark:border-gray-600 ${
                dayInfo ? getWorkHoursColor(dayInfo.workHours) : 'bg-gray-50 dark:bg-gray-800'
              } last:border-r-0 ${index >= calendarGrid.length - 7 ? 'border-b-0' : ''}`}
            >
              {dayInfo && (
                <div className="h-full flex flex-col">
                  {/* Day number */}
                  <div className={`text-sm font-medium mb-1 ${
                    index % 7 === 0 || index % 7 === 6
                      ? 'text-red-600 dark:text-red-400'
                      : getWorkHoursTextColor(dayInfo.workHours)
                  }`}>
                    {dayInfo.day}
                  </div>
                  
                  {/* Work hours */}
                  {dayInfo.hasWork && (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className={`text-xs font-semibold ${getWorkHoursTextColor(dayInfo.workHours)}`}>
                        {dayInfo.workHours}공수
                      </div>
                      {dayInfo.siteName && (
                        <div className={`text-xs truncate mt-1 ${getWorkHoursTextColor(dayInfo.workHours)} opacity-75`}>
                          {dayInfo.siteName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Details */}
      {calendarData.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">근무 상세 내역</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {calendarData
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((data, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm py-1"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(data.date).getDate()}일
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.work_hours}공수
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {data.site_name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}