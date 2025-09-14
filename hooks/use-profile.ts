'use client'

import type { Profile } from '@/types'

interface NotificationPreferences {
  push_enabled?: boolean
  material_approvals?: boolean
  daily_report_reminders?: boolean
  safety_alerts?: boolean
  equipment_maintenance?: boolean
  site_announcements?: boolean
  quiet_hours_enabled?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  sound_enabled?: boolean
  vibration_enabled?: boolean
  show_previews?: boolean
  group_notifications?: boolean
  permission_requested_at?: string
}

interface ExtendedProfile extends Profile {
  notification_preferences?: NotificationPreferences
}

export function useProfile() {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setProfile(null)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setError('프로필을 불러오는데 실패했습니다.')
        return
      }

      // Parse notification_preferences if it exists as JSON string
      let parsedProfile = profileData
      if (profileData?.notification_preferences && typeof profileData.notification_preferences === 'string') {
        try {
          parsedProfile = {
            ...profileData,
            notification_preferences: JSON.parse(profileData.notification_preferences)
          }
        } catch (parseError) {
          console.error('Error parsing notification preferences:', parseError)
        }
      }

      setProfile(parsedProfile)
      setError(null)
    } catch (err) {
      console.error('Error in loadProfile:', err)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<ExtendedProfile>) => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.')
      }

      // Prepare update data, converting notification_preferences to JSON if needed
      const updateData = { ...updates }
      if (updateData.notification_preferences) {
        updateData.notification_preferences = updateData.notification_preferences as unknown
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error('프로필 업데이트에 실패했습니다.')
      }

      // Parse notification_preferences if it was returned as JSON string
      let parsedData = data
      if (data?.notification_preferences && typeof data.notification_preferences === 'string') {
        try {
          parsedData = {
            ...data,
            notification_preferences: JSON.parse(data.notification_preferences)
          }
        } catch (parseError) {
          console.error('Error parsing updated notification preferences:', parseError)
        }
      }

      setProfile(parsedData)
      return parsedData
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.')
      throw err
    }
  }

  const updateNotificationPreferences = async (preferences: NotificationPreferences) => {
    return updateProfile({ notification_preferences: preferences })
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateNotificationPreferences,
    reload: loadProfile
  }
}