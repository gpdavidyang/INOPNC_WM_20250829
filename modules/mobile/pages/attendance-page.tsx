'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { Card, CardContent, Button, Stack, Chip, Badge, Row } from '@/modules/shared/ui'

interface AttendanceRecord {
  date: string
  checkIn: string | null
  checkOut: string | null
  workHours: number
  status: 'present' | 'absent' | 'late' | 'early'
}

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile, isWorker, isSiteManager } = useUnifiedAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCheckIn = () => {
    const now = new Date()
    setIsCheckedIn(true)
    setCheckInTime(now.toTimeString().slice(0, 5))
  }

  const handleCheckOut = () => {
    const now = new Date()
    setCheckOutTime(now.toTimeString().slice(0, 5))
    setIsCheckedIn(false)
  }

  const currentDate = currentTime.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const currentTimeString = currentTime.toTimeString().slice(0, 8)

  // Mock data for recent attendance
  const recentAttendance: AttendanceRecord[] = [
    {
      date: '2025-09-13',
      checkIn: '08:30',
      checkOut: '17:30',
      workHours: 8.5,
      status: 'present',
    },
    {
      date: '2025-09-12',
      checkIn: '08:45',
      checkOut: '17:30',
      workHours: 8.25,
      status: 'late',
    },
    {
      date: '2025-09-11',
      checkIn: '08:30',
      checkOut: '16:30',
      workHours: 7.5,
      status: 'early',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'tag1'
      case 'late':
        return 'tag4'
      case 'early':
        return 'tag3'
      case 'absent':
        return 'tag2'
      default:
        return 'tag1'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '정상'
      case 'late':
        return '지각'
      case 'early':
        return '조퇴'
      case 'absent':
        return '결근'
      default:
        return '정상'
    }
  }

  return (
    <MobileLayout
      title="출력정보"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showBack={true}
    >
      {/* 탭 네비게이션 */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'output' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('output')}
        >
          출력현황
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'salary' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('salary')}
        >
          급여현황
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 출력현황 탭 */}
        {activeTab === 'output' && (
          <>
            {/* Current Status */}
            <Card>
              <CardContent className="p-4">
                <Stack gap="md">
                  <div className="text-center">
                    <h2 className="t-h1 mb-2">{currentTimeString}</h2>
                    <p className="t-body text-muted-foreground">{currentDate}</p>
                  </div>

                  <div className="text-center space-y-2">
                    {!isCheckedIn && !checkInTime ? (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-16 text-lg"
                        onClick={handleCheckIn}
                      >
                        📋 출근 체크
                      </Button>
                    ) : isCheckedIn && checkInTime ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="tag1" />
                          <span className="t-body font-medium">출근 완료: {checkInTime}</span>
                        </div>
                        <Button
                          variant="gray"
                          size="lg"
                          className="w-full h-16 text-lg"
                          onClick={handleCheckOut}
                        >
                          🚪 퇴근 체크
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="tag3" />
                          <span className="t-body font-medium">
                            {checkInTime} ~ {checkOutTime} (완료)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Stack>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h3 mb-3">오늘의 근무 현황</h3>
                <Stack gap="sm">
                  <Row justify="between">
                    <span className="t-body">출근 시간</span>
                    <span className="t-body font-medium">{checkInTime || '-'}</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">퇴근 시간</span>
                    <span className="t-body font-medium">{checkOutTime || '-'}</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">근무 시간</span>
                    <span className="t-body font-medium">
                      {checkInTime && checkOutTime ? '8시간' : isCheckedIn ? '진행 중' : '-'}
                    </span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">상태</span>
                    <Chip variant="tag1">정상</Chip>
                  </Row>
                </Stack>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h3 mb-3">최근 출근 기록</h3>
                <Stack gap="sm">
                  {recentAttendance.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="t-body font-medium">
                          {new Date(record.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </p>
                        <p className="t-cap text-muted-foreground">
                          {record.checkIn} ~ {record.checkOut} ({record.workHours}h)
                        </p>
                      </div>
                      <Chip variant={getStatusColor(record.status) as any}>
                        {getStatusText(record.status)}
                      </Chip>
                    </div>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h3 mb-3">주간 요약</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="t-h2 font-bold text-blue-600">5/5</p>
                    <p className="t-cap">출근일</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="t-h2 font-bold text-green-600">42.5h</p>
                    <p className="t-cap">총 근무시간</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="t-h2 font-bold text-orange-600">1</p>
                    <p className="t-cap">지각</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="t-h2 font-bold text-purple-600">1</p>
                    <p className="t-cap">조퇴</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 급여현황 탭 */}
        {activeTab === 'salary' && (
          <>
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h3 mb-3">이번 달 급여 현황</h3>
                <Stack gap="sm">
                  <Row justify="between">
                    <span className="t-body">기본급</span>
                    <span className="t-body font-medium">₩2,000,000</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">연장 수당</span>
                    <span className="t-body font-medium">₩150,000</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">식대</span>
                    <span className="t-body font-medium">₩200,000</span>
                  </Row>
                  <div className="border-t pt-3">
                    <Row justify="between">
                      <span className="t-body font-bold">합계</span>
                      <span className="t-body font-bold text-primary">₩2,350,000</span>
                    </Row>
                  </div>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="t-h3 mb-3">최근 급여 내역</h3>
                <Stack gap="sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Row justify="between">
                      <div>
                        <p className="t-body font-medium">2025년 8월</p>
                        <p className="t-cap text-muted-foreground">2025-08-31 지급</p>
                      </div>
                      <span className="t-body font-bold">₩2,280,000</span>
                    </Row>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Row justify="between">
                      <div>
                        <p className="t-body font-medium">2025년 7월</p>
                        <p className="t-cap text-muted-foreground">2025-07-31 지급</p>
                      </div>
                      <span className="t-body font-bold">₩2,350,000</span>
                    </Row>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Row justify="between">
                      <div>
                        <p className="t-body font-medium">2025년 6월</p>
                        <p className="t-cap text-muted-foreground">2025-06-30 지급</p>
                      </div>
                      <span className="t-body font-bold">₩2,200,000</span>
                    </Row>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MobileLayout>
  )
}
