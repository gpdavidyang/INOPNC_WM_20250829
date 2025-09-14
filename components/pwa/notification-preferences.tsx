'use client'

import type { Site } from '@/types'

interface NotificationPreferences {
  push_enabled: boolean
  material_approvals: boolean
  daily_report_reminders: boolean
  safety_alerts: boolean
  equipment_maintenance: boolean
  site_announcements: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  sound_enabled: boolean
  vibration_enabled: boolean
  show_previews: boolean
  group_notifications: boolean
  // Frequency controls
  daily_report_reminder_frequency: 'daily' | 'weekdays' | 'custom'
  daily_report_reminder_time: string
  max_notifications_per_hour: number
  // Site-specific preferences
  site_preferences: Record<string, SiteNotificationPreferences>
}

interface SiteNotificationPreferences {
  enabled: boolean
  material_approvals: boolean
  daily_report_reminders: boolean
  safety_alerts: boolean
  equipment_maintenance: boolean
  site_announcements: boolean
}

interface NotificationTypeConfig {
  key: keyof NotificationPreferences
  icon: React.ReactNode
  title: string
  description: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  defaultEnabled: boolean
}

const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    key: 'safety_alerts',
    icon: <Shield className="h-5 w-5 text-red-500" />,
    title: '안전 경고',
    description: '현장 안전사고, 위험 상황 알림',
    urgency: 'critical',
    defaultEnabled: true
  },
  {
    key: 'material_approvals',
    icon: <Bell className="h-5 w-5 text-blue-500" />,
    title: '자재 승인',
    description: '자재 요청 승인/반려 알림',
    urgency: 'high',
    defaultEnabled: true
  },
  {
    key: 'daily_report_reminders',
    icon: <Clock className="h-5 w-5 text-orange-500" />,
    title: '작업일지 리마인더',
    description: '작업일지 작성 시간 알림',
    urgency: 'medium',
    defaultEnabled: true
  },
  {
    key: 'equipment_maintenance',
    icon: <Wrench className="h-5 w-5 text-purple-500" />,
    title: '장비 정비',
    description: '장비 점검 및 정비 일정 알림',
    urgency: 'medium',
    defaultEnabled: true
  },
  {
    key: 'site_announcements',
    icon: <Megaphone className="h-5 w-5 text-green-500" />,
    title: '현장 공지',
    description: '일반 공지사항 및 업데이트',
    urgency: 'low',
    defaultEnabled: false
  }
]

