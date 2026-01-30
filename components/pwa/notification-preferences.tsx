'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useProfile } from '@/hooks/use-profile'
import { pushNotificationService } from '@/lib/push-notifications'
import { Bell, Clock, FileText, Moon, Shield, Volume2, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function NotificationPreferences() {
  const { profile, loading, updateNotificationPreferences } = useProfile()
  const [preferences, setPreferences] = useState<any>({
    push_enabled: false,
    email_enabled: false,
    daily_report_reminders: true,
    daily_report_updates: true,
    site_announcements: true,
    safety_alerts: true,
    equipment_maintenance: true,
    material_approvals: true,
    sound_enabled: true,
    vibration_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  })
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize state from profile
  useEffect(() => {
    if (profile?.notification_preferences) {
      setPreferences((prev: any) => ({
        ...prev,
        ...profile.notification_preferences,
      }))
    }
  }, [profile])

  // Check initial permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  const handleToggle = async (key: string, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    // Auto-save on toggle
    try {
      if (key === 'push_enabled' && value === true) {
        // Request permission if enabling push
        const permission = await pushNotificationService.requestPermission()
        setPermissionStatus(permission)
        if (permission !== 'granted') {
          toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.')
          // Revert toggle
          setPreferences({ ...preferences, [key]: false })
          return
        }
      }

      // Optimistic update done, now sync with server
      // We debouncing could be better here, but for now direct saving
      await updateNotificationPreferences(newPreferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('설정을 저장하지 못했습니다.')
      // Revert on error
      setPreferences(preferences)
    }
  }

  const handleTimeChange = async (key: string, value: string) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    // For text inputs like time, we might want explicit save or blur save.
    // For simplicity here, we save on change but in real app handleBlur is better.
    await updateNotificationPreferences(newPreferences)
  }

  if (loading) {
    return <div className="p-4 text-center">설정을 불러오는 중...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 1. Global Push Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${preferences.push_enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">푸시 알림</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                모든 푸시 알림을 켜거나 끕니다
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.push_enabled}
            onCheckedChange={checked => handleToggle('push_enabled', checked)}
          />
        </div>
        {preferences.push_enabled && permissionStatus === 'denied' && (
          <div className="mt-3 bg-red-50 text-red-600 text-sm p-3 rounded-md">
            ⚠️ 브라우저 알림 권한이 차단되어 있습니다. 브라우저 주소창 왼쪽 아이콘을 눌러 권한을
            허용해주세요.
          </div>
        )}
      </div>

      {/* 1.5. Email Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${preferences.email_enabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-mail"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">이메일 알림</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                푸시 알림을 받지 못할 때 이메일로 받습니다
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_enabled}
            onCheckedChange={checked => handleToggle('email_enabled', checked)}
          />
        </div>
      </div>

      {(preferences.push_enabled || preferences.email_enabled) && (
        <>
          {/* 2. Notification Types */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
              알림 항목
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">작업일지 리마인더</Label>
                    <p className="text-xs text-gray-500">
                      매일 지정된 시간에 작업일지 작성 알림을 받습니다
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.daily_report_reminders}
                  onCheckedChange={checked => handleToggle('daily_report_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">작업일지 업데이트</Label>
                    <p className="text-xs text-gray-500">
                      제출, 승인, 반려 등 작업일지 상태 변경 알림
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.daily_report_updates}
                  onCheckedChange={checked => handleToggle('daily_report_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">안전 경고</Label>
                    <p className="text-xs text-gray-500">
                      긴급 안전 사고 및 기상 악화 경고 (항상 켜둠 권장)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.safety_alerts}
                  onCheckedChange={checked => handleToggle('safety_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">자재 및 장비</Label>
                    <p className="text-xs text-gray-500">자재 승인 요청 및 장비 점검 일정 알림</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.material_approvals} // Unified switch for simplicty, or split if needed
                  onCheckedChange={checked => {
                    handleToggle('material_approvals', checked)
                    handleToggle('equipment_maintenance', checked)
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Quiet Hours & Sound */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
              방해 금지 및 소리
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">방해 금지 시간</Label>
                    <p className="text-xs text-gray-500">설정된 시간 동안은 긴급 알림만 받습니다</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={checked => handleToggle('quiet_hours_enabled', checked)}
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="flex items-center gap-4 ml-8 pl-4 border-l-2 border-gray-100">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">시작</span>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={e => handleTimeChange('quiet_hours_start', e.target.value)}
                      className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <span className="text-gray-400">~</span>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">종료</span>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={e => handleTimeChange('quiet_hours_end', e.target.value)}
                      className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="text-gray-400" />
                  <div>
                    <Label className="text-base">소리 및 진동</Label>
                    <p className="text-xs text-gray-500">알림 수신 시 소리와 진동 사용</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      preferences.sound_enabled ? 'bg-blue-50 text-blue-600 border-blue-200' : ''
                    }
                    onClick={() => handleToggle('sound_enabled', !preferences.sound_enabled)}
                  >
                    소리 {preferences.sound_enabled ? 'ON' : 'OFF'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      preferences.vibration_enabled
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : ''
                    }
                    onClick={() =>
                      handleToggle('vibration_enabled', !preferences.vibration_enabled)
                    }
                  >
                    진동 {preferences.vibration_enabled ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Status / Manual Save Button if needed, here we auto-save mostly */}
      <div className="text-center">
        {/* <Button onClick={saveAll} disabled={isSaving}>설정 저장하기</Button> */}
      </div>
    </div>
  )
}

export default NotificationPreferences
