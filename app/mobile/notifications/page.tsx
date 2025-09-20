'use client'

import React, { useState } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { Card, CardContent, Button, Stack, Row, Chip, Badge } from '@/modules/shared/ui'

export default function MobileNotificationsPage() {
  return (
    <MobileAuthGuard>
      <NotificationsContent />
    </MobileAuthGuard>
  )
}

const NotificationsContent: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('all')

  const notifications = [
    {
      id: 1,
      title: '새로운 현장 배정',
      message: '서울 본사 건설현장에 배정되었습니다.',
      type: 'assignment',
      time: '방금 전',
      read: false,
      important: true,
    },
    {
      id: 2,
      title: '안전교육 이수 알림',
      message: '월간 안전교육을 이수해주세요. 마감일: 3월 25일',
      type: 'safety',
      time: '30분 전',
      read: false,
      important: true,
    },
    {
      id: 3,
      title: '자재 요청 승인',
      message: '시멘트 100kg 요청이 승인되었습니다.',
      type: 'materials',
      time: '1시간 전',
      read: true,
      important: false,
    },
    {
      id: 4,
      title: '출근 시간 알림',
      message: '내일 출근 시간이 08:00로 변경되었습니다.',
      type: 'schedule',
      time: '2시간 전',
      read: false,
      important: false,
    },
    {
      id: 5,
      title: '급여명세서 발급',
      message: '3월 급여명세서가 발급되었습니다.',
      type: 'payroll',
      time: '어제',
      read: true,
      important: false,
    },
    {
      id: 6,
      title: '현장 공지사항',
      message: '우천으로 인한 작업 일정 변경 안내',
      type: 'announcement',
      time: '2일 전',
      read: true,
      important: false,
    },
    {
      id: 7,
      title: '문서 제출 요청',
      message: '건강검진서 제출 기한이 임박했습니다.',
      type: 'documents',
      time: '3일 전',
      read: false,
      important: true,
    },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '👤'
      case 'safety':
        return '⚠️'
      case 'materials':
        return '📦'
      case 'schedule':
        return '⏰'
      case 'payroll':
        return '💰'
      case 'announcement':
        return '📢'
      case 'documents':
        return '📄'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-50'
      case 'safety':
        return 'bg-red-50'
      case 'materials':
        return 'bg-green-50'
      case 'schedule':
        return 'bg-orange-50'
      case 'payroll':
        return 'bg-purple-50'
      case 'announcement':
        return 'bg-yellow-50'
      case 'documents':
        return 'bg-gray-50'
      default:
        return 'bg-gray-50'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read
      case 'important':
        return notification.important
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const importantCount = notifications.filter(n => n.important).length

  return (
    <MobileLayoutShell>
      <div className="px-4 pb-6 space-y-4">
        <header className="pt-6">
          <h1 className="t-h2">알림</h1>
        </header>
        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('all')}
                className="flex-1"
              >
                전체 ({notifications.length})
              </Button>
              <Button
                variant={activeTab === 'unread' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('unread')}
                className="flex-1 relative"
              >
                읽지 않음
                {unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === 'important' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('important')}
                className="flex-1"
              >
                중요 ({importantCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <Row gap="sm">
              <Button variant="outline" className="flex-1">
                모두 읽음
              </Button>
              <Button variant="outline" className="flex-1">
                선택 삭제
              </Button>
              <Button variant="ghost" className="px-3">
                ⚙️
              </Button>
            </Row>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`${
                !notification.read ? 'border-l-4 border-l-blue-500' : ''
              } cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <CardContent className="p-4">
                <Stack gap="sm">
                  <Row justify="between" align="start">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.type)}`}
                      >
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`t-body ${!notification.read ? 'font-bold' : 'font-medium'}`}
                          >
                            {notification.title}
                          </h4>
                          {notification.important && <Badge variant="tag1" />}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p
                          className={`t-cap ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}
                        >
                          {notification.message}
                        </p>
                        <p className="t-cap text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                      ⋯
                    </Button>
                  </Row>

                  {/* Action buttons for specific notification types */}
                  {notification.type === 'safety' && !notification.read && (
                    <Row gap="sm" className="mt-2">
                      <Button variant="primary" className="flex-1 text-sm">
                        교육 받기
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm">
                        나중에
                      </Button>
                    </Row>
                  )}

                  {notification.type === 'documents' && !notification.read && (
                    <Row gap="sm" className="mt-2">
                      <Button variant="primary" className="flex-1 text-sm">
                        문서 제출
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm">
                        확인
                      </Button>
                    </Row>
                  )}

                  {notification.type === 'materials' && (
                    <Row gap="sm" className="mt-2">
                      <Button variant="outline" className="flex-1 text-sm">
                        자세히 보기
                      </Button>
                    </Row>
                  )}

                  {notification.type === 'payroll' && (
                    <Row gap="sm" className="mt-2">
                      <Button variant="primary" className="flex-1 text-sm">
                        급여명세서 보기
                      </Button>
                    </Row>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">
                {activeTab === 'unread' ? '📭' : activeTab === 'important' ? '⭐' : '🔔'}
              </div>
              <p className="t-body mb-2">
                {activeTab === 'unread'
                  ? '읽지 않은 알림이 없습니다.'
                  : activeTab === 'important'
                    ? '중요한 알림이 없습니다.'
                    : '알림이 없습니다.'}
              </p>
              <p className="t-cap">
                {activeTab === 'unread'
                  ? '모든 알림을 확인하셨습니다.'
                  : activeTab === 'important'
                    ? '중요 알림이 도착하면 여기에 표시됩니다.'
                    : '새로운 알림이 도착하면 여기에 표시됩니다.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">알림 설정</h3>
            <Stack gap="sm">
              <Row justify="between" align="center">
                <span className="t-body">푸시 알림</span>
                <Button variant="outline" className="text-sm px-3 py-1 h-auto">
                  설정
                </Button>
              </Row>
              <Row justify="between" align="center">
                <span className="t-body">이메일 알림</span>
                <Button variant="outline" className="text-sm px-3 py-1 h-auto">
                  설정
                </Button>
              </Row>
              <Row justify="between" align="center">
                <span className="t-body">알림 시간</span>
                <Button variant="outline" className="text-sm px-3 py-1 h-auto">
                  08:00 - 18:00
                </Button>
              </Row>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </MobileLayoutShell>
  )
}
