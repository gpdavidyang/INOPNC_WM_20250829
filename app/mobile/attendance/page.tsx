'use client'

import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { Card, CardContent, Button, Stack, Row, Chip, Input, Field } from '@/modules/shared/ui'

export default function MobileAttendancePage() {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile } = useMobileUser()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [location, setLocation] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleCheckIn = async () => {
    setIsLoading(true)
    try {
      // TODO: API call to record attendance
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setIsCheckedIn(true)
      setCheckInTime(currentTime)

      // Show success message
      alert('출근이 등록되었습니다!')
    } catch (error) {
      alert('출근 등록 중 오류가 발생했습니다.')
      console.error('Check-in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    try {
      // TODO: API call to record checkout
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setIsCheckedIn(false)
      setCheckInTime(null)

      // Show success message
      alert('퇴근이 등록되었습니다!')
    } catch (error) {
      alert('퇴근 등록 중 오류가 발생했습니다.')
      console.error('Check-out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          setLocation(`위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`)
        },
        error => {
          console.error('Location error:', error)
          setLocation('위치 정보를 가져올 수 없습니다.')
        }
      )
    } else {
      setLocation('위치 서비스를 지원하지 않습니다.')
    }
  }

  React.useEffect(() => {
    getCurrentLocation()
  }, [])

  return (
    <MobileLayout
      title="출근 관리"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showNotification={true}
    >
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <Stack gap="md" align="center">
              <div className="text-center">
                <h2 className="t-title">{currentTime}</h2>
                <p className="t-body">{currentDate}</p>
              </div>

              <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
                {isCheckedIn ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="t-cap">출근 중</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl">🕐</span>
                    </div>
                    <p className="t-cap">출근 전</p>
                  </div>
                )}
              </div>

              {isCheckedIn ? (
                <Stack gap="sm" align="center">
                  <Chip variant="tag1">출근 시간: {checkInTime}</Chip>
                  <Button
                    variant="danger"
                    onClick={handleCheckOut}
                    loading={isLoading}
                    className="w-full"
                  >
                    퇴근하기
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleCheckIn}
                  loading={isLoading}
                  className="w-full"
                >
                  출근하기
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Location Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">위치 정보</h3>
            <Stack gap="sm">
              <Row justify="between">
                <span className="t-body">현재 위치</span>
                <Button
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="text-xs px-2 py-1 h-auto"
                >
                  새로고침
                </Button>
              </Row>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="t-cap">{location || '위치 정보를 가져오는 중...'}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="t-cap">등록된 현장: 서울 본사 건설현장</p>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Memo Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">메모</h3>
            <Stack gap="sm">
              <Field label="출근 메모 (선택사항)">
                <textarea
                  className="input h-24 resize-none"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="특이사항이나 메모를 입력하세요..."
                />
              </Field>
            </Stack>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">오늘의 일정</h3>
            <Stack gap="sm">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-lg">🔨</span>
                <div className="flex-1">
                  <p className="t-body font-medium">기초 공사 작업</p>
                  <p className="t-cap">09:00 - 17:00</p>
                </div>
                <Chip variant="tag3">진행중</Chip>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-lg">🏗️</span>
                <div className="flex-1">
                  <p className="t-body font-medium">안전 점검</p>
                  <p className="t-cap">13:00 - 14:00</p>
                </div>
                <Chip variant="tag1">완료</Chip>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <p className="t-body font-medium">일일 보고</p>
                  <p className="t-cap">17:00 - 17:30</p>
                </div>
                <Chip>대기</Chip>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Attendance History */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">최근 출근 기록</h3>
            <Stack gap="sm">
              {[
                { date: '2024-03-20', checkIn: '08:30', checkOut: '17:45', hours: '9시간 15분' },
                { date: '2024-03-19', checkIn: '08:25', checkOut: '17:30', hours: '9시간 5분' },
                { date: '2024-03-18', checkIn: '08:35', checkOut: '17:40', hours: '9시간 5분' },
              ].map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="t-body font-medium">{record.date}</p>
                    <p className="t-cap">
                      출근: {record.checkIn} | 퇴근: {record.checkOut}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="t-cap">총 근무</p>
                    <p className="t-body font-medium">{record.hours}</p>
                  </div>
                </div>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
