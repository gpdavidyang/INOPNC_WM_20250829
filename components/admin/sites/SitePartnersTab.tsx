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
  Star
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Customer {
  id: string
  name: string
  contact_person: string
  phone?: string
  email?: string
  company_type: string
  relationship_type: string
  contract_start_date?: string
  contract_end_date?: string
  contract_amount?: number
  is_primary_customer: boolean
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')

  useEffect(() => {
    fetchPartnersData()
  }, [siteId])

  useEffect(() => {
    fetchInvoiceDocuments()
  }, [siteId, selectedCustomer])

  const fetchPartnersData = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/partners`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.success ? data.data || [] : [])
      }
    } catch (error) {
      console.error('Error fetching partners data:', error)
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
      construction: { label: '건설업', color: 'blue' },
      engineering: { label: '엔지니어링', color: 'green' },
      supplier: { label: '공급업체', color: 'purple' },
      consultant: { label: '컨설턴트', color: 'yellow' },
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

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toLocaleString()}억원`
    } else if (amount >= 10000) {
      return `${(amount / 10000).toLocaleString()}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const primaryCustomer = customers.find(c => c.is_primary_customer)
  const totalContractAmount = customers.reduce((sum, c) => sum + (c.contract_amount || 0), 0)
  const activeContracts = customers.filter(c => 
    c.contract_end_date ? new Date(c.contract_end_date) > new Date() : true
  ).length

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
        <Link
          href={`/dashboard/admin/documents/invoice?site_id=${siteId}`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          기성청구서 업로드
        </Link>
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
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 계약</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{activeContracts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 계약금액</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {totalContractAmount > 0 ? formatCurrency(totalContractAmount) : '-'}
              </p>
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
        
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">등록된 파트너사가 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400">현장에 연결된 파트너사가 아직 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      customer.is_primary_customer 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        customer.is_primary_customer 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {customer.name}
                        </h4>
                        {customer.is_primary_customer && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {getCompanyTypeBadge(customer.company_type)}
                        {getRelationshipBadge(customer.relationship_type)}
                        {customer.is_primary_customer && (
                          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            주 발주사
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {customer.contact_person && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            담당자: {customer.contact_person}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </div>
                        )}
                        {customer.contract_start_date && customer.contract_end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(customer.contract_start_date), 'yyyy.MM.dd')} ~ 
                            {format(new Date(customer.contract_end_date), 'yyyy.MM.dd')}
                          </div>
                        )}
                      </div>

                      {customer.contract_amount && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600 dark:text-gray-400">계약금액:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(customer.contract_amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
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
          파트너사 {customers.length}곳, 기성청구서 {invoiceDocuments.length}건
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
    </div>
  )
}