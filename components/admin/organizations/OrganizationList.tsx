'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrganizationForm from './OrganizationForm'
import OrganizationDetail from './OrganizationDetail'

interface Organization {
  id: string
  name: string
  type: string
  description?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  // Extended fields (for future use)
  representative_name?: string
  business_number?: string
  email?: string
  fax?: string
  business_type?: string
  business_category?: string
  bank_name?: string
  bank_account?: string
  notes?: string
}

export default function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list') // Add view mode state
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 거래처를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setOrganizations(organizations.filter(org => org.id !== id))
      alert('거래처가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('거래처 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !org.is_active })
        .eq('id', org.id)

      if (error) throw error
      
      setOrganizations(organizations.map(o => 
        o.id === org.id ? { ...o, is_active: !o.is_active } : o
      ))
    } catch (error) {
      console.error('Error toggling organization status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.address?.includes(searchTerm) ||
    org.phone?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            소속(거래처) 관리
          </h2>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="리스트 뷰"
              >
                <List className="h-4 w-4" />
                <span className="text-sm font-medium">리스트</span>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="카드 뷰"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm font-medium">카드</span>
              </button>
            </div>
            <button
              onClick={() => {
                setEditingOrg(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              거래처 추가
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="회사명, 설명, 타입, 주소, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Organizations List */}
      {filteredOrganizations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
          등록된 거래처가 없습니다.
        </div>
      ) : viewMode === 'list' ? (
        /* List View - Table */
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    조직명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {org.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        org.type === 'head_office' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        org.type === 'branch_office' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {org.type === 'head_office' ? '본사' :
                         org.type === 'branch_office' ? '지사' :
                         org.type === 'department' ? '부서' : org.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="max-w-xs truncate">
                        {org.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {org.phone || '-'}
                      </div>
                      {org.address && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {org.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(org)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          org.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}
                      >
                        {org.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            활성
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            비활성
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingOrg(org)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          title="상세보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOrg(org)
                            setShowForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View - Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {org.name}
                    </h3>
                    <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                      org.type === 'head_office' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                      org.type === 'branch_office' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {org.type === 'head_office' ? '본사' :
                       org.type === 'branch_office' ? '지사' :
                       org.type === 'department' ? '부서' : org.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(org)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    org.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}
                >
                  {org.is_active ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      활성
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      비활성
                    </>
                  )}
                </button>
              </div>

              {org.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {org.description}
                </p>
              )}

              <div className="space-y-2">
                {org.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{org.address}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {org.phone}
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    {org.email}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(org.representative_name || org.business_number) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {org.representative_name && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">대표자:</span> {org.representative_name}
                    </div>
                  )}
                  {org.business_number && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">사업자번호:</span> {org.business_number}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-2">
                <button
                  onClick={() => setViewingOrg(org)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="상세보기"
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => {
                    setEditingOrg(org)
                    setShowForm(true)
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="수정"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(org.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organization Form Modal */}
      {showForm && (
        <OrganizationForm
          organization={editingOrg}
          onClose={() => {
            setShowForm(false)
            setEditingOrg(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingOrg(null)
            fetchOrganizations()
          }}
        />
      )}

      {/* Organization Detail Modal */}
      {viewingOrg && (
        <OrganizationDetail
          organization={viewingOrg}
          onClose={() => setViewingOrg(null)}
          onEdit={() => {
            setEditingOrg(viewingOrg)
            setViewingOrg(null)
            setShowForm(true)
          }}
        />
      )}
    </div>
  )
}