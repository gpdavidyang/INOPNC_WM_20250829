'use client'

import { useState, useEffect } from 'react'
import { Profile, Site, SiteStatus } from '@/types'
import { 
  getSites, 
  createSite, 
  updateSite, 
  deleteSites,
  CreateSiteData,
  UpdateSiteData 
} from '@/app/actions/admin/sites'
import { Plus, Search, MapPin, Calendar, Users, Edit, Trash2 } from 'lucide-react'

interface SiteManagementNewProps {
  profile?: Profile
}

export default function SiteManagementNew({ profile }: SiteManagementNewProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SiteStatus | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load sites data
  const loadSites = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getSites(1, 20, searchTerm, statusFilter || undefined)
      
      if (result.success && result.data) {
        setSites(result.data.sites)
      } else {
        setError(result.error || '현장 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('Error loading sites:', err)
      setError('현장 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [searchTerm, statusFilter])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleStatusFilter = (status: SiteStatus | '') => {
    setStatusFilter(status)
  }

  const handleCreateSite = () => {
    setShowCreateModal(true)
  }

  const handleDeleteSite = async (site: Site) => {
    if (!confirm(`정말로 "${site.name}" 현장을 삭제하시겠습니까?`)) {
      return
    }
    
    try {
      const result = await deleteSites([site.id])
      if (result.success) {
        await loadSites()
        alert(`"${site.name}" 현장이 삭제되었습니다.`)
      } else {
        alert(result.error || '현장 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('현장 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="mx-auto max-w-full px-3 sm:px-4 lg:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow border p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-full px-3 sm:px-4 lg:px-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              현장 관리
            </h1>
            <button
              onClick={handleCreateSite}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 현장 추가
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="현장명 또는 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as SiteStatus | '')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="completed">완료</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Sites Grid */}
          {sites.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                현장이 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                새 현장을 추가하여 시작하세요.
              </p>
              <button
                onClick={handleCreateSite}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 현장 추가
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {site.name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {site.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {(() => {
                        const statusConfig = {
                          active: { text: '활성', color: 'bg-green-100 text-green-800' },
                          inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800' },
                          completed: { text: '완료', color: 'bg-blue-100 text-blue-800' }
                        }
                        
                        const config = statusConfig[site.status || 'inactive']
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                            {config.text}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Site Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>시작: {new Date(site.start_date).toLocaleDateString('ko-KR')}</span>
                      </div>
                      
                      {site.manager_name && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{site.manager_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                          <Edit className="h-3 w-3 mr-1" />
                          편집
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteSite(site)}
                        className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}