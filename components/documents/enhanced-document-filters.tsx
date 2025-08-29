'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Building2, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EnhancedDocumentFiltersProps {
  onFilterChange: (filters: DocumentFilters) => void
  currentFilters: DocumentFilters
}

export interface DocumentFilters {
  search: string
  siteId?: string
  dateRange?: 'today' | 'week' | 'month' | 'all'
  author?: string
  documentType?: string
}

interface Site {
  id: string
  name: string
  address: string
}

interface Author {
  id: string
  full_name: string
  role: string
}

export default function EnhancedDocumentFilters({ onFilterChange, currentFilters }: EnhancedDocumentFiltersProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    try {
      // 현장 목록 조회
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (sitesError) {
        console.error('Sites loading error:', sitesError)
      } else {
        setSites(sitesData || [])
      }

      // 작성자 목록 조회 (문서가 있는 사용자만)
      const { data: authorsData, error: authorsError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('status', 'active')
        .order('full_name')

      if (authorsError) {
        console.error('Authors loading error:', authorsError)
      } else {
        setAuthors(authorsData || [])
      }

    } catch (error) {
      console.error('Filter data loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterUpdate = (key: keyof DocumentFilters, value: any) => {
    const newFilters = { ...currentFilters, [key]: value }
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 검색바 */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="문서명, 내용으로 검색..."
          value={currentFilters.search}
          onChange={(e) => handleFilterUpdate('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 필터 옵션들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 현장 필터 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            현장
          </label>
          <select
            value={currentFilters.siteId || ''}
            onChange={(e) => handleFilterUpdate('siteId', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">모든 현장</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* 기간 필터 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            기간
          </label>
          <select
            value={currentFilters.dateRange || 'all'}
            onChange={(e) => handleFilterUpdate('dateRange', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">최근 1주일</option>
            <option value="month">최근 1개월</option>
          </select>
        </div>

        {/* 작성자 필터 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <User className="h-3 w-3" />
            작성자
          </label>
          <select
            value={currentFilters.author || ''}
            onChange={(e) => handleFilterUpdate('author', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">모든 작성자</option>
            {authors.map(author => (
              <option key={author.id} value={author.id}>
                {author.full_name} ({author.role})
              </option>
            ))}
          </select>
        </div>

        {/* 문서 타입 필터 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            문서 타입
          </label>
          <select
            value={currentFilters.documentType || ''}
            onChange={(e) => handleFilterUpdate('documentType', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">모든 타입</option>
            <option value="personal">개인 문서</option>
            <option value="shared">공유 문서</option>
            <option value="report">보고서</option>
            <option value="certificate">증명서</option>
            <option value="blueprint">도면</option>
            <option value="safety">안전 문서</option>
          </select>
        </div>
      </div>

      {/* 활성 필터 표시 */}
      {(currentFilters.siteId || currentFilters.author || currentFilters.dateRange !== 'all' || currentFilters.documentType) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">활성 필터:</span>
          
          {currentFilters.siteId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md">
              현장: {sites.find(s => s.id === currentFilters.siteId)?.name}
              <button 
                onClick={() => handleFilterUpdate('siteId', undefined)}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          )}
          
          {currentFilters.author && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-md">
              작성자: {authors.find(a => a.id === currentFilters.author)?.full_name}
              <button 
                onClick={() => handleFilterUpdate('author', undefined)}
                className="ml-1 hover:text-green-900 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}

          {currentFilters.dateRange && currentFilters.dateRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-md">
              기간: {currentFilters.dateRange === 'today' ? '오늘' : 
                     currentFilters.dateRange === 'week' ? '최근 1주일' : '최근 1개월'}
              <button 
                onClick={() => handleFilterUpdate('dateRange', 'all')}
                className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}

          {currentFilters.documentType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-md">
              타입: {currentFilters.documentType}
              <button 
                onClick={() => handleFilterUpdate('documentType', undefined)}
                className="ml-1 hover:text-orange-900 dark:hover:text-orange-100"
              >
                ×
              </button>
            </span>
          )}

          <button
            onClick={() => onFilterChange({ search: '' })}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
          >
            모든 필터 초기화
          </button>
        </div>
      )}
    </div>
  )
}