export function NotificationPreferences() {
  const { profile, updateProfile } = useProfile()
  const { permission, isSupported, requestPermission } = useNotificationPermission()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: false,
    material_approvals: true,
    daily_report_reminders: true,
    safety_alerts: true,
    equipment_maintenance: true,
    site_announcements: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    sound_enabled: true,
    vibration_enabled: true,
    show_previews: true,
    group_notifications: true,
    daily_report_reminder_frequency: 'daily',
    daily_report_reminder_time: '17:00',
    max_notifications_per_hour: 10,
    site_preferences: {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: true,
    frequency: false,
    sites: false,
    advanced: false
  })
  const [testingNotification, setTestingNotification] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.notification_preferences) {
      setPreferences(prev => ({
        ...prev,
        ...profile.notification_preferences
      }))
    }
  }, [profile])

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSites()
    }
  }, [profile?.organization_id])

  const fetchSites = async () => {
    if (!profile?.organization_id) return
    
    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('name')
    
    if (data) {
      setSites(data)
    }
  }

  const handleToggleNotifications = async () => {
    if (permission !== 'granted') {
      const result = await requestPermission()
      if (result !== 'granted') {
        return
      }
    }

    const newEnabled = !preferences.push_enabled
    await updatePreferences({ push_enabled: newEnabled })
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    setIsLoading(true)
    try {
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)

      if (profile) {
        await updateProfile({
          notification_preferences: newPreferences
        })
      }

      // Store locally as backup
      localStorage.setItem('notification-preferences', JSON.stringify(newPreferences))
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async (type?: string) => {
    if (permission === 'granted') {
      setTestingNotification(type || 'general')
      
      try {
        if (type) {
          // Test specific notification type
          const notificationConfig = NOTIFICATION_TYPES.find(n => n.key === type)
          if (notificationConfig) {
            new Notification(`테스트: ${notificationConfig.title}`, {
              body: `${notificationConfig.description} 테스트 알림입니다.`,
              icon: '/icons/icon-192x192.png',
              tag: `test-${type}`,
              requireInteraction: notificationConfig.urgency === 'critical'
            })
          }
        } else {
          // General test
          await pushNotificationService.sendTestNotification()
        }
      } catch (error) {
        console.error('Test notification failed:', error)
      } finally {
        setTimeout(() => setTestingNotification(null), 2000)
      }
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleBulkToggle = (enabled: boolean) => {
    const updates: Partial<NotificationPreferences> = {
      material_approvals: enabled,
      daily_report_reminders: enabled,
      equipment_maintenance: enabled,
      site_announcements: enabled
    }
    // Safety alerts remain always on
    updatePreferences(updates)
  }

  const updateSitePreference = (siteId: string, updates: Partial<SiteNotificationPreferences>) => {
    const newSitePrefs = {
      ...preferences.site_preferences,
      [siteId]: {
        ...preferences.site_preferences[siteId],
        ...updates
      }
    }
    updatePreferences({ site_preferences: newSitePrefs })
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          status: 'granted',
          text: '허용됨',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20'
        }
      case 'denied':
        return {
          status: 'denied',
          text: '차단됨',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20'
        }
      default:
        return {
          status: 'default',
          text: '미설정',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        }
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              알림 기능 지원 안함
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              현재 브라우저에서는 푸시 알림을 지원하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const permissionInfo = getPermissionStatus()

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                푸시 알림
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                중요한 업데이트를 즉시 받아보세요
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${permissionInfo.bgColor} ${permissionInfo.color}`}>
              {permissionInfo.text}
            </span>
            
            {permission === 'granted' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={handleToggleNotifications}
                  disabled={isLoading}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.push_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.push_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            )}
          </div>
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              알림이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.
            </p>
          </div>
        )}

        {permission === 'default' && (
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            알림 허용하기
          </button>
        )}

        {permission === 'granted' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleTestNotification()}
              disabled={testingNotification === 'general'}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              {testingNotification === 'general' ? '테스트 중...' : '테스트 알림 보내기'}
            </button>
          </div>
        )}
      </div>

      {/* Notification Types */}
      {permission === 'granted' && preferences.push_enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('types')}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
            >
              알림 유형
              {expandedSections.types ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkToggle(true)}
                className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                모두 켜기
              </button>
              <button
                onClick={() => handleBulkToggle(false)}
                className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                모두 끄기
              </button>
            </div>
          </div>
          
          {expandedSections.types && (
            <div className="space-y-4">
              {NOTIFICATION_TYPES.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {type.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {type.title}
                      </h4>
                      {type.urgency === 'critical' && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                          필수
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {type.description}
                    </p>
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences[type.key] as boolean}
                    onChange={(e) => updatePreferences({ [type.key]: e.target.checked })}
                    disabled={isLoading || type.urgency === 'critical'}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences[type.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${type.urgency === 'critical' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
                
                {preferences[type.key] && (
                  <button
                    onClick={() => handleTestNotification(type.key)}
                    disabled={testingNotification === type.key}
                    className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    title="테스트"
                  >
                    <TestTube className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Notification Frequency */}
      {permission === 'granted' && preferences.push_enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => toggleSection('frequency')}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4 w-full text-left"
          >
            알림 빈도 설정
            {expandedSections.frequency ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.frequency && (
            <div className="space-y-4">
              {/* Daily Report Reminder Frequency */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">작업일지 리마인더</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reminder-frequency"
                        value="daily"
                        checked={preferences.daily_report_reminder_frequency === 'daily'}
                        onChange={() => updatePreferences({ daily_report_reminder_frequency: 'daily' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">매일</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reminder-frequency"
                        value="weekdays"
                        checked={preferences.daily_report_reminder_frequency === 'weekdays'}
                        onChange={() => updatePreferences({ daily_report_reminder_frequency: 'weekdays' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">평일만</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reminder-frequency"
                        value="custom"
                        checked={preferences.daily_report_reminder_frequency === 'custom'}
                        onChange={() => updatePreferences({ daily_report_reminder_frequency: 'custom' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">사용자 정의</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      알림 시간:
                    </label>
                    <input
                      type="time"
                      value={preferences.daily_report_reminder_time}
                      onChange={(e) => updatePreferences({ daily_report_reminder_time: e.target.value })}
                      disabled={isLoading}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notification Rate Limiting */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">알림 제한</h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    시간당 최대 알림 수:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={preferences.max_notifications_per_hour}
                    onChange={(e) => updatePreferences({ max_notifications_per_hour: parseInt(e.target.value) || 10 })}
                    disabled={isLoading}
                    className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">개</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  알림 피로도를 줄이기 위해 시간당 받을 수 있는 알림 수를 제한합니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Site-specific Settings */}
      {permission === 'granted' && preferences.push_enabled && sites.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => toggleSection('sites')}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4 w-full text-left"
          >
            <Building2 className="h-5 w-5" />
            현장별 알림 설정
            {expandedSections.sites ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.sites && (
            <div className="space-y-4">
              {sites.map((site) => {
                const sitePrefs = preferences.site_preferences[site.id] || {
                  enabled: true,
                  material_approvals: true,
                  daily_report_reminders: true,
                  safety_alerts: true,
                  equipment_maintenance: true,
                  site_announcements: true
                }
                
                return (
                  <div key={site.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{site.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={sitePrefs.enabled}
                          onChange={(e) => updateSitePreference(site.id, { enabled: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          sitePrefs.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            sitePrefs.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </div>
                      </label>
                    </div>
                    
                    {sitePrefs.enabled && (
                      <div className="grid grid-cols-2 gap-3 mt-3 pl-4">
                        {NOTIFICATION_TYPES.filter(t => t.key !== 'safety_alerts').map((type) => (
                          <label key={type.key} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={sitePrefs[type.key as keyof SiteNotificationPreferences] as boolean}
                              onChange={(e) => updateSitePreference(site.id, { [type.key]: e.target.checked })}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{type.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      {permission === 'granted' && preferences.push_enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => toggleSection('advanced')}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4 w-full text-left"
          >
            고급 설정
            {expandedSections.advanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.advanced && (
            <div className="space-y-4">
            {/* Sound & Vibration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">소리</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">알림음 재생</p>
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.sound_enabled}
                  onChange={(e) => updatePreferences({ sound_enabled: e.target.checked })}
                  disabled={isLoading}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.sound_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>

            {/* Show Previews */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">미리보기 표시</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">알림 내용 미리보기</p>
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.show_previews}
                  onChange={(e) => updatePreferences({ show_previews: e.target.checked })}
                  disabled={isLoading}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.show_previews ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.show_previews ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>

            {/* Quiet Hours */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">방해 금지 시간</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">지정 시간에는 긴급 알림만 받기</p>
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.quiet_hours_enabled}
                    onChange={(e) => updatePreferences({ quiet_hours_enabled: e.target.checked })}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.quiet_hours_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="flex gap-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                      disabled={isLoading}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료 시간
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                      disabled={isLoading}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  )
}