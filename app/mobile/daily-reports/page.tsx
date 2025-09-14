'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { SiteManagerGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
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

export default function MobileDailyReportsPage() {
  return (
    <SiteManagerGuard>
      <DailyReportsContent />
    </SiteManagerGuard>
  )
}

const DailyReportsContent: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'today' | 'recent' | 'templates'>('today')

  const todayReport = {
    date: '2024-03-21',
    status: 'draft',
    weather: '맑음',
    temperature: '15°C',
    workersAssigned: 12,
    workersPresent: 11,
    workProgress: 85,
    safetyIssues: 0,
    materialUsage: [
      { name: '시멘트', used: 150, unit: 'kg' },
      { name: '철근', used: 25, unit: '개' },
    ],
  }

  const recentReports = [
    {
      id: 1,
      date: '2024-03-20',
      status: 'submitted',
      weather: '흐림',
      workProgress: 90,
      submitted: '18:30',
      approved: true,
    },
    {
      id: 2,
      date: '2024-03-19',
      status: 'approved',
      weather: '맑음',
      workProgress: 88,
      submitted: '17:45',
      approved: true,
    },
    {
      id: 3,
      date: '2024-03-18',
      status: 'revision',
      weather: '비',
      workProgress: 75,
      submitted: '18:15',
      approved: false,
      comment: '자재 사용량 재확인 필요',
    },
  ]

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
    <MobileLayout
      title="일일 보고서"
      userRole={profile?.role as 'site_manager'}
      showNotification={true}
    >
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
            {/* Today's Report Status */}
            <Card
              className={`border-l-4 ${
                todayReport.status === 'draft' ? 'border-l-orange-500' : 'border-l-green-500'
              }`}
            >
              <CardContent className="p-4">
                <Stack gap="sm">
                  <Row justify="between" align="center">
                    <div>
                      <h3 className="t-h2">오늘의 일일보고서</h3>
                      <p className="t-cap">{todayReport.date}</p>
                    </div>
                    <Chip variant={getStatusInfo(todayReport.status).color as any}>
                      {getStatusInfo(todayReport.status).text}
                    </Chip>
                  </Row>

                  {todayReport.status === 'draft' && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="t-cap font-medium">⏰ 보고서 작성이 필요합니다</p>
                      <p className="t-cap">마감시간: 오늘 18:00</p>
                    </div>
                  )}

                  <Row gap="sm">
                    <Button variant="primary" className="flex-1">
                      {todayReport.status === 'draft' ? '작성하기' : '수정하기'}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      미리보기
                    </Button>
                  </Row>
                </Stack>
              </CardContent>
            </Card>

            {/* Today's Overview */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h2 mb-3">오늘 현장 개요</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl mb-1">☀️</p>
                    <p className="t-cap">날씨</p>
                    <p className="t-body font-medium">{todayReport.weather}</p>
                    <p className="t-cap">{todayReport.temperature}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl mb-1">👥</p>
                    <p className="t-cap">출근 현황</p>
                    <p className="t-body font-medium">
                      {todayReport.workersPresent}/{todayReport.workersAssigned}명
                    </p>
                    <p className="t-cap">출근율 92%</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl mb-1">🏗️</p>
                    <p className="t-cap">작업 진행률</p>
                    <p className="t-body font-medium">{todayReport.workProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${todayReport.workProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl mb-1">⚠️</p>
                    <p className="t-cap">안전 이슈</p>
                    <p className="t-body font-medium">{todayReport.safetyIssues}건</p>
                    <p className="t-cap">양호</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Material Usage */}
            <Card>
              <CardContent className="p-4">
                <h3 className="t-h2 mb-3">오늘 자재 사용량</h3>
                <Stack gap="sm">
                  {todayReport.materialUsage.map((material, index) => (
                    <Row key={index} justify="between" className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📦</span>
                        <span className="t-body">{material.name}</span>
                      </div>
                      <span className="t-body font-medium">
                        {material.used} {material.unit}
                      </span>
                    </Row>
                  ))}
                  <Button variant="outline" className="mt-2">
                    + 자재 사용량 추가
                  </Button>
                </Stack>
              </CardContent>
            </Card>

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

            {recentReports.map(report => {
              const statusInfo = getStatusInfo(report.status)

              return (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <Stack gap="sm">
                      <Row justify="between" align="start">
                        <div className="flex-1">
                          <h4 className="t-body font-medium">{report.date} 일일보고서</h4>
                          <p className="t-cap">
                            날씨: {report.weather} | 진행률: {report.workProgress}%
                          </p>
                          <p className="t-cap">제출: {report.submitted}</p>
                          {report.comment && (
                            <p className="t-cap text-red-600 mt-1">💬 {report.comment}</p>
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
                        {report.status === 'revision' && (
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
