'use client'

import { Profile } from '@/types'
import { ArrowLeft, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface AdminPageLayoutProps {
  profile: Profile
  title: string
  description?: string
  children: React.ReactNode
  showBackButton?: boolean
  backUrl?: string
}

export default function AdminPageLayout({ 
  profile, 
  title, 
  description, 
  children, 
  showBackButton = true,
  backUrl = '/dashboard'
}: AdminPageLayoutProps) {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  const handleBack = () => {
    router.push(backUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={`max-w-full mx-auto ${
          touchMode === 'glove' ? 'px-6 sm:px-8 lg:px-12' : touchMode === 'precision' ? 'px-4 sm:px-6 lg:px-8' : 'px-5 sm:px-7 lg:px-10'
        }`}>
          <div className={`flex items-center justify-between ${
            touchMode === 'glove' ? 'h-20' : touchMode === 'precision' ? 'h-14' : 'h-16'
          }`}>
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className={`mr-4 ${
                    touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                  } text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
                  aria-label="뒤로 가기"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h1 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                    {title}
                  </h1>
                  {description && (
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Admin badge */}
            <div className="flex items-center">
              <div className={`bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 ${
                touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2.5 py-0.5' : 'px-3 py-1'
              } rounded-full ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                {profile.role === 'system_admin' ? '시스템 관리자' : '관리자'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`max-w-full mx-auto ${
        touchMode === 'glove' ? 'px-6 sm:px-8 lg:px-12 py-8' : touchMode === 'precision' ? 'px-4 sm:px-6 lg:px-8 py-4' : 'px-5 sm:px-7 lg:px-10 py-6'
      }`}>
        {children}
      </div>
    </div>
  )
}