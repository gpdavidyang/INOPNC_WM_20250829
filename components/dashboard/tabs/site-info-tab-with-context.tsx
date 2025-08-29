'use client'

import { useState } from 'react'
import TodaySiteInfo from '@/components/site-info/TodaySiteInfo'
import SiteSearchModal from '@/components/site-info/SiteSearchModal'
import { useCurrentSite, useSiteContext } from '@/contexts/SiteContext'
import { Profile } from '@/types'
import { Search, RefreshCw } from 'lucide-react'

interface SiteInfoTabProps {
  profile: Profile
}

export default function SiteInfoTabWithContext({ profile }: SiteInfoTabProps) {
  const { currentSite, isLoading, error, refreshCurrentSite } = useCurrentSite()
  const { switchSite } = useSiteContext()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshCurrentSite()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSelectSite = async (siteId: string) => {
    try {
      setShowSearchModal(false)
      await switchSite(siteId)
    } catch (err) {
      console.error('Error switching site:', err)
      // Could show a toast notification here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            현장정보
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            현재 배정된 현장의 정보를 확인하세요
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">현장 변경</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">새로고침</span>
          </button>
        </div>
      </div>

      <TodaySiteInfo 
        siteInfo={currentSite}
        loading={isLoading}
        error={error}
      />

      {/* Site Search Modal */}
      <SiteSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectSite={handleSelectSite}
        currentSiteId={currentSite?.id}
      />
    </div>
  )
}