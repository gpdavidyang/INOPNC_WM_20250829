'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { 
  Plus, Search, Filter, Building2, 
  Calendar, DollarSign, MapPin, Phone, Mail, FileText,
  Users, Grid3x3, List, ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react'
import PartnerForm from './PartnerForm'
import PartnerDetail from './PartnerDetail'
import { createClient } from '@/lib/supabase/client'

interface Partner {
  id: string
  company_name: string
  business_number?: string
  company_type: 'general_contractor' | 'subcontractor' | 'supplier' | 'consultant'
  trade_type?: string[]
  representative_name?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  bank_name?: string
  bank_account?: string
  credit_rating?: string
  contract_start_date?: string
  contract_end_date?: string
  status: 'active' | 'suspended' | 'terminated'
  notes?: string
  created_at: string
  updated_at: string
  site_count?: number
}

type PartnerSortField = 'company_name' | 'company_type' | 'status' | 'phone' | 'site_count' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface PartnerListProps {
  profile: Profile
}

export default function PartnerList({ profile }: PartnerListProps) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortField, setSortField] = useState<PartnerSortField>('company_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const supabase = createClient()

  const loadPartners = async () => {
    setLoading(true)
    try {
      // Get all partners with site counts using a single query
      let query = supabase
        .from('partner_companies')
        .select(`
          *,
          site_partners(count)
        `)

      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,representative_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        query = query.eq('company_type', typeFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to include site count
      const partnersWithCounts = data?.map((partner) => ({
        ...partner,
        site_count: partner.site_partners?.length || 0
      })) || []

      setPartners(partnersWithCounts)
    } catch (error) {
      console.error('Failed to load partners:', error)
      // Fallback: try simple query without site_partners
      try {
        let fallbackQuery = supabase
          .from('partner_companies')
          .select('*')

        if (searchTerm) {
          fallbackQuery = fallbackQuery.or(`company_name.ilike.%${searchTerm}%,representative_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`)
        }

        if (statusFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', statusFilter)
        }

        if (typeFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('company_type', typeFilter)
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('created_at', { ascending: false })

        if (fallbackError) throw fallbackError

        const fallbackPartnersWithCounts = fallbackData?.map((partner) => ({
          ...partner,
          site_count: 0
        })) || []

        setPartners(fallbackPartnersWithCounts)
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      loadPartners()
    }, 300) // Debounce to prevent excessive API calls

    return () => clearTimeout(handler)
  }, [searchTerm, statusFilter, typeFilter])

  const handleSort = (field: PartnerSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: PartnerSortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />
  }

  const sortedAndFilteredPartners = [...partners].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1
    
    switch (sortField) {
      case 'company_name':
        return multiplier * a.company_name.localeCompare(b.company_name, 'ko')
      case 'company_type':
        return multiplier * a.company_type.localeCompare(b.company_type)
      case 'status':
        return multiplier * a.status.localeCompare(b.status)
      case 'phone':
        const phoneA = a.phone || ''
        const phoneB = b.phone || ''
        return multiplier * phoneA.localeCompare(phoneB)
      case 'site_count':
        const siteCountA = a.site_count || 0
        const siteCountB = b.site_count || 0
        return multiplier * (siteCountA - siteCountB)
      case 'created_at':
        return multiplier * new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default:
        return 0
    }
  })

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowForm(true)
  }

  const handleDelete = async (partnerId: string) => {
    if (!confirm('정말로 이 파트너사를 삭제하시겠습니까?\n\n관련된 모든 데이터가 함께 삭제됩니다.')) return

    try {
      const { error } = await supabase
        .from('partner_companies')
        .delete()
        .eq('id', partnerId)

      if (error) throw error

      alert('파트너사가 삭제되었습니다.')
      await loadPartners()
    } catch (error: any) {
      console.error('Failed to delete partner:', error)
      
      if (error.code === '23503') {
        alert('이 파트너사는 삭제할 수 없습니다.\n\n해당 파트너사가 현장에 배정되어 있거나 관련 데이터가 있습니다.\n먼저 관련 데이터를 삭제하거나 다른 파트너사로 변경한 후 다시 시도해주세요.')
      } else {
        alert('파트너사 삭제에 실패했습니다.')
      }
    }
  }

  const handleView = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowDetail(true)
  }

  const getCompanyTypeLabel = (type: string) => {
    const typeLabels = {
      general_contractor: '종합건설업',
      subcontractor: '전문건설업',
      supplier: '자재공급업체',
      consultant: '설계/감리'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      suspended: { label: '중단', className: 'bg-yellow-100 text-yellow-800' },
      terminated: { label: '종료', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (showForm) {
    return (
      <PartnerForm 
        partner={selectedPartner}
        profile={profile}
        onSave={() => {
          setShowForm(false)
          setSelectedPartner(null)
          loadPartners()
        }}
        onCancel={() => {
          setShowForm(false)
          setSelectedPartner(null)
        }}
      />
    )
  }

  if (showDetail) {
    return (
      <PartnerDetail
        partner={selectedPartner!}
        profile={profile}
        onEdit={handleEdit}
        onClose={() => {
          setShowDetail(false)
          setSelectedPartner(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">파트너사 관리</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            협력업체 및 파트너사를 관리합니다
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPartner(null)
            setShowForm(true)
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 파트너사 등록
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="회사명, 대표자명, 담당자명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="suspended">중단</option>
            <option value="terminated">종료</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 업종</option>
            <option value="general_contractor">종합건설업</option>
            <option value="subcontractor">전문건설업</option>
            <option value="supplier">자재공급업체</option>
            <option value="consultant">설계/감리</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-l-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="카드뷰"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-r-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="리스트뷰"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Partners Display */}
      {loading ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {[...Array(6)].map((_, i) => (
            viewMode === 'grid' ? (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            )
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? '검색 결과가 없습니다'
              : '등록된 파트너사가 없습니다'
            }
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? '다른 검색 조건을 시도해보세요'
              : '새 파트너사를 등록해보세요'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleView(partner)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {partner.company_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getCompanyTypeLabel(partner.company_type)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(partner.status)}
                  <div className="relative">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(partner)
                        }}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(partner.id)
                        }}
                        className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {partner.representative_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    {partner.representative_name}
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    {partner.phone}
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    {partner.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  배정 현장: {partner.site_count}개
                </div>
              </div>

              {partner.trade_type && partner.trade_type.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {partner.trade_type.slice(0, 3).map((trade, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {trade}
                      </span>
                    ))}
                    {partner.trade_type.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        +{partner.trade_type.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center">
                      회사정보
                      {getSortIcon('company_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('company_type')}
                  >
                    <div className="flex items-center">
                      업종
                      {getSortIcon('company_type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('phone')}
                  >
                    <div className="flex items-center">
                      연락처
                      {getSortIcon('phone')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('site_count')}
                  >
                    <div className="flex items-center">
                      현장수
                      {getSortIcon('site_count')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      상태
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    전문분야
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAndFilteredPartners.map((partner) => (
                  <tr 
                    key={partner.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleView(partner)}
                  >
                    {/* 회사정보 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {partner.company_name}
                        </div>
                        {partner.representative_name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            대표: {partner.representative_name}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 업종 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getCompanyTypeLabel(partner.company_type)}
                      </div>
                    </td>
                    
                    {/* 연락처 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {partner.contact_person && (
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="h-3 w-3" />
                            {partner.contact_person}
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-1 mb-1">
                            <Phone className="h-3 w-3" />
                            {partner.phone}
                          </div>
                        )}
                        {partner.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{partner.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 현장수 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <MapPin className="h-4 w-4" />
                        {partner.site_count}개
                      </div>
                    </td>
                    
                    {/* 상태 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(partner.status)}
                    </td>
                    
                    {/* 전문분야 */}
                    <td className="px-6 py-4">
                      {partner.trade_type && partner.trade_type.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {partner.trade_type.slice(0, 2).map((trade, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {trade}
                            </span>
                          ))}
                          {partner.trade_type.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              +{partner.trade_type.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    
                    {/* 작업 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(partner)
                          }}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(partner.id)
                          }}
                          className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}