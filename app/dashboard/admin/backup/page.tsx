import { createClient } from "@/lib/supabase/server"

export default async function BackupPage() {
  const supabase = createClient()
  
  // Get current user and check permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only admins can access backup management
  if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<BackupDashboardSkeleton />}>
          <BackupDashboard />
        </Suspense>
    </div>
    </div>
  )
}

function BackupDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
    <div className="flex items-center justify-between">
    <div>
    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-64"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>

      {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
    <div className="flex items-center justify-between">
    <div className="flex-1">
    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
    </div>
          </Card>
        ))}
    </div>

      {/* Main Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
    <div className="space-y-3">
            {[1, 2, 3].map(i => (
    <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
    </div>
        </Card>
        
        <Card className="p-6">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
    <div className="space-y-3">
            {[1, 2, 3].map(i => (
    <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
    </div>
        </Card>
    </div>

      {/* Quick Actions Skeleton */}
      <Card className="p-6">
    <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
    <div key={i} className="h-20 bg-gray-100 rounded border"></div>
          ))}
    </div>
      </Card>
    </div>
  )
}