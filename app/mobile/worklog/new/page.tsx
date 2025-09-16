'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLog } from '@/modules/mobile/types/work-log.types'

export const dynamic = 'force-dynamic'

export default function NewWorkLogPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleSave = async (workLog: Partial<WorkLog>) => {
    try {
      // TODO: Implement actual save logic
      console.log('Saving work log:', workLog)

      // After saving, redirect back to work log list
      router.push('/mobile/worklog')
    } catch (error) {
      console.error('Failed to save work log:', error)
      // Handle error - show toast or error message
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    router.push('/mobile/worklog')
  }

  useEffect(() => {
    // Ensure modal opens when page loads
    setIsModalOpen(true)
  }, [])

  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <MobileLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">새 작업일지 작성</h1>
            <div className="text-center text-gray-600 mt-8">
              작업일지 작성 폼이 열리고 있습니다...
            </div>
          </div>

          <WorkLogModal
            isOpen={isModalOpen}
            onClose={handleClose}
            onSave={handleSave}
            mode="create"
          />
        </div>
      </MobileLayout>
    </MobileAuthGuard>
  )
}
