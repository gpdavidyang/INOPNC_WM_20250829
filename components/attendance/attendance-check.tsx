'use client'


interface AttendanceCheckProps {
  site: Site
}

export default function AttendanceCheck({ site }: AttendanceCheckProps) {
  const [loading, setLoading] = useState(false)
  const [checkingLocation, setCheckingLocation] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
    address?: string
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Fetch today's attendance
    fetchTodayAttendance()

    // Get current location
    getCurrentLocation()

    return () => clearInterval(timer)
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const result = await getTodayAttendance(site.id)
      if (result.success && result.data && result.data.length > 0) {
        // Find current user's attendance
        setTodayAttendance(result.data[0] as unknown) // This should be filtered by current user
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const getCurrentLocation = () => {
    setCheckingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('브라우저가 위치 정보를 지원하지 않습니다')
      setCheckingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setLocation({ latitude, longitude, accuracy })
        
        // Try to get address using reverse geocoding
        // This would require a geocoding API
        
        setCheckingLocation(false)
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 권한이 거부되었습니다'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다'
            break
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다'
            break
        }
        setLocationError(errorMessage)
        setCheckingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const result = await checkIn({
        site_id: site.id,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        address: location?.address,
        device_info: navigator.userAgent
      })

      if (result.success && result.data) {
        setTodayAttendance(result.data as unknown)
      } else {
        alert(result.error || '출근 체크에 실패했습니다')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('출근 체크 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) return

    setLoading(true)
    try {
      const result = await checkOut({
        attendance_id: todayAttendance.id,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        address: location?.address,
        device_info: navigator.userAgent
      })

      if (result.success && result.data) {
        setTodayAttendance(result.data as unknown)
      } else {
        alert(result.error || '퇴근 체크에 실패했습니다')
      }
    } catch (error) {
      console.error('Error checking out:', error)
      alert('퇴근 체크 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatTimeString = (timeString: string | null | undefined) => {
    if (!timeString) return '-'
    return timeString.substring(0, 5) // HH:MM format
  }

  const calculateWorkHours = () => {
    if (!todayAttendance?.check_in_time || !todayAttendance?.check_out_time) {
      return null
    }
    return todayAttendance.work_hours || 0
  }

  const isCheckedIn = todayAttendance && todayAttendance.check_in_time && !todayAttendance.check_out_time
  const isCheckedOut = todayAttendance && todayAttendance.check_out_time

  return (
    <div className="space-y-6">
      {/* Current Time & Location */}
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">{formatTime(currentTime)}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {site.name}
            </span>
          </div>

          {checkingLocation && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              위치 확인 중...
            </div>
          )}

          {locationError && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {locationError}
            </div>
          )}

          {location && !checkingLocation && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              위치 확인됨 (정확도: {Math.round(location.accuracy)}m)
            </div>
          )}
        </div>
      </Card>

      {/* Attendance Status */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">오늘의 출근 현황</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">출근 시간</p>
            <p className="text-xl font-semibold">
              {formatTimeString(todayAttendance?.check_in_time)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">퇴근 시간</p>
            <p className="text-xl font-semibold">
              {formatTimeString(todayAttendance?.check_out_time)}
            </p>
          </div>
        </div>

        {calculateWorkHours() !== null && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">총 근무시간</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {calculateWorkHours()?.toFixed(1)}시간
            </p>
            {(todayAttendance?.overtime_hours || 0) > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                (정규: 8시간, 초과: {todayAttendance?.overtime_hours?.toFixed(1)}시간)
              </p>
            )}
          </div>
        )}

        {/* Check In/Out Buttons */}
        <div className="flex gap-3">
          {!isCheckedIn && !isCheckedOut && (
            <Button
              onClick={handleCheckIn}
              disabled={loading || checkingLocation}
              size="field"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              출근하기
            </Button>
          )}

          {isCheckedIn && (
            <Button
              onClick={handleCheckOut}
              disabled={loading || checkingLocation}
              size="field"
              variant="secondary"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5 mr-2" />
              )}
              퇴근하기
            </Button>
          )}

          {isCheckedOut && (
            <div className="flex-1 text-center">
              <Badge variant="success" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                오늘의 근무가 완료되었습니다
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Notice */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">출퇴근 체크 안내</p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• 출퇴근 체크는 현장 근처에서만 가능합니다</li>
              <li>• GPS 위치 정보가 자동으로 기록됩니다</li>
              <li>• 출근 후 퇴근하지 않으면 자동으로 18:00에 퇴근 처리됩니다</li>
              <li>• 문제가 있을 경우 현장 관리자에게 문의하세요</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}