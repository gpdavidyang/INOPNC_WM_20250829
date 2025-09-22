'use client'

import type { Profile, UserSiteHistory } from '@/types'
import type { AttendanceRecord } from '@/types/attendance'

interface AttendanceViewProps {
  profile: Profile
}

interface AttendanceData extends AttendanceRecord {
  work_date: string
  date?: string
  sites?: {
    id: string
    name: string
  }
  site_name?: string
}

interface MonthlyStats {
  totalDays: number
  totalHours: number
  totalLaborHours: number
}

export function AttendanceView({ profile }: AttendanceViewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Data cache for performance optimization
  const [dataCache, setDataCache] = useState<Map<string, { data: AttendanceData[], timestamp: number }>>(new Map())

  // Load site history on mount
  useEffect(() => {
    loadSiteHistory()
  }, [])

  // Load attendance data when date or site changes
  useEffect(() => {
    if (profile?.id) {
      loadAttendanceData()
    }
  }, [currentDate, selectedSite, profile?.id])

  const loadSiteHistory = async () => {
    try {
      const result = await getUserSiteHistory()
      if (result.success && result.data) {
        // Remove duplicates based on site_id to prevent React key warnings
        const uniqueSites = result.data.filter((site, index, self) => 
          index === self.findIndex(s => s.site_id === site.site_id)
        )
        setSiteHistory(uniqueSites)
        console.log('[AttendanceView] Loaded unique sites:', uniqueSites.length, 'from', result.data.length, 'total')
        // Keep default selection as 'all' instead of auto-selecting user's site
        // This ensures the "전체 현장" (All Sites) option is selected by default
      }
    } catch (error) {
      console.error('Failed to load site history:', error)
    }
  }

  const loadAttendanceData = useCallback(async () => {
    if (!profile?.id) return
    
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    
    // Create cache key
    const cacheKey = `${profile.id}-${selectedSite}-${format(startDate, 'yyyy-MM')}`
    const cached = dataCache.get(cacheKey)
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    
    // Use cached data if available and not expired
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('[AttendanceView] Using cached data for:', cacheKey)
      setAttendanceData(cached.data)
      return
    }
    
    setLoading(true)
    try {
      const params = {
        user_id: profile.id,
        site_id: selectedSite === 'all' ? undefined : selectedSite,
        date_from: format(startDate, 'yyyy-MM-dd'),
        date_to: format(endDate, 'yyyy-MM-dd')
      }
      
      console.log('[AttendanceView] Fetching attendance data:', params)
      const result = await getAttendanceRecords(params)
      
      if (result.success && result.data) {
        const data = result.data as AttendanceData[]
        setAttendanceData(data)
        
        // Cache the data
        setDataCache(prev => new Map(prev.set(cacheKey, { 
          data, 
          timestamp: Date.now() 
        })))
      } else {
        setAttendanceData([])
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id, currentDate, selectedSite, dataCache])

  const calculateMonthlyStats = useCallback((data: AttendanceData[]): MonthlyStats => {
    const presentDays = data.filter(d => d.status === 'present' || d.labor_hours > 0)
    const totalDays = presentDays.length
    const totalHours = data.reduce((sum, d) => sum + (d.work_hours || 0), 0)
    const totalLaborHours = data.reduce((sum, d) => sum + (d.labor_hours || 0), 0)
    
    return {
      totalDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalLaborHours: Math.round(totalLaborHours * 10) / 10
    }
  }, [])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getAttendanceForDate = useCallback((date: Date): AttendanceData | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendanceData.find(record => record.work_date === dateStr)
  }, [attendanceData])

  const handleDateClick = (date: Date) => {
    const attendance = getAttendanceForDate(date)
    if (attendance && attendance.labor_hours && attendance.labor_hours > 0) {
      setSelectedDate(date)
    } else {
      setSelectedDate(null)
    }
  }

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null
    const attendance = getAttendanceForDate(selectedDate)
    if (!attendance) return null
    
    return {
      date: selectedDate,
      attendance,
      formattedDate: format(selectedDate, 'M월 d일 (E)', { locale: ko }),
      siteName: attendance.sites?.name || '현장 정보 없음',
      siteAbbrev: attendance.sites?.name ? getSiteShortName(attendance.sites.name) : '미상'
    }
  }

  // Memoized calendar generation for performance
  const { fullCalendarDays, monthStart, monthEnd } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Add padding days for calendar grid
    const startPadding = getDay(monthStart)
    const calendarDays = [
      ...Array(startPadding).fill(null),
      ...monthDays
    ]

    // Add trailing padding to complete last week
    const totalCells = calendarDays.length
    const trailingPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    const fullCalendarDays = [
      ...calendarDays,
      ...Array(trailingPadding).fill(null)
    ]
    
    return { fullCalendarDays, monthStart, monthEnd }
  }, [currentDate])
  
  // Memoized monthly statistics
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(attendanceData)
  }, [attendanceData, calculateMonthlyStats])

  const getDayClass = useCallback((attendance: AttendanceData | undefined, day: Date | null) => {
    if (!day) return ''
    
    const baseClass = 'relative'
    const dayOfWeek = getDay(day)
    
    // Weekend coloring
    let textColor = ''
    if (dayOfWeek === 0) textColor = 'text-red-600 dark:text-red-400'
    else if (dayOfWeek === 6) textColor = 'text-blue-600 dark:text-blue-400'
    else textColor = 'text-gray-900 dark:text-gray-100'
    
    // Today highlight
    const todayClass = isToday(day) ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''
    
    // Attendance status with color coding based on labor hours
    let statusClass = ''
    if (attendance && attendance.labor_hours && attendance.labor_hours > 0) {
      if (attendance.labor_hours >= 1.0) {
        statusClass = 'border-l-4 border-green-500'
      } else if (attendance.labor_hours >= 0.5) {
        statusClass = 'border-l-4 border-yellow-500'
      } else {
        statusClass = 'border-l-4 border-orange-500'
      }
    }
    
    return cn(baseClass, textColor, todayClass, statusClass)
  }, [])

  // Memoized function to convert site names to abbreviations
  const getSiteShortName = useCallback((siteName: string): string => {
    // Remove common suffixes like "현장", "A현장", "B현장", etc.
    const cleanName = siteName.replace(/\s*[A-Z]?현장\s*$/g, '').trim()
    
    // Common site name abbreviations
    const abbreviations: { [key: string]: string } = {
      '강남': '강남',
      '송파': '송파',
      '방배': '방배',
      '한포': '한포',
      '서초': '서초',
      '잠실': '잠실',
      '압구정': '압구정',
      '청담': '청담',
      '역삼': '역삼',
      '논현': '논현',
      '신사': '신사',
      '도곡': '도곡',
      '개포': '개포',
      '일원': '일원',
      '수서': '수서',
      '대치': '대치'
    }
    
    // Check if the clean name matches any abbreviation
    for (const [fullName, abbrev] of Object.entries(abbreviations)) {
      if (cleanName.includes(fullName)) {
        return abbrev
      }
    }
    
    // If no match, return first 2-3 characters of clean name
    return cleanName.length > 3 ? cleanName.substring(0, 2) : cleanName
  }, [])

  const selectedSiteInfo = siteHistory.find(s => s.site_id === selectedSite)

  return (
    <div className="space-y-3">
      {/* Site Selection Dropdown - Consistent with 현장정보 screen */}
      <div className="mb-3">
        <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
          <CustomSelectTrigger className={cn(
            "w-full justify-between text-left",
            touchMode === 'glove' ? 'min-h-[60px]' : 
              touchMode === 'precision' ? 'min-h-[44px]' : 
              'min-h-[48px]',
            isLargeFont ? 'text-base' : 'text-sm'
          )}>
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1 truncate text-left">
                {selectedSite === 'all' ? '전체 현장' : selectedSiteInfo?.site_name || '현장을 선택하세요'}
              </span>
              {selectedSite !== 'all' && selectedSiteInfo?.is_active && (
                <span className={cn(
                  "px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs",
                  "dark:bg-green-900/20 dark:text-green-400"
                )}>
                  현재
                </span>
              )}
            </div>
          </CustomSelectTrigger>
          <CustomSelectContent 
            className={cn(
              touchMode === 'glove' ? 'p-2' : 'p-1',
              "max-w-[90vw] sm:max-w-none",
              "bg-white dark:bg-gray-800", 
              "border border-gray-200 dark:border-gray-700",
              "shadow-lg backdrop-blur-sm",
              "z-50"
            )}
            sideOffset={4}
          >
            <CustomSelectItem 
              value="all"
              className={cn(
                touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                  touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                  'min-h-[44px] px-3 py-2',
                isLargeFont ? 'text-base' : 'text-sm'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="flex-1 truncate">전체 현장</span>
              </div>
            </CustomSelectItem>
            {siteHistory.map((site) => (
              <CustomSelectItem 
                key={site.site_id} 
                value={site.site_id}
                className={cn(
                  touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                    touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                    'min-h-[44px] px-3 py-2',
                  isLargeFont ? 'text-base' : 'text-sm'
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="flex-1 truncate">{site.site_name}</span>
                  {site.is_active && (
                    <span className={cn(
                      "px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs",
                      "dark:bg-green-900/20 dark:text-green-400"
                    )}>
                      현재
                    </span>
                  )}
                </div>
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
      </div>

      {/* Calendar Card - UI Guidelines Compliant */}
      <Card className="p-3">
        {/* Month Navigation - Touch Optimized */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className={cn(
              "rounded-lg transition-all duration-200",
              touchMode === 'glove' && "h-12 w-12",
              touchMode === 'precision' && "h-7 w-7",
              touchMode !== 'precision' && touchMode !== 'glove' && "h-8 w-8"
            )}
          >
            <ChevronLeft className={cn(
              touchMode === 'glove' ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
          
          <h2 className={cn(
            "font-semibold text-gray-900 dark:text-gray-100",
            touchMode === 'glove' ? "text-xl" : "text-base"
          )}>
            {format(currentDate, 'yyyy년 M월')}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className={cn(
              "rounded-lg transition-all duration-200",
              touchMode === 'glove' && "h-12 w-12",
              touchMode === 'precision' && "h-7 w-7",
              touchMode !== 'precision' && touchMode !== 'glove' && "h-8 w-8"
            )}
          >
            <ChevronRight className={cn(
              touchMode === 'glove' ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
        </div>

        {/* Calendar Grid - Simple & Modern */}
        <div className="relative">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-3">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center",
                  touchMode === 'glove' ? 'py-3 text-sm' : 'py-2 text-xs',
                  "font-medium text-gray-600 dark:text-gray-400",
                  i === 0 && "text-red-500 dark:text-red-400",
                  i === 6 && "text-blue-500 dark:text-blue-400"
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days - Simple & Modern Design */}
          <div className="grid grid-cols-7 gap-3">
            
            {fullCalendarDays.map((day, index) => {
              const attendance = day ? getAttendanceForDate(day) : undefined
              const dayNum = day ? format(day, 'd') : ''
              const isCurrentMonth = day && isSameMonth(day, currentDate)
              const dayOfWeek = day ? getDay(day) : -1
              const isTodayDate = day && isToday(day)
              const hasAttendance = attendance && attendance.labor_hours && attendance.labor_hours > 0
              
              return (
                <div
                  key={index}
                  onClick={() => day && isCurrentMonth && handleDateClick(day)}
                  className={cn(
                    "relative min-h-16 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg",
                    "transition-colors duration-200",
                    touchMode === 'glove' ? 'min-h-20' : 
                    touchMode === 'precision' ? 'min-h-14' : 
                    'min-h-16',
                    !day && "invisible",
                    !isCurrentMonth && "opacity-30 text-gray-400",
                    isTodayDate && "ring-1 ring-blue-500",
                    hasAttendance && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
                    selectedDate && day && isSameDay(selectedDate, day) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  {day && (
                    <>
                      {/* Date number */}
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        dayOfWeek === 0 && "text-red-500 dark:text-red-400",
                        dayOfWeek === 6 && "text-blue-500 dark:text-blue-400", 
                        dayOfWeek !== 0 && dayOfWeek !== 6 && "text-gray-900 dark:text-gray-100",
                        isTodayDate && "text-blue-600 dark:text-blue-400 font-bold",
                        !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                      )}>
                        {dayNum}
                      </div>
                      
                      {/* Labor Hours and Site - Minimal Design */}
                      {!loading && hasAttendance && (
                        <div className="space-y-1">
                          {/* Labor Hours - Bold without dot */}
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {attendance.labor_hours}
                          </div>
                          {/* Site Abbreviation - Subtle */}
                          {attendance.sites?.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {getSiteShortName(attendance.sites.name)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Loading state */}
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Statistics - Improved UI Consistency */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-center",
              touchMode === 'glove' ? 'w-10 h-10' : 'w-8 h-8'
            )}>
              <BarChart3 className={cn(
                "text-blue-600 dark:text-blue-400",
                touchMode === 'glove' ? 'h-5 w-5' : 'h-4 w-4'
              )} />
            </div>
            <span className={cn(
              "font-semibold text-gray-800 dark:text-gray-200",
              touchMode === 'glove' ? 'text-base' : 'text-sm'
            )}>
              월간 통계
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/30">
              <div className={cn(
                "font-bold text-blue-600 dark:text-blue-400 mb-1",
                touchMode === 'glove' ? 'text-2xl' : 'text-xl'
              )}>
                {monthlyStats.totalDays}
              </div>
              <div className={cn(
                "text-blue-700 dark:text-blue-300 font-medium",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>
                작업일
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/30">
              <div className={cn(
                "font-bold text-green-600 dark:text-green-400 mb-1",
                touchMode === 'glove' ? 'text-2xl' : 'text-xl'
              )}>
                {attendanceData.filter(a => a.sites?.name).length || 1}
              </div>
              <div className={cn(
                "text-green-700 dark:text-green-300 font-medium",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>
                현장수
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center border border-orange-100 dark:border-orange-800/30">
              <div className={cn(
                "font-bold text-orange-600 dark:text-orange-400 mb-1",
                touchMode === 'glove' ? 'text-2xl' : 'text-xl'
              )}>
                {monthlyStats.totalLaborHours}
              </div>
              <div className={cn(
                "text-orange-700 dark:text-orange-300 font-medium",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>
                총공수
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Date Details - Simple & Modern Design with High Density */}
      {selectedDate && getSelectedDateDetails() && (
        <Card className="border border-gray-200 dark:border-gray-700 p-3">
          {/* Header - Compact Design */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className={cn(
                "text-gray-600 dark:text-gray-400",
                touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
              )} />
              <h3 className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                touchMode === 'glove' ? 'text-base' : 'text-sm'
              )}>
                {getSelectedDateDetails()?.formattedDate}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
              className={cn(
                "h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700",
                touchMode === 'glove' && 'h-8 w-8'
              )}
            >
              ✕
            </Button>
          </div>
          
          {/* Compact Information Grid */}
          <div className="space-y-3">
            {/* Site and Work Info Combined Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Site Information - Compact */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 mb-1">
                  <Building2 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">현장</span>
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {getSelectedDateDetails()?.siteName}
                </p>
              </div>

              {/* Work Information - Compact */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 mb-1">
                  <BarChart3 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">작업</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {getSelectedDateDetails()?.attendance.labor_hours}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">공수</span>
                </div>
              </div>
            </div>

            {/* Status Row - Simplified */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  (getSelectedDateDetails()?.attendance.labor_hours || 0) >= 1.0 ? "bg-gray-700 dark:bg-gray-300" :
                  (getSelectedDateDetails()?.attendance.labor_hours || 0) >= 0.5 ? "bg-gray-500 dark:bg-gray-400" :
                  "bg-gray-400 dark:bg-gray-500"
                )}></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getSelectedDateDetails()?.attendance.status === 'present' ? '출근' : '기타'}
                </span>
              </div>
              
            </div>

            {/* Work Notes if available - Compact */}
            {getSelectedDateDetails()?.attendance.notes && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">작업내용</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                  {getSelectedDateDetails()?.attendance.notes}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}