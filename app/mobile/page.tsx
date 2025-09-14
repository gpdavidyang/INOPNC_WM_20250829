'use client'

import React from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { Card, CardContent, Button, Row, Grid, Stack, Chip, Badge } from '@/modules/shared/ui'

export default function MobileHomePage() {
  return (
    <MobileAuthGuard>
      <MobileHomeContent />
    </MobileAuthGuard>
  )
}

const MobileHomeContent: React.FC = () => {
  const { profile, isWorker, isSiteManager } = useMobileUser()
  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <MobileLayout
      title="INOPNC WM"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showNotification={true}
      notificationCount={3}
    >
      <div className="p-4 space-y-4">
        {/* Welcome Section */}
        <Card>
          <CardContent className="p-4">
            <Stack gap="sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="t-h2">안녕하세요, {profile?.full_name}님</h2>
                  <p className="t-cap">{currentDate}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Chip variant={isWorker ? 'tag1' : 'tag3'}>
                    {isWorker ? '작업자' : '현장관리자'}
                  </Chip>
                  <div className="flex items-center gap-1">
                    <Badge variant="tag1" />
                    <span className="t-cap">정상 근무</span>
                  </div>
                </div>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">빠른 작업</h3>
            <Grid cols={2} gap="sm">
              <Button variant="primary" className="h-16 flex-col gap-1">
                <span className="text-xl">📋</span>
                <span className="text-sm">출근 체크</span>
              </Button>
              <Button variant="sky" className="h-16 flex-col gap-1">
                <span className="text-xl">📸</span>
                <span className="text-sm">현장 촬영</span>
              </Button>
              {isSiteManager && (
                <>
                  <Button variant="gray" className="h-16 flex-col gap-1">
                    <span className="text-xl">📝</span>
                    <span className="text-sm">일일 보고</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-xl">👥</span>
                    <span className="text-sm">작업자 배정</span>
                  </Button>
                </>
              )}
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">📦</span>
                <span className="text-sm">자재 관리</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">📄</span>
                <span className="text-sm">문서 확인</span>
              </Button>
            </Grid>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">오늘의 현황</h3>
            <Stack gap="sm">
              <Row justify="between" className="py-2 border-b border-gray-100">
                <span className="t-body">출근 시간</span>
                <span className="t-body font-medium">08:30</span>
              </Row>
              <Row justify="between" className="py-2 border-b border-gray-100">
                <span className="t-body">근무 시간</span>
                <span className="t-body font-medium">7시간 30분</span>
              </Row>
              <Row justify="between" className="py-2 border-b border-gray-100">
                <span className="t-body">현재 현장</span>
                <span className="t-body font-medium">서울 본사 건설현장</span>
              </Row>
              {isSiteManager && (
                <Row justify="between" className="py-2">
                  <span className="t-body">관리 작업자</span>
                  <span className="t-body font-medium">12명</span>
                </Row>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">최근 활동</h3>
            <Stack gap="sm">
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <p className="t-body font-medium">출근 체크 완료</p>
                  <p className="t-cap">08:30</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <span className="text-lg">📸</span>
                <div className="flex-1">
                  <p className="t-body font-medium">현장 사진 업로드</p>
                  <p className="t-cap">09:15</p>
                </div>
              </div>
              {isSiteManager && (
                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <span className="text-lg">📝</span>
                  <div className="flex-1">
                    <p className="t-body font-medium">일일보고서 작성 필요</p>
                    <p className="t-cap">대기 중</p>
                  </div>
                </div>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Weather & Site Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">현장 정보</h3>
            <Row gap="md">
              <div className="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl">☀️</p>
                <p className="t-cap">맑음</p>
                <p className="t-body font-medium">25°C</p>
              </div>
              <div className="flex-1 text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl">✅</p>
                <p className="t-cap">안전 상태</p>
                <p className="t-body font-medium">양호</p>
              </div>
              <div className="flex-1 text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl">⚠️</p>
                <p className="t-cap">주의사항</p>
                <p className="t-body font-medium">2건</p>
              </div>
            </Row>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
