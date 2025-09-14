'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { TasksPage } from '@/modules/mobile/pages/tasks-page'

export const dynamic = 'force-dynamic'

export default function MobileTasksPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <TasksPage />
    </MobileAuthGuard>
  )
}