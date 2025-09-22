'use client'

import type { AttendanceCalendarProps, AttendanceRecord } from '@/types/attendance'
import type { Site } from '@/types'

export function AttendanceCalendar({ profile, isPartnerView }: AttendanceCalendarProps) {
  // All hooks must be called before any conditional returns
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  // 2025년 8월로 초기화 (테스트 데이터가 있는 달)
  const [currentDate, setCurrentDate] = useState(new Date('2025-08-01'))
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [sites, setSites] = useState<Site[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [summary, setSummary] = useState({
    totalDays: 0,
    totalHours: 0,
    totalWorkers: 0
  })
  
  // Debug state changes - all useEffect hooks must be before early return
  useEffect(() => {
    // console.log('📦 State updated - attendanceData:', attendanceData.length, 'records')
    if (attendanceData.length > 0) {
      // console.log('📦 First record:', attendanceData[0])
      // console.log('📦 All dates:', attendanceData.map(r => r.date))
    }
  }, [attendanceData])
  
  useEffect(() => {
    // console.log('📊 State updated - summary:', summary)
  }, [summary])

  useEffect(() => {
    // console.log('🌐 Initial load - loading sites')
    if (profile?.id) {
      loadSites()
    }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // console.log('🔄 useEffect triggered for attendance data', {
    //   selectedSite,
    //   isPartnerView,
    //   profileSiteId: profile?.site_id,
    //   shouldLoad: selectedSite || (!isPartnerView && profile?.site_id)
    // })
    
    if (profile?.id && (selectedSite || (!isPartnerView && profile.site_id))) {
      // console.log('✅ Calling loadAttendanceData')
      loadAttendanceData()
    } else {
      // console.log('⚠️ Skipping loadAttendanceData - no site selected or no profile')
    }
  }, [currentDate, selectedSite, isPartnerView, profile?.site_id, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Early return if no profile
  if (!profile?.id) {
    console.error('❌ AttendanceCalendar: No profile ID provided')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">프로필 정보를 불러올 수 없습니다.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">페이지를 새로고침해 주세요.</p>
        </div>
      </div>
    )
  }

  // console.log('AttendanceCalendar: Received profile:', {
  //   hasProfile: !!profile,
  //   profileId: profile?.id,
  //   profileRole: profile?.role,
  //   profileSiteId: profile?.site_id,
  //   isPartnerView
  // })

  const loadSites = async () => {
    // console.log('🏢 Loading sites...')
    const result = await getSites()
    // console.log('🏢 Sites result:', {
    //   success: result.success,
    //   count: result.data?.length,
    //   error: result.error,
    //   sites: result.data
    // })
    
    if (result.success && result.data) {
      setSites(result.data as unknown)
      // Auto-select first site for partner view or user's assigned site
      if (isPartnerView && result.data.length > 0) {
        // console.log('🏢 Partner view - selecting first site:', result.data[0].id)
        setSelectedSite(result.data[0].id)
      } else if (profile.site_id) {
        // console.log('🏢 User has site_id - selecting:', profile.site_id)
        setSelectedSite(profile.site_id)
      } else {
        // console.log('⚠️ No site to select')
      }
    } else {
      // console.log('❌ Failed to load sites')
    }
  }

  const loadAttendanceData = async () => {
    // console.log('🔍 loadAttendanceData called', {
    //   currentDate: currentDate.toISOString(),
    //   selectedSite,
    //   profileSiteId: profile.site_id,
    //   profileId: profile.id,
    //   isPartnerView
    // })
    
    setLoading(true)
    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      
      // console.log('📅 Date range:', {
      //   startDate: format(startDate, 'yyyy-MM-dd'),
      //   endDate: format(endDate, 'yyyy-MM-dd')
      // })
      
      if (isPartnerView) {
        // Load company-wide attendance summary
        const result = await getCompanyAttendanceSummary({
          organization_id: profile.organization_id,
          site_id: selectedSite,
          date_from: format(startDate, 'yyyy-MM-dd'),
          date_to: format(endDate, 'yyyy-MM-dd')
        })
        
        if (result.success && result.data) {
          setAttendanceData((result.data.records || []) as unknown)
          setSummary({
            totalDays: result.data.totalDays || 0,
            totalHours: result.data.totalHours || 0,
            totalWorkers: result.data.totalWorkers || 0
          })
        }
      } else {
        // Load individual attendance records
        const params = {
          user_id: profile.id,
          site_id: selectedSite || (profile as unknown).site_id,
          date_from: format(startDate, 'yyyy-MM-dd'),
          date_to: format(endDate, 'yyyy-MM-dd')
        }
        
        // console.log('📤 Calling getAttendanceRecords with params:', params)
        const result = await getAttendanceRecords(params)
        // console.log('📥 getAttendanceRecords result:', {
        //   success: result.success,
        //   dataLength: result.data?.length,
        //   error: result.error,
        //   firstRecord: result.data?.[0]
        // })
        
        if (result.success && result.data) {
          // console.log('🔄 Transforming records:', result.data.length, 'records')
          const records = result.data.map((record: unknown) => {
            const transformed = {
              id: record.id,
              date: record.work_date,  // Fixed: changed from attendance_date to work_date
              site_id: record.site_id,
              site_name: record.sites?.name || '',
              check_in_time: record.check_in_time,
              check_out_time: record.check_out_time,
              work_hours: record.work_hours,
              overtime_hours: record.overtime_hours,
              labor_hours: record.labor_hours || (record.work_hours ? record.work_hours / 8.0 : null),  // Use DB's labor_hours or calculate from work_hours
              status: record.status || 'present'
            }
            // console.log('  Transformed record:', transformed)
            return transformed
          })
          // console.log('✅ Setting attendance data:', records.length, 'records')
          setAttendanceData(records)
          
          // Calculate summary for individual
          const totalDays = records.filter((r: unknown) => r.status === 'present').length
          const totalHours = records.reduce((sum: number, r: unknown) => sum + (r.work_hours || 0), 0)
          const summaryData = {
            totalDays,
            totalHours,
            totalWorkers: 1
          }
          // console.log('📊 Setting summary:', summaryData)
          setSummary(summaryData)
        } else {
          // console.log('❌ No data returned or error:', result.error)
        }
      }
    } catch (error) {
      console.error('❌ Error in loadAttendanceData:', error)
    } finally {
      setLoading(false)
      // console.log('🏁 loadAttendanceData completed, attendanceData length:', attendanceData.length)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days for calendar grid
  const startPadding = getDay(monthStart)
  const calendarDays = [
    ...Array(startPadding).fill(null),
    ...monthDays
  ]

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const found = attendanceData.find(record => {
      const recordDateStr = typeof record.date === 'string' ? record.date : format(new Date(record.date), 'yyyy-MM-dd')
      const isMatch = recordDateStr === dateStr
      if (isMatch) {
        // console.log('📍 Found match for', dateStr, ':', record)
      }
      return isMatch
    })
    return found
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getDayContent = (day: Date) => {
    const attendance = getAttendanceForDate(day)
    // console.log('🎨 getDayContent for', format(day, 'yyyy-MM-dd'), ':', attendance)
    if (!attendance) return null

    if (isPartnerView) {
      // Show worker count for partner view
      return (
        <div className="text-center mt-1">
          <div className="text-sm text-blue-600">{attendance.totalWorkers || 0}명</div>
        </div>
      )
    } else {
      // Show labor hours (공수) and site name - 새로운 디자인
      if (attendance.labor_hours !== null && attendance.labor_hours !== undefined) {
        return (
          <div className="text-center mt-2 space-y-0.5">
            <div className="text-sm font-medium text-blue-600">
              {attendance.labor_hours.toFixed(2)}
            </div>
            {attendance.site_name && (
              <div className="text-xs text-blue-600">
                {attendance.site_name.replace(/\s*[A-Z]?현장$/g, '').substring(0, 2)}
              </div>
            )}
          </div>
        )
      } else if (attendance.status === 'holiday') {
        return (
          <div className="text-center mt-2">
            <div className="text-sm text-blue-600">휴일</div>
          </div>
        )
      }
    }
    return null
  }

  const selectedSiteInfo = sites.find(s => s.id === (selectedSite || profile.site_id))

  return (
    <div className="space-y-6">
      {/* Site Selection (for multi-site access) */}
      {(isPartnerView || sites.length > 1) && (
        <div className="flex items-center gap-4">
          <Building2 className="h-5 w-5 text-gray-600" />
          <CustomSelect 
            value={selectedSite || profile.site_id || ''} 
            onValueChange={setSelectedSite}
          >
            <CustomSelectTrigger className={cn(
              "w-full",
              touchMode === 'glove' && 'h-14 text-base',
              touchMode === 'precision' && 'h-9 text-sm',
              !touchMode || touchMode === 'normal' && 'h-10 text-base'
            )}>
              <CustomSelectValue placeholder={sites.length === 0 ? "현장을 불러오는 중..." : "현장 선택"} />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {sites.map(site => (
                <CustomSelectItem key={site.id} value={site.id}>
                  {site.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
      )}

      {/* Calendar Header */}
      <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold`}>
              {format(currentDate, 'yyyy년 MM월')}
            </h2>
            <Button
              variant="outline"
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {!isPartnerView && (
            <div className={`flex gap-4 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span>출근일: {summary.totalDays}일</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span>총 공수: {summary.totalHours}시간</span>
              </div>
            </div>
          )}
          
          {isPartnerView && (
            <div className={`flex gap-4 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span>총 작업자: {summary.totalWorkers}명</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span>총 근무일: {summary.totalDays}일</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span>총 공수: {summary.totalHours}시간</span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Grid - Quantum Holographic Design (Iteration 9) */}
        <div className="relative">
          {/* Quantum Field Background Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-cyan-50/30 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-cyan-900/10"></div>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-radial from-blue-400/20 via-purple-400/10 to-transparent blur-xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-radial from-cyan-400/20 via-blue-400/10 to-transparent blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          {/* Day headers with quantum effects */}
          <div className="grid grid-cols-7 mb-2 relative z-10">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center py-3 text-sm font-bold relative",
                  "bg-gradient-to-b from-white/80 to-gray-50/80 backdrop-blur-sm rounded-lg mx-0.5 shadow-sm",
                  "border border-white/50 dark:border-gray-700/50",
                  "dark:from-gray-800/80 dark:to-gray-900/80",
                  i === 0 && "text-red-500 bg-gradient-to-b from-red-50/80 to-red-100/60 dark:from-red-900/30 dark:to-red-800/30",
                  i === 6 && "text-blue-600 bg-gradient-to-b from-blue-50/80 to-blue-100/60 dark:from-blue-900/30 dark:to-blue-800/30"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days - Quantum Holographic Design */}
          <div className="grid grid-cols-7 gap-2 relative z-10">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day && isSameMonth(day, currentDate)
              const isToday = day && isSameDay(day, new Date())
              const isSelected = day && selectedDate && isSameDay(day, selectedDate)
              const attendance = day ? getAttendanceForDate(day) : null
              const dayOfWeek = day ? getDay(day) : -1
              
              if (day && attendance) {
                // console.log('📅 Rendering day', format(day, 'yyyy-MM-dd'), 'with attendance:', attendance)
              }

              // Quantum energy level based on labor hours
              const quantumLevel = attendance?.labor_hours 
                ? Math.min(attendance.labor_hours, 1.2) / 1.2 
                : 0

              // Create unique key - use day or fallback to index
              const dayKey = day ? format(day, 'yyyy-MM-dd') : `calendar-day-${index}`

              return (
                <div
                  key={dayKey}
                  onClick={() => day && setSelectedDate(day)}
                  className={cn(
                    "relative cursor-pointer rounded-xl transition-all duration-300",
                    "min-h-[90px] p-2 group",
                    !isCurrentMonth && "opacity-40",
                    day && "border border-white/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl",
                    isSelected && "ring-2 ring-blue-400 ring-offset-2 shadow-2xl",
                    isToday && "ring-2 ring-yellow-400 ring-offset-2"
                  )}
                  style={{
                    background: day 
                      ? isToday
                        ? 'linear-gradient(135deg, rgba(255,235,59,0.3) 0%, rgba(255,193,7,0.2) 50%, rgba(255,152,0,0.1) 100%)'
                        : attendance
                        ? `linear-gradient(135deg, 
                           rgba(59,130,246,${0.1 + quantumLevel * 0.3}) 0%, 
                           rgba(147,51,234,${0.05 + quantumLevel * 0.2}) 50%, 
                           rgba(6,182,212,${0.05 + quantumLevel * 0.15}) 100%)`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)'
                      : 'transparent',
                    backdropFilter: day ? 'blur(12px) saturate(180%)' : 'none',
                  }}
                >
                  {day && (
                    <>
                      {/* Quantum particle effects */}
                      <div className="absolute inset-0 overflow-hidden rounded-xl">
                        {attendance && (
                          <>
                            <div 
                              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 animate-pulse opacity-70"
                              style={{animationDelay: `${index * 0.1}s`}}
                            ></div>
                            <div 
                              className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce opacity-60"
                              style={{animationDelay: `${index * 0.15}s`}}
                            ></div>
                            <div 
                              className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-cyan-400 animate-ping opacity-50"
                              style={{animationDelay: `${index * 0.2}s`}}
                            ></div>
                          </>
                        )}
                        
                        {/* Holographic interference patterns */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:animate-shimmer-slow"></div>
                      </div>

                      {/* Day number with quantum glow */}
                      <div className={cn(
                        "text-sm font-bold absolute top-2 left-3 z-10",
                        dayOfWeek === 0 && "text-red-500",
                        dayOfWeek === 6 && "text-blue-600",
                        isToday && "text-yellow-600 text-shadow-glow",
                        attendance && "text-shadow-sm"
                      )}>
                        {format(day, 'd')}
                      </div>

                      {/* Quantum data visualization */}
                      {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin opacity-60"></div>
                        </div>
                      ) : (
                        (() => {
                          const content = getDayContent(day)
                          if (content && attendance) {
                            // console.log('🎯 Rendering quantum content for', format(day, 'yyyy-MM-dd'))
                            
                            // Enhanced quantum visualization
                            return (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                                {/* Quantum energy ring */}
                                <div 
                                  className="absolute inset-2 rounded-xl border-2 opacity-30 animate-pulse"
                                  style={{
                                    borderColor: quantumLevel > 0.8 ? '#10b981' : quantumLevel > 0.5 ? '#f59e0b' : '#3b82f6',
                                    boxShadow: `inset 0 0 20px ${quantumLevel > 0.8 ? '#10b98120' : quantumLevel > 0.5 ? '#f59e0b20' : '#3b82f620'}`
                                  }}
                                ></div>
                                
                                {/* Content with holographic effects */}
                                <div className="relative z-20 text-center">
                                  {content || null}
                                </div>
                                
                                {/* Quantum field lines */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                  <div className="flex space-x-1">
                                    {Array.from({ length: Math.ceil(quantumLevel * 5) }).map((_, i) => (
                                      <div
                                        key={`quantum-line-${dayKey}-${i}`}
                                        className="w-0.5 h-2 bg-gradient-to-t from-blue-400 to-purple-400 opacity-60 animate-pulse"
                                        style={{animationDelay: `${i * 0.2}s`}}
                                      ></div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return content || null
                        })()
                      )}

                      {/* Quantum interference pattern overlay */}
                      <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-conic from-blue-400/20 via-purple-400/10 via-cyan-400/20 to-blue-400/20 animate-spin-slow"></div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend - 간소화 */}
        {!isPartnerView && (
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 rounded"></div>
              <span>출근</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>휴무</span>
            </div>
          </div>
        )}
      </Card>

      {/* Site Information */}
      {selectedSiteInfo && (
        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4 flex items-center gap-2`}>
            <Building2 className="h-5 w-5" />
            현장 정보
          </h3>
          <div className="space-y-3">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>현장명</p>
              <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium`}>{selectedSiteInfo.name}</p>
              {(selectedSiteInfo as unknown).code && (
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>({(selectedSiteInfo as unknown).code})</p>
              )}
            </div>
            
            {selectedSiteInfo.address && (
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex items-center gap-1 mb-1`}>
                  <MapPin className="h-3.5 w-3.5" />
                  현장 주소
                </p>
                <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>{selectedSiteInfo.address}</p>
              </div>
            )}
            
            {selectedSiteInfo.start_date && selectedSiteInfo.end_date && (
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex items-center gap-1 mb-1`}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  공사 기간
                </p>
                <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  {format(new Date(selectedSiteInfo.start_date), 'yyyy.MM.dd')} ~ 
                  {format(new Date(selectedSiteInfo.end_date), 'yyyy.MM.dd')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Selected Date Details */}
      {selectedDate && !isPartnerView && (
        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
            {format(selectedDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })} 상세
          </h3>
          {(() => {
            const attendance = getAttendanceForDate(selectedDate)
            if (!attendance) {
              return (
                <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>해당 날짜의 출근 기록이 없습니다.</p>
              )
            }
            
            return (
              <div className="space-y-4">
                {/* 현장명 - 약어 정보 제거 */}
                {attendance.site_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">현장</p>
                      <p className="font-medium">{attendance.site_name}</p>
                    </div>
                  </div>
                )}
                
                {/* 공수 - 출근 정보 제거 */}
                {attendance.labor_hours !== null && attendance.labor_hours !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">작업</p>
                      <Badge variant={
                        attendance.labor_hours >= 1.0 ? 'success' : 
                        attendance.labor_hours >= 0.5 ? 'warning' : 
                        attendance.labor_hours > 0 ? 'secondary' : 
                        'default'
                      }>
                        {attendance.labor_hours.toFixed(2)} 공수
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* 작업내용 */}
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">작업내용</p>
                    <div className="text-sm text-gray-800 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                      {attendance.work_description || '일반 작업 수행'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}