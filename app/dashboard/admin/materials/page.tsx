
import { createClient } from "@/lib/supabase/server"
import { Suspense } from 'react'
import NPCMaterialManagement from '@/components/admin/materials/NPCMaterialManagement'

export const dynamic = "force-dynamic"

// Loading component
function MaterialsManagementSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-6"></div>
            <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="py-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function MaterialsManagementPage() {
  const supabase = createClient()

  // Check authentication and get user profile
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with role check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  // Check if user has admin role
  if (!profile.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<MaterialsManagementSkeleton />}>
        <NPCMaterialManagement profile={profile} />
      </Suspense>
    </div>
  )
}
