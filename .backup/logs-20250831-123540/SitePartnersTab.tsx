'use client'

import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  DollarSign,
  Package,
  FileText,
  Eye,
  Download,
  Upload,
  TrendingUp,
  Users,
  Star,
  Plus,
  UserMinus,
  Search,
  Filter,
  XCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AssignedPartner {
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
  status: 'active' | 'suspended' | 'terminated'
  site_partners: {
    site_id: string
    partner_company_id: string
    assigned_date: string
    contract_status: string
    contract_value?: number
  }[]
}

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
  status: 'active' | 'suspended' | 'terminated'
  is_assigned?: boolean
}

interface InvoiceDocument {
  id: string
  document_type: string
  file_name: string
  file_url: string
  title?: string
  description?: string
  created_at: string
  profiles?: {
    full_name: string
    role: string
  }
}

interface SitePartnersTabProps {
  siteId: string
  siteName: string
}

export default function SitePartnersTab({ siteId, siteName }: SitePartnersTabProps) {
  const [assignedPartners, setAssignedPartners] = useState<AssignedPartner[]>([])
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([])
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    fetchPartnersData()
  }, [siteId])

  useEffect(() => {
    if (showAssignModal) {
      fetchAvailablePartners()
    }
  }, [showAssignModal, searchTerm, typeFilter])

  useEffect(() => {
    fetchInvoiceDocuments()
  }, [siteId, selectedCustomer])

  const fetchPartnersData = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/partners`)
      if (response.ok) {
        const data = await response.json()
        setAssignedPartners(data.success ? data.data.partners || [] : [])
      }
    } catch (error) {
      console.error('Error fetching partners data:', error)
    }
  }

  const fetchAvailablePartners = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter !== 'all') params.append('company_type', typeFilter)
      
      const response = await fetch(`/api/admin/sites/${siteId}/partners/available?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailablePartners(data.success ? data.data || [] : [])
      }
    } catch (error) {
      console.error('Error fetching available partners:', error)
    }
  }

  const fetchInvoiceDocuments = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/sites/${siteId}/documents?category=invoice`
      
      if (selectedCustomer !== 'all') {
        url += `&customer_id=${selectedCustomer}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setInvoiceDocuments(data.success ? data.data || [] : [])
      }
    } catch (error) {
      console.error('Error fetching invoice documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompanyTypeBadge = (type: string) => {
    const config = {
      general_contractor: { label: '종합건설업', color: 'blue' },
      subcontractor: { label: '전문건설업', color: 'green' },
      supplier: { label: '자재공급업체', color: 'purple' },
      consultant: { label: '설계/감리', color: 'yellow' },
      other: { label: '기타', color: 'gray' }
    }
    
    const typeConfig = config[type as keyof typeof config] || config.other
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/20 dark:text-${typeConfig.color}-400`}>
        {typeConfig.label}
      </span>
    )
  }

  const getRelationshipBadge = (type: string) => {
    const config = {
      client: { label: '발주사', color: 'green' },
      subcontractor: { label: '하청업체', color: 'blue' },
      supplier: { label: '공급업체', color: 'purple' },
      consultant: { label: '자문업체', color: 'yellow' }
    }
    
    const relationConfig = config[type as keyof typeof config] || { label: type, color: 'gray' }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${relationConfig.color}-100 text-${relationConfig.color}-800 dark:bg-${relationConfig.color}-900/20 dark:text-${relationConfig.color}-400`}>
        {relationConfig.label}
      </span>
    )
  }

  const assignPartner = async (partnerId: string) => {
    try {
      console.log('Assigning partner:', partnerId, 'to site:', siteId)
      setAssignLoading(true)
      const response = await fetch(`/api/admin/sites/${siteId}/partners/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: partnerId,
          contract_status: 'active'
        })
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Assignment result:', result)
        await fetchPartnersData()
        setShowAssignModal(false)
        setSearchTerm('')
        setTypeFilter('all')
        alert('파트너사가 성공적으로 배정되었습니다.')
      } else {
        const errorData = await response.json()
        console.error('Assignment error response:', errorData)
        alert(errorData.error || '파트너사 배정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error assigning partner:', error)
      alert('파트너사 배정 중 오류가 발생했습니다.')
    } finally {
      setAssignLoading(false)
    }
  }

  const unassignPartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`정말로 '${partnerName}' 파트너사를 현장에서 해제하시겠습니까?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/partners/assign`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: partnerId
        })
      })
      
      if (response.ok) {
        await fetchPartnersData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '파트너사 해제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error unassigning partner:', error)
      alert('파트너사 해제에 실패했습니다.')
    }
  }

  const unassignedPartners = availablePartners.filter(p => !p.is_assigned)
  const totalPartners = assignedPartners.length
  const partnersByType = assignedPartners.reduce((acc, partner) => {
    const type = partner.company_type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            파트너사 & 기성청구문서함 관리
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {siteName} 현장의 파트너사 정보와 기성청구 관련 문서를 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            파트너사 배정
          </button>
          <Link
            href={`/dashboard/admin/documents/invoice?site_id=${siteId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            기성청구서 업로드
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 파트너사</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalPartners}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전문건설업</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{partnersByType.subcontractor || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">자재공급업</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{partnersByType.supplier || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">기성청구서</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{invoiceDocuments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 파트너사 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">파트너사 정보</h4>
        </div>
        
        {assignedPartners.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">배정된 파트너사가 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">현장에 배정된 파트너사가 아직 없습니다.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              파트너사 배정하기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {assignedPartners.map((partner) => (
              <div key={partner.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {partner.company_name}
                        </h4>
                        {getCompanyTypeBadge(partner.company_type)}
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {partner.site_partners[0]?.contract_status === 'active' ? '활성' : partner.site_partners[0]?.contract_status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {partner.representative_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            대표자: {partner.representative_name}
                          </div>
                        )}
                        {partner.contact_person && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            담당자: {partner.contact_person}
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {partner.phone}
                          </div>
                        )}
                        {partner.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {partner.email}
                          </div>
                        )}
                        {partner.business_number && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            사업자번호: {partner.business_number}
                          </div>
                        )}
                        {partner.site_partners[0]?.assigned_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            배정일: {format(new Date(partner.site_partners[0].assigned_date), 'yyyy.MM.dd')}
                          </div>
                        )}
                      </div>

                      {partner.trade_type && partner.trade_type.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {partner.trade_type.map((trade, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            >
                              {trade}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => unassignPartner(partner.id, partner.company_name)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-600 rounded-md transition-colors"
                  >
                    <UserMinus className="h-4 w-4" />
                    해제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 기성청구문서함 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">기성청구문서함</h4>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />
              <select 
                value={selectedCustomer} 
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">모든 파트너사</option>
                {assignedPartners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : invoiceDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">기성청구서가 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedCustomer !== 'all' ? '선택한 파트너사의 기성청구서가 없습니다.' : '아직 업로드된 기성청구서가 없습니다.'}
            </p>
            <Link
              href={`/dashboard/admin/documents/invoice?site_id=${siteId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              첫 번째 기성청구서 업로드
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {invoiceDocuments.map((document) => (
              <div key={document.id} className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-orange-50/50 dark:bg-orange-900/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      기성청구서
                    </span>
                  </div>
                </div>
                
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate" title={document.title || document.file_name}>
                  {document.title || document.file_name}
                </h5>
                
                {document.title && document.file_name !== document.title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2" title={document.file_name}>
                    파일명: {document.file_name}
                  </p>
                )}

                {document.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {document.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{document.profiles?.full_name || '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(document.created_at), 'MM.dd', { locale: ko })}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-orange-300 dark:border-orange-600 shadow-sm text-xs font-medium rounded text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <Eye className="h-3 w-3 mr-1" />
                    보기
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-orange-300 dark:border-orange-600 shadow-sm text-xs font-medium rounded text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <Download className="h-3 w-3 mr-1" />
                    다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가 액션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          파트너사 {totalPartners}곳, 기성청구서 {invoiceDocuments.length}건
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/organizations?site_id=${siteId}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            파트너사 관리 →
          </Link>
          <Link
            href={`/dashboard/admin/documents/invoice?site_id=${siteId}`}
            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium"
          >
            기성청구서 관리 →
          </Link>
        </div>
      </div>

      {/* Partner Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowAssignModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800" onClick={e => e.stopPropagation()}>
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  파트너사 배정
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="py-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
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

              {/* Available Partners Table */}
              <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-600 rounded-md">
                {unassignedPartners.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      배정 가능한 파트너사가 없습니다
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm || typeFilter !== 'all' 
                        ? '다른 검색 조건을 시도해보세요' 
                        : '모든 파트너사가 이미 배정되어 있거나 등록된 파트너사가 없습니다'}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">회사명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">업종</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">대표자</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">연락처</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">전문분야</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {unassignedPartners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {/* 회사명 */}
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {partner.company_name}
                                </div>
                                {partner.business_number && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {partner.business_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* 업종 */}
                          <td className="px-4 py-3">
                            {getCompanyTypeBadge(partner.company_type)}
                          </td>
                          {/* 대표자 */}
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {partner.representative_name || '-'}
                          </td>
                          {/* 연락처 */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {partner.contact_person && (
                                <div>{partner.contact_person}</div>
                              )}
                              {partner.phone && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{partner.phone}</div>
                              )}
                            </div>
                          </td>
                          {/* 전문분야 */}
                          <td className="px-4 py-3">
                            {partner.trade_type && partner.trade_type.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {partner.trade_type.slice(0, 2).map((trade, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
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
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => assignPartner(partner.id)}
                              disabled={assignLoading}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {assignLoading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              배정
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSearchTerm('')
                      setTypeFilter('all')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}