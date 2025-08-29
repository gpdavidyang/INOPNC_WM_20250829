'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Moon,
  Sun,
  Type,
  Hand,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useFontSize, FontSize } from '@/contexts/FontSizeContext'
import { useTouchMode, TouchMode } from '@/contexts/TouchModeContext'
import { useTheme } from 'next-themes'
import { signOut, updatePassword, updateNotificationPreferences } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface ProfilePageClientProps {
  user: User
  profile: Profile & {
    organization?: { name: string } | null
    site?: { name: string; address: string } | null
  }
}

const roleLabels: Record<string, string> = {
  worker: '작업자',
  site_manager: '현장관리자', 
  customer_manager: '파트너사',
  admin: '관리자',
  system_admin: '시스템관리자'
}

export function ProfilePageClient({ user, profile }: ProfilePageClientProps) {
  const router = useRouter()
  const { fontSize, setFontSize } = useFontSize()
  const { touchMode, setTouchMode } = useTouchMode()
  const { theme, setTheme } = useTheme()
  
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // 알림 설정 상태
  const [notificationSettings, setNotificationSettings] = useState({
    push_enabled: profile.notification_preferences?.push_enabled || false,
    material_approvals: profile.notification_preferences?.material_approvals ?? true,
    daily_report_reminders: profile.notification_preferences?.daily_report_reminders ?? true,
    safety_alerts: profile.notification_preferences?.safety_alerts ?? true,
    equipment_maintenance: profile.notification_preferences?.equipment_maintenance ?? true,
    site_announcements: profile.notification_preferences?.site_announcements ?? false,
    quiet_hours_enabled: profile.notification_preferences?.quiet_hours_enabled || false,
    quiet_hours_start: profile.notification_preferences?.quiet_hours_start || '22:00',
    quiet_hours_end: profile.notification_preferences?.quiet_hours_end || '08:00',
    sound_enabled: profile.notification_preferences?.sound_enabled ?? true,
    vibration_enabled: profile.notification_preferences?.vibration_enabled ?? true,
    show_previews: profile.notification_preferences?.show_previews ?? true,
    group_notifications: profile.notification_preferences?.group_notifications ?? true
  })
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [notificationSaveSuccess, setNotificationSaveSuccess] = useState(false)

  const handlePasswordUpdate = async () => {
    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다')
      return
    }

    setIsUpdatingPassword(true)
    setPasswordError('')

    const result = await updatePassword(currentPassword, newPassword)
    
    if (result.success) {
      setPasswordSuccess(true)
      setPasswordError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setIsEditingPassword(false)
        setPasswordSuccess(false)
      }, 2000)
    } else {
      setPasswordError(result.error || '비밀번호 변경에 실패했습니다')
    }
    
    setIsUpdatingPassword(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleNotificationSettingChange = (key: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveNotificationSettings = async () => {
    setIsSavingNotifications(true)
    
    const result = await updateNotificationPreferences(notificationSettings)
    
    if (result.success) {
      setNotificationSaveSuccess(true)
      setTimeout(() => {
        setNotificationSaveSuccess(false)
      }, 3000)
    }
    
    setIsSavingNotifications(false)
  }

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    if (Notification.permission === 'denied') {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 변경해주세요.')
      return
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      handleNotificationSettingChange('push_enabled', true)
      // 자동 저장
      const result = await updateNotificationPreferences({
        ...notificationSettings,
        push_enabled: true
      })
      if (result.success) {
        setNotificationSaveSuccess(true)
        setTimeout(() => {
          setNotificationSaveSuccess(false)
        }, 3000)
      }
    } else {
      handleNotificationSettingChange('push_enabled', false)
    }
  }

  return (
    <div className="space-y-2">
      {/* 기본 정보 카드 - UI Guidelines 적용: 고밀도 정보 레이아웃 */}
      <Card className="p-3 bg-premium-light dark:bg-premium-dark elevation-sm theme-transition">
        {/* 프로필 헤더 - 모바일 최적화된 레이아웃 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-toss-blue-500 to-toss-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 elevation-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate text-construction-xl">
              {profile.full_name}
            </h2>
            <Badge variant="secondary" className="mt-1 text-xs font-medium bg-toss-blue-50 text-toss-blue-700 dark:bg-toss-blue-900/20 dark:text-toss-blue-300">
              {roleLabels[profile.role] || profile.role}
            </Badge>
          </div>
        </div>

        {/* 정보 목록 - 고밀도 정보 디자인 적용 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 min-h-[44px]">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">이메일</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{profile.email}</p>
            </div>
          </div>

          {profile.phone && (
            <div className="flex items-center gap-3 min-h-[44px]">
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">연락처</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile.organization && (
            <div className="flex items-center gap-3 min-h-[44px]">
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">소속</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {profile.organization.name}
                </p>
              </div>
            </div>
          )}

          {profile.site && (
            <div className="flex items-center gap-3 min-h-[44px]">
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">현재 현장</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {profile.site.name}
                </p>
                {profile.site.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {profile.site.address}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 min-h-[44px]">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">가입일</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {format(new Date(profile.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 비밀번호 변경 카드 - UI Guidelines 적용 */}
      <Card className="p-3 bg-premium-light dark:bg-premium-dark elevation-sm theme-transition">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">비밀번호 변경</h3>
          </div>
          {!isEditingPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPassword(true)}
              className="min-h-[44px] px-4 border-toss-blue-200 text-toss-blue-700 hover:bg-toss-blue-50 dark:border-toss-blue-700 dark:text-toss-blue-300 dark:hover:bg-toss-blue-900/20"
            >
              변경
            </Button>
          )}
        </div>

        {isEditingPassword && (
          <div className="space-y-3">
            {/* 현재 비밀번호 */}
            <div>
              <Label htmlFor="current-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                현재 비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  className="min-h-[48px] pr-12 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-toss-blue-500 focus:ring-toss-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 새 비밀번호 */}
            <div>
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                새 비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (최소 6자)"
                  className="min-h-[48px] pr-12 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-toss-blue-500 focus:ring-toss-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                새 비밀번호 확인
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="min-h-[48px] pr-12 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-toss-blue-500 focus:ring-toss-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 에러 메시지 - UI Guidelines 적용 */}
            {passwordError && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">{passwordError}</span>
              </div>
            )}

            {/* 성공 메시지 */}
            {passwordSuccess && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">비밀번호가 성공적으로 변경되었습니다</span>
              </div>
            )}

            {/* 액션 버튼 - 터치 타겟 최적화 */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handlePasswordUpdate}
                disabled={isUpdatingPassword}
                className="flex-1 min-h-[48px] bg-toss-blue-500 hover:bg-toss-blue-600 text-white font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingPassword ? '변경 중...' : '변경하기'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingPassword(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess(false)
                }}
                disabled={isUpdatingPassword}
                className="flex-1 min-h-[48px] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 앱 설정 카드 - Hidden */}
      {false && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">앱 설정</h3>
          </div>

          <div className="space-y-6">
            {/* 글자 크기 설정 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-gray-400" />
                <Label>글자 크기</Label>
              </div>
              <RadioGroup
                value={fontSize}
                onValueChange={(value) => setFontSize(value as FontSize)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small" className="cursor-pointer">
                    작게
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="cursor-pointer">
                    보통
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large" className="cursor-pointer">
                    크게
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 다크 모드 설정 */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-gray-400" />
                  )}
                  <Label htmlFor="dark-mode">다크 모드</Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </div>

            {/* 터치 모드 설정 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hand className="w-4 h-4 text-gray-400" />
                <Label>터치 모드</Label>
              </div>
              <RadioGroup
                value={touchMode}
                onValueChange={(value) => setTouchMode(value as TouchMode)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer">
                    일반
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="glove" id="glove" />
                  <Label htmlFor="glove" className="cursor-pointer">
                    장갑 착용
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="precision" id="precision" />
                  <Label htmlFor="precision" className="cursor-pointer">
                    정밀
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>
      )}

      {/* 알림 설정 카드 - Hidden */}
      {false && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">알림 설정</h3>
            </div>
            {notificationSaveSuccess && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>저장됨</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 푸시 알림 활성화 */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <Label htmlFor="push-enabled">푸시 알림</Label>
                </div>
                {typeof window !== 'undefined' && 'Notification' in window ? (
                  <Switch
                    id="push-enabled"
                    checked={notificationSettings.push_enabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleRequestPushPermission()
                      } else {
                        handleNotificationSettingChange('push_enabled', false)
                      }
                    }}
                  />
                ) : (
                  <span className="text-sm text-gray-500">지원하지 않음</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                브라우저 알림을 받으려면 활성화하세요
              </p>
            </div>

            {/* 알림 카테고리 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">알림 유형</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-report-reminders" className="text-sm">
                    작업일지 리마인더
                  </Label>
                  <Switch
                    id="daily-report-reminders"
                    checked={notificationSettings.daily_report_reminders}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('daily_report_reminders', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="material-approvals" className="text-sm">
                    자재 승인 요청
                  </Label>
                  <Switch
                    id="material-approvals"
                    checked={notificationSettings.material_approvals}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('material_approvals', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="safety-alerts" className="text-sm">
                    안전 경고
                  </Label>
                  <Switch
                    id="safety-alerts"
                    checked={notificationSettings.safety_alerts}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('safety_alerts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="equipment-maintenance" className="text-sm">
                    장비 정비 알림
                  </Label>
                  <Switch
                    id="equipment-maintenance"
                    checked={notificationSettings.equipment_maintenance}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('equipment_maintenance', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="site-announcements" className="text-sm">
                    현장 공지사항
                  </Label>
                  <Switch
                    id="site-announcements"
                    checked={notificationSettings.site_announcements}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('site_announcements', checked)
                    }
                  />
                </div>
              </div>
            </div>

            {/* 알림 옵션 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">알림 옵션</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <Label htmlFor="sound-enabled" className="text-sm">소리</Label>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={notificationSettings.sound_enabled}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('sound_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-gray-400" />
                    <Label htmlFor="vibration-enabled" className="text-sm">진동</Label>
                  </div>
                  <Switch
                    id="vibration-enabled"
                    checked={notificationSettings.vibration_enabled}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('vibration_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-previews" className="text-sm">
                    미리보기 표시
                  </Label>
                  <Switch
                    id="show-previews"
                    checked={notificationSettings.show_previews}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('show_previews', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="group-notifications" className="text-sm">
                    알림 그룹화
                  </Label>
                  <Switch
                    id="group-notifications"
                    checked={notificationSettings.group_notifications}
                    onCheckedChange={(checked) => 
                      handleNotificationSettingChange('group_notifications', checked)
                    }
                  />
                </div>
              </div>
            </div>

            {/* 방해 금지 시간 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Label htmlFor="quiet-hours" className="text-sm font-medium">방해 금지 시간</Label>
                </div>
                <Switch
                  id="quiet-hours"
                  checked={notificationSettings.quiet_hours_enabled}
                  onCheckedChange={(checked) => 
                    handleNotificationSettingChange('quiet_hours_enabled', checked)
                  }
                />
              </div>
              
              {notificationSettings.quiet_hours_enabled && (
                <div className="flex items-center gap-2 pl-6">
                  <Input
                    type="time"
                    value={notificationSettings.quiet_hours_start}
                    onChange={(e) => 
                      handleNotificationSettingChange('quiet_hours_start', e.target.value)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">~</span>
                  <Input
                    type="time"
                    value={notificationSettings.quiet_hours_end}
                    onChange={(e) => 
                      handleNotificationSettingChange('quiet_hours_end', e.target.value)
                    }
                    className="w-24"
                  />
                </div>
              )}
            </div>

            {/* 저장 버튼 */}
            <Button
              onClick={handleSaveNotificationSettings}
              disabled={isSavingNotifications}
              className="w-full"
            >
              {isSavingNotifications ? (
                <>알림 설정 저장 중...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  알림 설정 저장
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* 로그아웃 버튼 - UI Guidelines 적용: 현장 작업자 친화적 터치 타겟 */}
      <Button
        variant="outline"
        className="w-full min-h-[56px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-medium text-base shadow-sm hover:shadow-md transition-all"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-3" />
        로그아웃
      </Button>
    </div>
  )
}