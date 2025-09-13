'use client'

import { useState } from 'react'
import { Bell, Send, Users, MapPin, Shield, Clock, AlertTriangle, Wrench, Megaphone } from 'lucide-react'
import { pushNotificationService, notificationHelpers } from '@/lib/push-notifications'

interface NotificationTest {
  type: 'material_approval' | 'daily_report_reminder' | 'safety_alert' | 'equipment_maintenance' | 'site_announcement'
  title: string
  body: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  targetType: 'users' | 'sites' | 'roles'
  targetIds: string[]
  scheduleAt?: string
}

const NOTIFICATION_TYPES = [
  {
    type: 'material_approval' as const,
    icon: <Bell className="h-5 w-5 text-blue-500" />,
    name: '자재 승인',
    description: '자재 요청 승인 알림',
    urgency: 'high' as const,
    template: {
      title: '자재 요청 승인 필요',
      body: 'NPC-1000 자재 요청이 승인을 기다리고 있습니다'
    }
  },
  {
    type: 'daily_report_reminder' as const,
    icon: <Clock className="h-5 w-5 text-orange-500" />,
    name: '작업일지 리마인더',
    description: '작업일지 작성 알림',
    urgency: 'medium' as const,
    template: {
      title: '작업일지 작성 리마인더',
      body: '오늘의 작업일지를 작성해주세요'
    }
  },
  {
    type: 'safety_alert' as const,
    icon: <Shield className="h-5 w-5 text-red-500" />,
    name: '안전 경고',
    description: '안전사고 및 위험상황 알림',
    urgency: 'critical' as const,
    template: {
      title: '⚠️ 안전 경고',
      body: '현장에서 안전사고가 발생했습니다. 즉시 확인하세요.'
    }
  },
  {
    type: 'equipment_maintenance' as const,
    icon: <Wrench className="h-5 w-5 text-purple-500" />,
    name: '장비 정비',
    description: '장비 점검 및 정비 알림',
    urgency: 'medium' as const,
    template: {
      title: '장비 정비 알림',
      body: '크레인 정비 시간입니다'
    }
  },
  {
    type: 'site_announcement' as const,
    icon: <Megaphone className="h-5 w-5 text-green-500" />,
    name: '현장 공지',
    description: '일반 공지사항',
    urgency: 'low' as const,
    template: {
      title: '📢 현장 공지',
      body: '새로운 안전 지침이 업데이트되었습니다'
    }
  }
]

