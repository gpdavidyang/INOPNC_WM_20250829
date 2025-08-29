'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import {
  Bell,
  Send,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createNotification } from '@/app/actions/notifications'
import { toast } from 'sonner'
import type { NotificationType } from '@/types/notifications'

export function TestNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [testForm, setTestForm] = useState({
    type: 'info' as NotificationType,
    title: '',
    message: '',
    userId: '',
    actionUrl: ''
  })

  const handleDirectNotification = async () => {
    if (!testForm.title || !testForm.message || !testForm.userId) {
      toast.error('제목, 메시지, 사용자 ID를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await createNotification({
        user_id: testForm.userId,
        template_code: 'test_notification',
        variables: {
          title: testForm.title,
          message: testForm.message,
          type: testForm.type
        },
        action_url: testForm.actionUrl || undefined
      })

      if (result.success) {
        toast.success('테스트 알림이 발송되었습니다!')
        setTestForm({
          type: 'info',
          title: '',
          message: '',
          userId: '',
          actionUrl: ''
        })
      } else {
        toast.error(result.error || '알림 발송에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSystemAnnouncement = async () => {
    setLoading(true)
    try {
      // Create a system announcement notification for current user as test
      const result = await createNotification({
        user_id: 'current_user', // This would need to be replaced with actual user ID
        template_code: 'system_announcement',
        variables: {
          title: '시스템 공지사항 테스트',
          message: '이것은 시스템 공지사항 테스트 메시지입니다.',
          type: 'system'
        }
      })
      
      if (result.success) {
        toast.success('시스템 공지사항이 발송되었습니다!')
      } else {
        toast.error(result.error || '시스템 공지사항 발송에 실패했습니다.')
      }
    } catch (error) {
      toast.error('시스템 공지사항 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLowStockNotification = async () => {
    setLoading(true)
    try {
      // Create a low stock notification for current user as test
      const result = await createNotification({
        user_id: 'current_user', // This would need to be replaced with actual user ID
        template_code: 'low_stock',
        variables: {
          title: 'NPC-1000 재고 부족 알림',
          message: '현재 재고가 500kg으로 최소 재고량(1000kg) 이하입니다.',
          type: 'warning'
        },
        action_url: '/dashboard/materials/npc1000'
      })
      
      if (result.success) {
        toast.success('재고 부족 알림이 발송되었습니다!')
      } else {
        toast.error(result.error || '재고 부족 알림 발송에 실패했습니다.')
      }
    } catch (error) {
      toast.error('재고 부족 알림 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TestTube className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">알림 시스템 테스트</h1>
            <p className="text-sm text-gray-600 mt-1">알림 시스템의 동작을 테스트할 수 있습니다</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Direct Notification Test */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">직접 알림 발송</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-id">사용자 ID</Label>
                <Input
                  id="user-id"
                  value={testForm.userId}
                  onChange={(e) => setTestForm(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="알림을 받을 사용자 ID"
                />
              </div>
              
              <div>
                <Label htmlFor="notification-type">알림 유형</Label>
                <Select 
                  value={testForm.type} 
                  onValueChange={(value: NotificationType) => setTestForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">정보</SelectItem>
                    <SelectItem value="success">성공</SelectItem>
                    <SelectItem value="warning">경고</SelectItem>
                    <SelectItem value="error">오류</SelectItem>
                    <SelectItem value="system">시스템</SelectItem>
                    <SelectItem value="approval">승인</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={testForm.title}
                  onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="알림 제목"
                />
              </div>
              
              <div>
                <Label htmlFor="message">메시지</Label>
                <Textarea
                  id="message"
                  value={testForm.message}
                  onChange={(e) => setTestForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="알림 메시지"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="action-url">액션 URL (선택사항)</Label>
                <Input
                  id="action-url"
                  value={testForm.actionUrl}
                  onChange={(e) => setTestForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                  placeholder="/dashboard/daily-reports"
                />
              </div>
              
              <Button 
                onClick={handleDirectNotification}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                테스트 알림 발송
              </Button>
            </div>
          </Card>

          {/* Preset Tests */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TestTube className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">사전 정의된 테스트</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">시스템 공지사항</h3>
                <p className="text-sm text-gray-600 mb-3">
                  모든 역할의 사용자에게 시스템 공지사항을 발송합니다.
                </p>
                <Button
                  onClick={handleSystemAnnouncement}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Info className="w-4 h-4 mr-2" />
                  )}
                  시스템 공지 테스트
                </Button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">재고 부족 알림</h3>
                <p className="text-sm text-gray-600 mb-3">
                  현장 관리자에게 NPC-1000 재고 부족 알림을 발송합니다.
                </p>
                <Button
                  onClick={handleLowStockNotification}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  재고 부족 테스트
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        {testForm.title && testForm.message && (
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 미리보기</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(testForm.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{testForm.title}</h3>
                  <p className="text-sm text-gray-600">{testForm.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>방금 전</span>
                    {testForm.actionUrl && (
                      <span className="text-blue-600">액션 링크 포함</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}