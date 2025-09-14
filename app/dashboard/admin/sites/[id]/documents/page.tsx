import { createClient } from "@/lib/supabase/server"
import { Suspense } from 'react'
import SiteDocumentManagement from '@/components/admin/SiteDocumentManagement'

interface PageProps {
  params: {
    id: string
  }
}

// Loading component for the page
function DocumentManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
        <div className="text-gray-400">/</div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        <div className="text-gray-400">/</div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
        <div className="text-gray-400">/</div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>

      {/* Site Info Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Document Management Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse ml-auto"></div>
        </div>
      </div>
    </div>
  )
}

export default async function SiteDocumentsPage({ params }: PageProps) {
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

  // Get site information
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, address, status')
    .eq('id', params.id)
    .single()

  if (siteError || !site) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link
          href="/dashboard/admin"
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          관리자
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href="/dashboard/admin/sites"
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          현장 관리
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href={`/dashboard/admin/sites/${params.id}`}
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          {site.name}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">문서 관리</span>
      </nav>

      {/* Back Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/sites"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          현장 목록으로 돌아가기
        </Link>
      </div>

      {/* Site Context Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {site.name}
              </h1>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                site.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
              }`}>
                {site.status === 'active' ? '활성' : site.status}
              </span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{site.address}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              <FileText className="h-4 w-4 mr-2" />
              <span>현장 ID: {site.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Management Section */}
      <Suspense fallback={<DocumentManagementSkeleton />}>
        <SiteDocumentManagement siteId={params.id} siteName={site?.name} />
      </Suspense>
    </div>
  )
}