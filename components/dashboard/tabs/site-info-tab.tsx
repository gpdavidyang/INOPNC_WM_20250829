'use client'

import { useState, useEffect } from 'react'
import TodaySiteInfo from '@/components/site-info/TodaySiteInfo'
import SiteSearchModal from '@/components/site-info/SiteSearchModal'
import { SiteInfo } from '@/types/site-info'
import { getCurrentUserSite, getUserSiteHistory, assignUserToSite } from '@/app/actions/site-info'
import { Profile } from '@/types'
import { Search, RefreshCw } from 'lucide-react'

interface SiteInfoTabProps {
  profile: Profile
}

export default function SiteInfoTab({ profile }: SiteInfoTabProps) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (profile && profile.id) {
      // Add a small delay to ensure auth is fully established
      const timeoutId = setTimeout(() => {
        fetchCurrentSiteInfo()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchCurrentSiteInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('SiteInfoTab: Fetching current site info...')
      
      // Use the new server action instead of direct database queries
      const result = await getCurrentUserSite()
      
      console.log('SiteInfoTab: Server action result:', result)

      if (!result.success) {
        console.error('SiteInfoTab: Failed to fetch site info:', result.error)
        setError(new Error(`현장 정보 조회 실패: ${result.error}`))
        setSiteInfo(null)
        return
      }

      const currentSite = result.data
      console.log('SiteInfoTab: Received site data:', currentSite)

      if (!currentSite) {
        console.log('SiteInfoTab: No current site assignment found - showing empty state')
        setSiteInfo(null)
        return
      }

      // Convert the CurrentUserSite data to SiteInfo format
      const siteData: SiteInfo = {
        id: currentSite.site_id,
        name: currentSite.site_name,
        address: {
          id: currentSite.site_id,
          site_id: currentSite.site_id,
          full_address: currentSite.site_address || '주소 정보 없음',
          latitude: undefined,
          longitude: undefined,
          postal_code: undefined
        },
        accommodation: currentSite.accommodation_address ? {
          id: currentSite.site_id,
          site_id: currentSite.site_id,
          accommodation_name: currentSite.accommodation_name || '숙소',
          full_address: currentSite.accommodation_address,
          latitude: undefined,
          longitude: undefined
        } : undefined,
        process: {
          member_name: currentSite.component_name || '미정',
          work_process: currentSite.work_process || '미정',
          work_section: currentSite.work_section || '미정',
          drawing_id: undefined
        },
        managers: [
          ...(currentSite.construction_manager_phone ? [{
            role: 'construction_manager' as const,
            name: currentSite.manager_name || '현장 소장',
            phone: currentSite.construction_manager_phone
          }] : []),
          ...(currentSite.safety_manager_phone ? [{
            role: 'safety_manager' as const,
            name: currentSite.safety_manager_name || '안전 관리자',
            phone: currentSite.safety_manager_phone
          }] : [])
        ],
        construction_period: {
          start_date: currentSite.start_date,
          end_date: currentSite.end_date
        },
        is_active: currentSite.site_status === 'active'
      }

      console.log('SiteInfoTab: Converted site data:', siteData)
      setSiteInfo(siteData)
    } catch (err) {
      console.error('SiteInfoTab: Error fetching site info:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCurrentSiteInfo()
  }

  const handleSelectSite = async (siteId: string) => {
    try {
      setShowSearchModal(false)
      setLoading(true)
      setError(null)
      
      console.log('SiteInfoTab: Assigning user to site:', { userId: profile.id, siteId })
      
      // Use server action to assign user to site
      const result = await assignUserToSite(profile.id, siteId, 'worker')
      
      if (!result.success) {
        console.error('SiteInfoTab: Failed to assign site:', result.error)
        setError(new Error(result.error))
        return
      }

      console.log('SiteInfoTab: Site assignment successful, refreshing data...')
      
      // Refresh site info
      await fetchCurrentSiteInfo()
    } catch (err) {
      console.error('SiteInfoTab: Error switching site:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            현장정보
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            현재 배정된 현장의 정보를 확인하세요
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">현장 변경</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      <TodaySiteInfo 
        siteInfo={siteInfo}
        loading={loading}
        error={error}
      />

      {/* Site Search Modal */}
      <SiteSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectSite={handleSelectSite}
        currentSiteId={siteInfo?.id}
      />
    </div>
  )
}