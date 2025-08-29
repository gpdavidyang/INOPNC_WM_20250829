'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Site } from '@/types'
import { PlusIcon, BuildingOfficeIcon, MapPinIcon, CalendarIcon, Squares2X2Icon, ListBulletIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import SiteUnifiedManagement from './SiteUnifiedManagement'

type ViewMode = 'card' | 'list'

export default function SiteManagementList() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const supabase = createClient()

  const fetchSites = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setSites(data || [])
    } catch (err) {
      console.error('Error fetching sites:', err)
      setError('현장 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site)
  }

  const handleBack = () => {
    setSelectedSite(null)
    fetchSites() // Refresh list when returning
  }

  const handleSiteUpdate = (updatedSite: Site) => {
    setSites(prevSites => 
      prevSites.map(site => site.id === updatedSite.id ? updatedSite : site)
    )
    setSelectedSite(updatedSite)
  }

  const handleRefresh = () => {
    fetchSites()
  }

  const renderListView = () => (
    <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              현장명
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              주소
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              상태
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              시작일
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              담당자
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {sites.map((site) => (
            <tr
              key={site.id}
              onClick={() => handleSiteSelect(site)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {site.name}
                    </div>
                    {site.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {site.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {site.address || '주소 미등록'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  site.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : site.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {site.status === 'active' ? '진행중' : site.status === 'completed' ? '완료' : '준비중'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '시작일 미정'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {site.manager_name || '담당자 미정'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // If a site is selected, show the unified management component
  if (selectedSite) {
    return (
      <SiteUnifiedManagement
        site={selectedSite}
        onBack={handleBack}
        onSiteUpdate={handleSiteUpdate}
        onRefresh={handleRefresh}
      />
    )
  }

  // Otherwise, show the site list
  return (
    <div>
      {/* Header with create button */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">전체 현장 목록</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            총 {sites.length}개의 현장이 등록되어 있습니다.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none sm:flex sm:space-x-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <button
              onClick={() => setViewMode('card')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md border-r border-gray-300 dark:border-gray-600 ${
                viewMode === 'card'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'list'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            새 현장 등록
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Site content */}
      {!loading && !error && (
        viewMode === 'card' ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div
                key={site.id}
                onClick={() => handleSiteSelect(site)}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {site.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="mr-1 h-4 w-4" />
                        {site.address || '주소 미등록'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '시작일 미정'}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      site.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : site.status === 'completed'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {site.status === 'active' ? '진행중' : site.status === 'completed' ? '완료' : '준비중'}
                    </span>
                  </div>

                  {site.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {site.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderListView()
        )
      )}

      {/* Empty state */}
      {!loading && !error && sites.length === 0 && (
        <div className="mt-8 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">현장이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새 현장을 등록하여 시작하세요.</p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              새 현장 등록
            </button>
          </div>
        </div>
      )}
    </div>
  )
}