export function NotificationTester() {
  const [test, setTest] = useState<NotificationTest>({
    type: 'material_approval',
    title: '자재 요청 승인 필요',
    body: 'NPC-1000 자재 요청이 승인을 기다리고 있습니다',
    urgency: 'high',
    targetType: 'users',
    targetIds: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTypeChange = (type: typeof test.type) => {
    const template = NOTIFICATION_TYPES.find(t => t.type === type)
    if (template) {
      setTest(prev => ({
        ...prev,
        type,
        title: template.template.title,
        body: template.template.body,
        urgency: template.urgency
      }))
    }
  }

  const handleSendTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const options = {
        notificationType: test.type,
        payload: {
          title: test.title,
          body: test.body,
          urgency: test.urgency,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-icon.png',
          requireInteraction: test.urgency === 'critical',
          data: {
            test: true,
            timestamp: Date.now()
          }
        },
        scheduleAt: test.scheduleAt
      }

      // Add target criteria
      if (test.targetType === 'users' && test.targetIds.length > 0) {
        Object.assign(options, { userIds: test.targetIds })
      } else if (test.targetType === 'sites' && test.targetIds.length > 0) {
        Object.assign(options, { siteIds: test.targetIds })
      } else if (test.targetType === 'roles' && test.targetIds.length > 0) {
        Object.assign(options, { roles: test.targetIds })
      }

      const response = await pushNotificationService.sendNotification(options)
      const data = await response.json()

      setResult({
        success: response.ok,
        data: data,
        status: response.status
      })

    } catch (error: unknown) {
      setResult({
        success: false,
        error: error.message,
        status: 500
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendPredefined = async (type: string) => {
    setIsLoading(true)
    setResult(null)

    try {
      let response
      
      switch (type) {
        case 'material_approval':
          response = await notificationHelpers.sendMaterialApproval(
            'test-request-id',
            ['current-user'], // Send to current user for testing
            'NPC-1000'
          )
          break
        case 'daily_report_reminder':
          response = await notificationHelpers.sendDailyReportReminder(['test-site-id'])
          break
        case 'safety_alert':
          response = await notificationHelpers.sendSafetyAlert(
            ['test-site-id'],
            '현장에서 안전사고가 발생했습니다. 즉시 확인하세요.',
            'test-incident-id'
          )
          break
        case 'equipment_maintenance':
          response = await notificationHelpers.sendEquipmentMaintenance(
            'test-equipment-id',
            ['current-user'],
            '크레인'
          )
          break
        case 'site_announcement':
          response = await notificationHelpers.sendSiteAnnouncement(
            ['test-site-id'],
            '현장 공지',
            '새로운 안전 지침이 업데이트되었습니다',
            'test-announcement-id'
          )
          break
        default:
          throw new Error('Unknown notification type')
      }

      const data = await response.json()
      setResult({
        success: response.ok,
        data: data,
        status: response.status
      })

    } catch (error: unknown) {
      setResult({
        success: false,
        error: error.message,
        status: 500
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            푸시 알림 테스터
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            푸시 알림 시스템을 테스트하고 확인하세요
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            알림 유형
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {NOTIFICATION_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => handleTypeChange(type.type)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  test.type === type.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {type.icon}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목
            </label>
            <input
              type="text"
              value={test.title}
              onChange={(e) => setTest(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              긴급도
            </label>
            <select
              value={test.urgency}
              onChange={(e) => setTest(prev => ({ ...prev, urgency: e.target.value as any }))}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="critical">긴급</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            메시지 내용
          </label>
          <textarea
            value={test.body}
            onChange={(e) => setTest(prev => ({ ...prev, body: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            대상 선택
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="users"
                checked={test.targetType === 'users'}
                onChange={(e) => setTest(prev => ({ ...prev, targetType: e.target.value as any, targetIds: [] }))}
                className="mr-2"
              />
              <Users className="h-4 w-4 mr-1" />
              사용자
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="sites"
                checked={test.targetType === 'sites'}
                onChange={(e) => setTest(prev => ({ ...prev, targetType: e.target.value as any, targetIds: [] }))}
                className="mr-2"
              />
              <MapPin className="h-4 w-4 mr-1" />
              현장
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="roles"
                checked={test.targetType === 'roles'}
                onChange={(e) => setTest(prev => ({ ...prev, targetType: e.target.value as any, targetIds: [] }))}
                className="mr-2"
              />
              역할
            </label>
          </div>
          
          <input
            type="text"
            placeholder={`${test.targetType === 'users' ? '사용자 ID' : test.targetType === 'sites' ? '현장 ID' : '역할명'}을 쉼표로 구분하여 입력 (비어있으면 전체)`}
            value={test.targetIds.join(', ')}
            onChange={(e) => setTest(prev => ({ 
              ...prev, 
              targetIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            예약 발송 (선택사항)
          </label>
          <input
            type="datetime-local"
            value={test.scheduleAt || ''}
            onChange={(e) => setTest(prev => ({ ...prev, scheduleAt: e.target.value || undefined }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSendTest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            <Send className="h-4 w-4" />
            {isLoading ? '발송 중...' : '커스텀 알림 발송'}
          </button>

          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => handleSendPredefined(type.type)}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
              >
                {type.icon}
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <h4 className={`font-medium mb-2 ${
              result.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {result.success ? '✅ 발송 성공' : '❌ 발송 실패'}
            </h4>
            <pre className={`text-sm overflow-auto ${
              result.success 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}