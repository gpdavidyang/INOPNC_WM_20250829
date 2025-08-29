'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { 
  Plus, Search, Filter, MoreHorizontal, Building2, 
  Calendar, DollarSign, MapPin, Phone, Mail, FileText,
  Edit, Trash2, Users, Settings
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
  const supabase = createClient()

  const loadPartners = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('partner_companies')
        .select(`
          *,
          site_partners!inner(site_id)
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

      // Count sites for each partner
      const partnersWithCounts = await Promise.all(
        data.map(async (partner) => {
          const { count } = await supabase
            .from('site_partners')
            .select('*', { count: 'exact', head: true })
            .eq('partner_company_id', partner.id)

          return {
            ...partner,
            site_count: count || 0
          }
        })
      )

      setPartners(partnersWithCounts)
    } catch (error) {
      console.error('Failed to load partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [searchTerm, statusFilter, typeFilter])

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowForm(true)
  }

  const handleDelete = async (partnerId: string) => {
    if (!confirm('정말로 이 파트너사를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('partner_companies')
        .delete()
        .eq('id', partnerId)

      if (error) throw error

      await loadPartners()
    } catch (error) {
      console.error('Failed to delete partner:', error)
      alert('파트너사 삭제에 실패했습니다.')
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
          onClick={() => setShowForm(true)}
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
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleView(partner)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {partner.company_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCompanyTypeLabel(partner.company_type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(partner.status)}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Show dropdown menu
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
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
      )}
    </div>
  )
}