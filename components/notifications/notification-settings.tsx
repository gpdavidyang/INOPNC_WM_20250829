'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Shield,
  Volume2,
  VolumeX,
  Settings2,
  Save,
  RotateCcw,
  Info,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationSettings {
  // 푸시 알림 설정
  pushNotifications: {
    enabled: boolean
    workReports: boolean
    systemNotices: boolean
    approvals: boolean
    warnings: boolean
    errors: boolean
  }
  
  // 이메일 알림 설정
  emailNotifications: {
    enabled: boolean
    workReports: boolean
    systemNotices: boolean
    approvals: boolean
    warnings: boolean
    errors: boolean
    dailySummary: boolean
    weeklySummary: boolean
  }
  
  // 알림 시간 설정
  schedule: {
    quietHours: {
      enabled: boolean
      startTime: string // "22:00"
      endTime: string   // "08:00"
    }
    workdaysOnly: boolean
  }
  
  // 사운드 설정
  sound: {
    enabled: boolean
    volume: number // 0-100
    customTone: string
  }
  
  // 개인정보 설정
  privacy: {
    showPreviews: boolean
    showSenderInfo: boolean
  }
}

const defaultSettings: NotificationSettings = {
  pushNotifications: {
    enabled: true,
    workReports: true,
    systemNotices: true,
    approvals: true,
    warnings: true,
    errors: true,
  },
  emailNotifications: {
    enabled: false,
    workReports: false,
    systemNotices: true,
    approvals: true,
    warnings: true,
    errors: true,
    dailySummary: false,
    weeklySummary: false,
  },
  schedule: {
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    workdaysOnly: false,
  },
  sound: {
    enabled: true,
    volume: 80,
    customTone: 'default',
  },
  privacy: {
    showPreviews: true,
    showSenderInfo: true,
  },
}

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error('Failed to parse notification settings:', error)
        }
      }
    }
  }, [isOpen])

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const updateNestedSettings = <K extends keyof NotificationSettings>(
    key: K,
    updates: Partial<NotificationSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 로컬 스토리지에 저장 (실제 구현에서는 서버 API 호출)
      localStorage.setItem('notification-settings', JSON.stringify(settings))
      
      // 실제 구현에서는 서버 API 호출
      // await saveNotificationSettings(settings)
      
      setHasChanges(false)
      toast.success('알림 설정이 저장되었습니다.')
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    toast.info('설정이 기본값으로 초기화되었습니다.')
  }

  const SettingCard = ({ 
    title, 
    description, 
    icon: Icon, 
    children 
  }: { 
    title: string
    description?: string
    icon: any
    children: React.ReactNode 
  }) => (
    <Card className="p-5 sm:p-6 border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {description}
              </p>
            )}
          </div>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '42rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          gap: 0,
          overflow: 'hidden'
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            알림 설정
          </DialogTitle>
          <DialogDescription>
            알림 수신 방식과 시간을 설정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-4" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div className="space-y-6">
          {/* 푸시 알림 설정 */}
          <SettingCard
            title="푸시 알림"
            description="모바일 기기와 브라우저에서 받을 푸시 알림을 설정합니다."
            icon={Smartphone}
          >
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="push-enabled" className="font-medium text-base">
                푸시 알림 사용
              </Label>
              <Switch
                id="push-enabled"
                size="lg"
                checked={settings.pushNotifications.enabled}
                onCheckedChange={(enabled) => 
                  updateNestedSettings('pushNotifications', { enabled })
                }
              />
            </div>
            
            {settings.pushNotifications.enabled && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="push-work-reports" className="text-sm font-medium">
                      작업일지
                    </Label>
                    <Switch
                      id="push-work-reports"
                      size="md"
                      checked={settings.pushNotifications.workReports}
                      onCheckedChange={(workReports) => 
                        updateNestedSettings('pushNotifications', { workReports })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="push-approvals" className="text-sm font-medium">
                      승인 알림
                    </Label>
                    <Switch
                      id="push-approvals"
                      size="md"
                      checked={settings.pushNotifications.approvals}
                      onCheckedChange={(approvals) => 
                        updateNestedSettings('pushNotifications', { approvals })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="push-warnings" className="text-sm font-medium">
                      경고 메시지
                    </Label>
                    <Switch
                      id="push-warnings"
                      size="md"
                      checked={settings.pushNotifications.warnings}
                      onCheckedChange={(warnings) => 
                        updateNestedSettings('pushNotifications', { warnings })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="push-errors" className="text-sm font-medium">
                      오류 알림
                    </Label>
                    <Switch
                      id="push-errors"
                      size="md"
                      checked={settings.pushNotifications.errors}
                      onCheckedChange={(errors) => 
                        updateNestedSettings('pushNotifications', { errors })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </SettingCard>

          {/* 이메일 알림 설정 */}
          <SettingCard
            title="이메일 알림"
            description="등록된 이메일 주소로 받을 알림을 설정합니다."
            icon={Mail}
          >
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="email-enabled" className="font-medium text-base">
                이메일 알림 사용
              </Label>
              <Switch
                id="email-enabled"
                size="lg"
                checked={settings.emailNotifications.enabled}
                onCheckedChange={(enabled) => 
                  updateNestedSettings('emailNotifications', { enabled })
                }
              />
            </div>
            
            {settings.emailNotifications.enabled && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-system" className="text-sm">
                      시스템 공지
                    </Label>
                    <Switch
                      id="email-system"
                      size="md"
                      checked={settings.emailNotifications.systemNotices}
                      onCheckedChange={(systemNotices) => 
                        updateNestedSettings('emailNotifications', { systemNotices })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-approvals" className="text-sm">
                      승인 알림
                    </Label>
                    <Switch
                      id="email-approvals"
                      size="md"
                      checked={settings.emailNotifications.approvals}
                      onCheckedChange={(approvals) => 
                        updateNestedSettings('emailNotifications', { approvals })
                      }
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">주기적 요약</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-daily" className="text-sm">
                        일일 요약
                      </Label>
                      <Switch
                        id="email-daily"
                        size="md"
                        checked={settings.emailNotifications.dailySummary}
                        onCheckedChange={(dailySummary) => 
                          updateNestedSettings('emailNotifications', { dailySummary })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-weekly" className="text-sm">
                        주간 요약
                      </Label>
                      <Switch
                        id="email-weekly"
                        size="md"
                        checked={settings.emailNotifications.weeklySummary}
                        onCheckedChange={(weeklySummary) => 
                          updateNestedSettings('emailNotifications', { weeklySummary })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SettingCard>

          {/* 시간 설정 */}
          <SettingCard
            title="알림 시간"
            description="알림을 받을 시간대를 설정합니다."
            icon={Clock}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours" className="font-medium">
                방해 금지 시간
              </Label>
              <Switch
                id="quiet-hours"
                size="lg"
                checked={settings.schedule.quietHours.enabled}
                onCheckedChange={(enabled) => 
                  updateNestedSettings('schedule', { 
                    quietHours: { ...settings.schedule.quietHours, enabled } 
                  })
                }
              />
            </div>
            
            {settings.schedule.quietHours.enabled && (
              <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-time" className="text-sm">
                      시작 시간
                    </Label>
                    <Select
                      value={settings.schedule.quietHours.startTime}
                      onValueChange={(startTime) => 
                        updateNestedSettings('schedule', {
                          quietHours: { ...settings.schedule.quietHours, startTime }
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-sm">
                      종료 시간
                    </Label>
                    <Select
                      value={settings.schedule.quietHours.endTime}
                      onValueChange={(endTime) => 
                        updateNestedSettings('schedule', {
                          quietHours: { ...settings.schedule.quietHours, endTime }
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="workdays-only" className="font-medium">
                평일만 알림 받기
              </Label>
              <Switch
                id="workdays-only"
                size="lg"
                checked={settings.schedule.workdaysOnly}
                onCheckedChange={(workdaysOnly) => 
                  updateNestedSettings('schedule', { workdaysOnly })
                }
              />
            </div>
          </SettingCard>

          {/* 사운드 설정 */}
          <SettingCard
            title="사운드"
            description="알림음과 진동 설정을 관리합니다."
            icon={settings.sound.enabled ? Volume2 : VolumeX}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled" className="font-medium">
                알림음 사용
              </Label>
              <Switch
                id="sound-enabled"
                size="lg"
                checked={settings.sound.enabled}
                onCheckedChange={(enabled) => 
                  updateNestedSettings('sound', { enabled })
                }
              />
            </div>
            
            {settings.sound.enabled && (
              <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-3">
                <div>
                  <Label htmlFor="volume" className="text-sm mb-2 block">
                    볼륨: {settings.sound.volume}%
                  </Label>
                  <input
                    type="range"
                    id="volume"
                    min="0"
                    max="100"
                    value={settings.sound.volume}
                    onChange={(e) => 
                      updateNestedSettings('sound', { volume: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            )}
          </SettingCard>

          {/* 개인정보 설정 */}
          <SettingCard
            title="개인정보"
            description="알림 미리보기와 발신자 정보 표시를 설정합니다."
            icon={Shield}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-previews" className="font-medium">
                  알림 내용 미리보기
                </Label>
                <Switch
                  id="show-previews"
                  size="lg"
                  checked={settings.privacy.showPreviews}
                  onCheckedChange={(showPreviews) => 
                    updateNestedSettings('privacy', { showPreviews })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-sender" className="font-medium">
                  발신자 정보 표시
                </Label>
                <Switch
                  id="show-sender"
                  size="lg"
                  checked={settings.privacy.showSenderInfo}
                  onCheckedChange={(showSenderInfo) => 
                    updateNestedSettings('privacy', { showSenderInfo })
                  }
                />
              </div>
            </div>
          </SettingCard>

          {/* 정보 카드 */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  알림 권한 안내
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  브라우저에서 푸시 알림을 받으려면 알림 권한을 허용해주세요. 
                  설정은 언제든지 변경할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2" style={{ flexShrink: 0 }}>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="min-w-[80px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                저장 중...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}