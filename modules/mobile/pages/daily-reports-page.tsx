'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { SiteManagerGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import {
  useTodayDailyReports,
  useRecentDailyReports,
  useDailyReportsStats,
  type DailyReportItem,
} from '@/hooks/api/use-mobile-daily-reports'
import {
  Card,
  CardContent,
  Button,
  Stack,
  Row,
  Chip,
  Input,
  Grid,
  Badge,
} from '@/modules/shared/ui'

export const DailyReportsPage: React.FC = () => {
  return (
    <SiteManagerGuard>
      <DailyReportsContent />
    </SiteManagerGuard>
  )
}

const DailyReportsContent: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const [activeTab, setActiveTab] = useState<'today' | 'recent' | 'templates'>('today')

  // Fetch real data using our hooks
  const {
    reports: todayReports,
    loading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useTodayDailyReports()

  const {
    reports: recentReports,
    loading: recentLoading,
    error: recentError,
  } = useRecentDailyReports(undefined, 7)

  const { stats, loading: statsLoading } = useDailyReportsStats()

  // Get today's report data
  const todayReport = todayReports?.[0] || null
  const today = new Date().toISOString().split('T')[0]

  // Helper functions
  const formatWeather = (weather: string) => {
    const weatherMap: { [key: string]: string } = {
      sunny: '맑음',
      cloudy: '흐림',
      rainy: '비',
      snowy: '눈',
      foggy: '안개',
      windy: '바람',
    }
    return weatherMap[weather] || weather
  }

  const getTemperatureText = (high?: number | null, low?: number | null) => {
    if (high !== null && high !== undefined) {
      return low !== null && low !== undefined ? `${high}°C / ${low}°C` : `${high}°C`
    }
    return '기온 미입력'
  }

  // Mock templates for now (could be fetched from API later)
  const templates = [
    {
      id: 1,
      name: '기초공사 일보',
      category: 'foundation',
      lastUsed: '2024-03-15',
      useCount: 8,
    },
    {
      id: 2,
      name: '골조공사 일보',
      category: 'structure',
      lastUsed: '2024-03-10',
      useCount: 12,
    },
    {
      id: 3,
      name: '마감공사 일보',
      category: 'finishing',
      lastUsed: '2024-03-05',
      useCount: 6,
    },
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'default', text: '작성 중', bgColor: 'bg-gray-50' }
      case 'submitted':
        return { color: 'tag1', text: '제출완료', bgColor: 'bg-blue-50' }
      case 'approved':
        return { color: 'tag3', text: '승인됨', bgColor: 'bg-green-50' }
      case 'revision':
        return { color: 'danger', text: '수정요청', bgColor: 'bg-red-50' }
      default:
        return { color: 'default', text: '미확인', bgColor: 'bg-gray-50' }
    }
  }

  return (
    <MobileLayout title="일일 보고서" userRole={profile?.role as 'site_manager'} showBack={true}>
      <div className="p-4 space-y-4">
        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'today' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('today')}
                className="flex-1"
              >
                오늘 보고서
              </Button>
              <Button
                variant={activeTab === 'recent' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('recent')}
                className="flex-1"
              >
                최근 보고서
              </Button>
              <Button
                variant={activeTab === 'templates' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('templates')}
                className="flex-1"
              >
                템플릿
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today Tab */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Loading State */}
            {todayLoading && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="t-body">오늘 보고서를 불러오는 중...</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {todayError && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <p className="t-body text-red-600">데이터를 불러올 수 없습니다</p>
                    <p className="t-cap text-gray-600">{todayError}</p>
                    <Button variant="outline" onClick={refetchToday}>
                      다시 시도
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Report Status */}
            {!todayLoading && !todayError && (
              <Card
                className={`border-l-4 ${
                  todayReport?.status === 'draft' || !todayReport
                    ? 'border-l-orange-500'
                    : 'border-l-green-500'
                }`}
              >
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <Row justify="between" align="center">
                      <div>
                        <h3 className="t-h2">오늘의 일일보고서</h3>
                        <p className="t-cap">{today}</p>
                      </div>
                      <Chip variant={getStatusInfo(todayReport?.status || 'draft').color as any}>
                        {getStatusInfo(todayReport?.status || 'draft').text}
                      </Chip>
                    </Row>

                    {(!todayReport || todayReport.status === 'draft') && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="t-cap font-medium">
                          ⏰{' '}
                          {todayReport ? '보고서 작성을 완료해주세요' : '보고서 작성이 필요합니다'}
                        </p>
                        <p className="t-cap">마감시간: 오늘 18:00</p>
                      </div>
                    )}

                    <Row gap="sm">
                      <Button variant="primary" className="flex-1">
                        {todayReport
                          ? todayReport.status === 'draft'
                            ? '작성하기'
                            : '수정하기'
                          : '작성하기'}
                      </Button>
                      {todayReport && (
                        <Button variant="outline" className="flex-1">
                          미리보기
                        </Button>
                      )}
                    </Row>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Today's Overview */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h2 mb-3">오늘 현장 개요</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl mb-1">☀️</p>
                    <p className="t-cap">날씨</p>
                    <p className="t-body font-medium">
                      {todayReport?.weather ? formatWeather(todayReport.weather) : '미입력'}
                    </p>
                    <p className="t-cap">
                      {getTemperatureText(
                        todayReport?.temperature_high,
                        todayReport?.temperature_low
                      )}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl mb-1">👥</p>
                    <p className="t-cap">출근 현황</p>
                    <p className="t-body font-medium">{todayReport?.total_workers || 0}명</p>
                    <p className="t-cap">현재 투입</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl mb-1">🏗️</p>
                    <p className="t-cap">작업 현황</p>
                    <p className="t-body font-medium">
                      {todayReport?.status === 'approved'
                        ? '완료'
                        : todayReport?.status === 'submitted'
                          ? '진행중'
                          : '미시작'}
                    </p>
                    <p className="t-cap">
                      {todayReport?.work_start_time
                        ? `${todayReport.work_start_time.substring(0, 5)} 시작`
                        : '시작 예정'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl mb-1">⚠️</p>
                    <p className="t-cap">안전 점검</p>
                    <p className="t-body font-medium">
                      {todayReport?.safety_notes ? '점검완료' : '점검필요'}
                    </p>
                    <p className="t-cap">{todayReport?.safety_notes ? '양호' : '미점검'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Description */}
            {todayReport?.work_description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="t-h2 mb-3">오늘 작업 내용</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="t-body">{todayReport.work_description}</p>
                  </div>
                  {todayReport.special_notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="t-cap font-medium text-blue-800 mb-1">특이사항</p>
                      <p className="t-body text-blue-700">{todayReport.special_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h2 mb-3">빠른 작업</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-xl">📸</span>
                    <span className="text-sm">현장 사진</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-xl">👥</span>
                    <span className="text-sm">출근 체크</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm">안전 점검</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-xl">📝</span>
                    <span className="text-sm">작업 일지</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === 'recent' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">최근 보고서 내역</h3>
              <Button variant="outline" className="text-sm px-3 py-1 h-auto">
                전체보기
              </Button>
            </div>

            {/* Loading State */}
            {recentLoading && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="t-body">최근 보고서를 불러오는 중...</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {recentError && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <p className="t-body text-red-600">데이터를 불러올 수 없습니다</p>
                    <p className="t-cap text-gray-600">{recentError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Reports List */}
            {!recentLoading && !recentError && recentReports.length === 0 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="t-body text-gray-600">최근 작성된 보고서가 없습니다</p>
                </CardContent>
              </Card>
            )}

            {!recentLoading &&
              !recentError &&
              recentReports.map(report => {
                const statusInfo = getStatusInfo(report.status)
                const reportDate = new Date(report.work_date).toLocaleDateString('ko-KR')
                const submittedDate = new Date(report.created_at).toLocaleDateString('ko-KR')

                return (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <Stack gap="sm">
                        <Row justify="between" align="start">
                          <div className="flex-1">
                            <h4 className="t-body font-medium">{reportDate} 일일보고서</h4>
                            <p className="t-cap">
                              날씨: {formatWeather(report.weather)} | 작업자: {report.total_workers}
                              명
                            </p>
                            <p className="t-cap">작성일: {submittedDate}</p>
                            {report.sites && (
                              <p className="t-cap text-blue-600">현장: {report.sites.name}</p>
                            )}
                          </div>
                          <Chip variant={statusInfo.color as any}>{statusInfo.text}</Chip>
                        </Row>

                        <Row gap="sm">
                          <Button variant="outline" className="flex-1 text-sm">
                            보기
                          </Button>
                          <Button variant="ghost" className="text-sm px-3">
                            공유
                          </Button>
                          {(report.status === 'draft' || report.status === 'rejected') && (
                            <Button variant="primary" className="text-sm px-3">
                              수정
                            </Button>
                          )}
                        </Row>
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">보고서 템플릿</h3>
              <Button variant="primary" className="text-sm px-3 py-1 h-auto">
                + 새 템플릿
              </Button>
            </div>

            {templates.map(template => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <Row justify="between" align="start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📄</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="t-body font-medium">{template.name}</h4>
                          <p className="t-cap">
                            마지막 사용: {template.lastUsed} | 사용횟수: {template.useCount}회
                          </p>
                        </div>
                      </div>
                      <Badge variant="tag1" />
                    </Row>

                    <Row gap="sm">
                      <Button variant="primary" className="flex-1 text-sm">
                        템플릿 사용
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm">
                        미리보기
                      </Button>
                      <Button variant="ghost" className="text-sm px-3">
                        편집
                      </Button>
                    </Row>
                  </Stack>
                </CardContent>
              </Card>
            ))}

            {/* Default Templates */}
            <Card>
              <CardContent className="p-4">
                <h4 className="t-body font-medium mb-3">기본 템플릿</h4>
                <div className="grid grid-cols-1 gap-2">
                  {['표준 일일보고서', '안전점검 보고서', '진행률 보고서', '자재사용 보고서'].map(
                    (template, index) => (
                      <Row
                        key={index}
                        justify="between"
                        align="center"
                        className="p-2 bg-gray-50 rounded"
                      >
                        <span className="t-cap">{template}</span>
                        <Button variant="outline" className="text-xs px-2 py-1 h-auto">
                          사용
                        </Button>
                      </Row>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
