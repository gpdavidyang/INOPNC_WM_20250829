import { Metadata } from 'next'
import { NotificationSettingsPage } from '@/components/settings/notification-settings-page'

export const metadata: Metadata = {
  title: '알림 설정 | INOPNC 작업일지 관리',
  description: '알림 설정 관리',
}

export default function NotificationSettingsRoute() {
  return <NotificationSettingsPage />
}