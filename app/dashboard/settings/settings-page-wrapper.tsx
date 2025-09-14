'use client'

import SettingsForm from './settings-form'

interface SettingsPageWrapperProps {
  user: User
  profile: Profile
}

export function SettingsPageWrapper({ user, profile }: SettingsPageWrapperProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  return (
    <div>
      <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 mb-6`}>
        계정 설정
      </h1>
      
      <div className={`bg-white shadow rounded-lg ${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      }`}>
        <SettingsForm user={user} profile={profile} />
      </div>
    </div>
  )
}