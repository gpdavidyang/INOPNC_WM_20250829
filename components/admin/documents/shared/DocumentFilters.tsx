'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentFilters, DocumentCategory } from '@/types/shared-documents'
import { X, Calendar, Building2, User, Tag, FileType } from 'lucide-react'

interface DocumentFiltersPanelProps {
  filters: DocumentFilters
  onFiltersChange: (filters: DocumentFilters) => void
  onClose: () => void
}

export default function DocumentFiltersPanel({
  filters,
  onFiltersChange,
  onClose
}: DocumentFiltersPanelProps) {
  const [sites, setSites] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // 필터 옵션 로드
  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    setLoading(true)
    try {
      // 현장 목록 로드
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      // 사용자 목록 로드 (문서를 업로드한 사용자만)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name')

      // 조직 목록 로드
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      setSites(sitesData || [])
      setUsers(usersData || [])
      setOrganizations(orgsData || [])
    } catch (error) {
      console.error('Failed to load filter options:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    const newFilters = { ...filters }
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const categories: DocumentCategory[] = ['도면', '계약서', '보고서', '사진', '기타']
  const fileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word (DOC)' },
    { value: 'docx', label: 'Word (DOCX)' },
    { value: 'xls', label: 'Excel (XLS)' },
    { value: 'xlsx', label: 'Excel (XLSX)' },
    { value: 'ppt', label: 'PowerPoint (PPT)' },
    { value: 'pptx', label: 'PowerPoint (PPTX)' },
    { value: 'jpg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'dwg', label: 'AutoCAD (DWG)' },
    { value: 'dxf', label: 'AutoCAD (DXF)' }
  ]

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">상세 필터</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            필터 초기화
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 현장 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Building2 className="h-4 w-4" />
            현장
          </label>
          <select
            value={filters.site_id || ''}
            onChange={(e) => handleFilterChange('site_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">전체</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>

        {/* 등록자 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <User className="h-4 w-4" />
            등록자
          </label>
          <select
            value={filters.uploaded_by || ''}
            onChange={(e) => handleFilterChange('uploaded_by', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">전체</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* 조직 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Building2 className="h-4 w-4" />
            조직
          </label>
          <select
            value={filters.organization_id || ''}
            onChange={(e) => handleFilterChange('organization_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">전체</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>

        {/* 카테고리 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Tag className="h-4 w-4" />
            카테고리
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">전체</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* 파일 유형 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileType className="h-4 w-4" />
            파일 유형
          </label>
          <select
            value={filters.file_type || ''}
            onChange={(e) => handleFilterChange('file_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">전체</option>
            {fileTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* 시작 날짜 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Calendar className="h-4 w-4" />
            시작일
          </label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>

        {/* 종료 날짜 필터 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Calendar className="h-4 w-4" />
            종료일
          </label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {filters.site_id && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              현장: {sites.find(s => s.id === filters.site_id)?.name}
              <button
                onClick={() => handleFilterChange('site_id', null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.uploaded_by && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              등록자: {users.find(u => u.id === filters.uploaded_by)?.name || '알 수 없음'}
              <button
                onClick={() => handleFilterChange('uploaded_by', null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              카테고리: {filters.category}
              <button
                onClick={() => handleFilterChange('category', null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.file_type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              파일: {fileTypes.find(t => t.value === filters.file_type)?.label}
              <button
                onClick={() => handleFilterChange('file_type', null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}