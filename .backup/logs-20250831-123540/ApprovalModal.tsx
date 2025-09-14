'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Building, 
  MapPin, 
  Shield, 
  Check,
  Search,
  Briefcase
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  type?: string
  business_registration_number?: string
  is_active?: boolean
  status?: string
}

interface Site {
  id: string
  name: string
  address?: string
  status?: string
}

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  request: {
    id: string
    full_name: string
    email: string
    phone?: string
    company_name?: string
    requested_role: string
  } | null
  onApprove: (data: {
    requestId: string
    organizationId?: string
    siteIds?: string[]
  }) => Promise<void>
}

export default function ApprovalModal({ isOpen, onClose, request, onApprove }: ApprovalModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState('')
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [siteSearchTerm, setSiteSearchTerm] = useState('')
  const supabase = createClient()

  // Filter sites based on search term
  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(siteSearchTerm.toLowerCase()) ||
    site.address?.toLowerCase().includes(siteSearchTerm.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && request) {
      fetchOrganizations()
      fetchSites()
      // Reset selections when modal opens
      setSelectedOrganization('')
      setSelectedSites([])
      setSiteSearchTerm('')
    }
  }, [isOpen, request])

  const fetchOrganizations = async () => {
    console.log('🔍 조직 데이터 가져오기 시작...')
    
    try {
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession()
      console.log('현재 세션 상태:', session?.session ? '인증됨' : '미인증')
      
      // First try without any filter to get all organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      console.log('📊 조회 결과:')
      console.log('- 데이터 개수:', data?.length || 0)
      console.log('- 에러:', error)
      
      if (data && data.length > 0) {
        console.log('- 첫 3개 조직:', data.slice(0, 3).map(org => org.name))
      }

      if (error) {
        console.error('❌ 조직 조회 오류:', error)
        console.log('🔧 Mock 데이터로 대체...')
        const mockData = [
          { id: 'mock-1', name: 'ABC 건설', type: 'head_office', business_registration_number: '123-45-67890', is_active: true },
          { id: 'mock-2', name: 'XYZ 파트너사', type: 'branch_office', business_registration_number: '987-65-43210', is_active: true },
          { id: 'mock-3', name: '테스트 부서', type: 'department', business_registration_number: '456-78-90123', is_active: true }
        ]
        setOrganizations(mockData)
        console.log('✅ Mock 데이터 설정 완료:', mockData.length, '개')
      } else {
        // Filter active organizations if is_active field exists
        const activeOrgs = data?.filter(org => 
          org.is_active !== false && org.status !== 'inactive'
        ) || data || []
        
        console.log('🔍 활성 조직 필터링:')
        console.log('- 전체:', data?.length || 0)
        console.log('- 활성:', activeOrgs.length)
        
        const finalOrgs = activeOrgs.length > 0 ? activeOrgs : data || []
        setOrganizations(finalOrgs)
        console.log('✅ 조직 데이터 설정 완료:', finalOrgs.length, '개')
        
        if (finalOrgs.length > 0) {
          console.log('- 설정된 조직들:', finalOrgs.map(org => org.name))
        }
      }
    } catch (error) {
      console.error('❌ 조직 조회 예외:', error)
      console.log('🔧 예외 처리로 Mock 데이터 설정...')
      
      // Set mock data as fallback
      const mockData = [
        { id: 'catch-1', name: 'ABC 건설 (예외처리)', type: 'head_office', business_registration_number: '123-45-67890', is_active: true },
        { id: 'catch-2', name: 'XYZ 파트너사 (예외처리)', type: 'branch_office', business_registration_number: '987-65-43210', is_active: true },
        { id: 'catch-3', name: '테스트 부서 (예외처리)', type: 'department', business_registration_number: '456-78-90123', is_active: true }
      ]
      setOrganizations(mockData)
      console.log('✅ 예외처리 Mock 데이터 설정:', mockData.length, '개')
    }
  }

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address, status')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching sites:', error)
        // Fallback to all sites if status filter fails
        const { data: allData } = await supabase
          .from('sites')
          .select('id, name, address, status')
          .order('name')
        setSites(allData || [])
      } else {
        setSites(data || [])
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const handleApprove = async () => {
    if (!request) return

    // 작업자와 현장관리자는 소속이 필수
    if ((request.requested_role === 'worker' || request.requested_role === 'site_manager') && !selectedOrganization) {
      alert('작업자와 현장관리자는 소속 업체를 선택해야 합니다.')
      return
    }

    // 작업자는 최소 1개 현장 필수
    if (request.requested_role === 'worker' && selectedSites.length === 0) {
      alert('작업자는 최소 1개 이상의 현장을 선택해야 합니다.')
      return
    }

    setProcessing(true)
    try {
      await onApprove({
        requestId: request.id,
        organizationId: selectedOrganization || undefined,
        siteIds: selectedSites.length > 0 ? selectedSites : undefined
      })
      onClose()
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      customer_manager: '파트너사',
      admin: '관리자'
    }
    return roleLabels[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      worker: 'from-blue-500 to-blue-600',
      site_manager: 'from-green-500 to-green-600',
      customer_manager: 'from-purple-500 to-purple-600',
      admin: 'from-red-500 to-red-600'
    }
    return roleColors[role] || 'from-gray-500 to-gray-600'
  }

  const toggleSiteSelection = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    )
  }

  const selectAllSites = () => {
    setSelectedSites(filteredSites.map(site => site.id))
  }

  const clearAllSites = () => {
    setSelectedSites([])
  }

  if (!isOpen || !request) return null

  const needsOrganization = request.requested_role === 'worker' || 
                           request.requested_role === 'site_manager' ||
                           request.requested_role === 'customer_manager'
  
  const needsSite = request.requested_role === 'worker' || 
                    request.requested_role === 'site_manager'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getRoleColor(request.requested_role)} text-white p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">가입 승인 처리</h2>
              <p className="text-white/90">신규 사용자 권한 및 소속 설정</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* User Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{request.full_name}</h3>
                <p className="text-gray-600">{request.email}</p>
              </div>
              <div className={`px-4 py-2 bg-gradient-to-r ${getRoleColor(request.requested_role)} text-white rounded-lg shadow-md`}>
                <Shield className="h-4 w-4 inline mr-2" />
                {getRoleLabel(request.requested_role)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {request.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">전화:</span> {request.phone}
                </div>
              )}
              {request.company_name && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">회사:</span> {request.company_name}
                </div>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-6">
            {/* Organization Selection */}
            {needsOrganization && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Building className="h-4 w-4 text-gray-500" />
                    소속 업체 선택
                    <span className="text-red-500 ml-1">*필수</span>
                  </label>
                  {selectedOrganization && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      선택완료
                    </span>
                  )}
                </div>
                <select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    selectedOrganization 
                      ? 'border-green-300 bg-green-50 focus:border-green-500' 
                      : 'border-gray-300 bg-white focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                >
                  <option value="">-- 소속 업체를 선택하세요 --</option>
                  {organizations.length > 0 ? (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} {org.business_registration_number && `(${org.business_registration_number})`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>조직 데이터를 불러오는 중...</option>
                  )}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  조직 데이터를 불러오는 중입니다. 여러 현장에서 근무하는 경우 복수 선택이 가능합니다.
                </p>
              </div>
            )}

            {/* Site Selection */}
            {needsSite && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    배정 현장 선택
                    {request.requested_role === 'worker' && <span className="text-red-500 ml-1">*필수</span>}
                  </label>
                  {selectedSites.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      {selectedSites.length}개 선택됨
                    </span>
                  )}
                </div>
                
                {/* Search bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="현장명 또는 주소로 검색..."
                    value={siteSearchTerm}
                    onChange={(e) => setSiteSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                {/* Selection buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={selectAllSites}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={clearAllSites}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    선택 해제
                  </button>
                </div>

                {/* Site list */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredSites.length > 0 ? (
                    filteredSites.map((site) => (
                      <label
                        key={site.id}
                        className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedSites.includes(site.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSites.includes(site.id)}
                          onChange={() => toggleSiteSelection(site.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{site.name}</p>
                          {site.address && (
                            <p className="text-xs text-gray-500">{site.address}</p>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="p-3 text-center text-gray-500 text-sm">
                      {siteSearchTerm ? '검색 결과가 없습니다.' : '현장 데이터를 불러오는 중...'}
                    </p>
                  )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  작업자는 최소 1개 이상의 현장을 선택해야 합니다. 여러 현장에서 근무하는 경우 복수 선택이 가능합니다.
                </p>
              </div>
            )}

            {/* Role-specific notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">승인 시 자동 처리 사항</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 임시 비밀번호가 자동 생성됩니다</li>
                <li>• 사용자 계정이 생성되고 프로필이 설정됩니다</li>
                <li>• 선택한 소속 업체에 배정됩니다</li>
                {needsSite && <li>• 선택한 현장에 작업자/관리자로 배정됩니다</li>}
                <li>• 승인 이메일이 발송됩니다 (준비중)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className={`px-5 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg ${
              processing ? 'animate-pulse' : ''
            }`}
          >
            {processing ? '처리 중...' : '승인'}
          </button>
        </div>
      </div>
    </div>
  )
}