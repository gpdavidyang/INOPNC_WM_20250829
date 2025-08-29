'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { ArrowLeft, Save, X, Plus, Minus } from 'lucide-react'
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
}

interface Organization {
  id: string
  name: string
}

interface PartnerFormProps {
  partner?: Partner | null
  profile: Profile
  onSave: () => void
  onCancel: () => void
}

const tradeTypes = [
  '철근공사', '콘크리트공사', '전기공사', '배관공사', '타일공사', '도배공사',
  '유리공사', '미장공사', '방수공사', '단열공사', '지붕공사', '조경공사',
  '토공사', '석공사', '목공사', '금속공사', '도장공사', '기타'
]

export default function PartnerForm({ partner, profile, onSave, onCancel }: PartnerFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    business_number: '',
    company_type: 'subcontractor' as const,
    trade_type: [] as string[],
    representative_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account: '',
    credit_rating: '',
    contract_start_date: '',
    contract_end_date: '',
    status: 'active' as const,
    notes: ''
  })
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [customTrade, setCustomTrade] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadOrganizations()
    
    if (partner) {
      setFormData({
        company_name: partner.company_name || '',
        business_number: partner.business_number || '',
        company_type: partner.company_type || 'subcontractor',
        trade_type: partner.trade_type || [],
        representative_name: partner.representative_name || '',
        contact_person: partner.contact_person || '',
        phone: partner.phone || '',
        email: partner.email || '',
        address: partner.address || '',
        bank_name: partner.bank_name || '',
        bank_account: partner.bank_account || '',
        credit_rating: partner.credit_rating || '',
        contract_start_date: partner.contract_start_date || '',
        contract_end_date: partner.contract_end_date || '',
        status: partner.status || 'active',
        notes: partner.notes || ''
      })
    }
  }, [partner])

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
      
      // Set default organization if only one exists
      if (data && data.length === 1) {
        setSelectedOrgId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTradeTypeChange = (trade: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        trade_type: [...prev.trade_type, trade]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        trade_type: prev.trade_type.filter(t => t !== trade)
      }))
    }
  }

  const addCustomTrade = () => {
    if (customTrade.trim() && !formData.trade_type.includes(customTrade.trim())) {
      setFormData(prev => ({
        ...prev,
        trade_type: [...prev.trade_type, customTrade.trim()]
      }))
      setCustomTrade('')
    }
  }

  const removeTradeType = (trade: string) => {
    setFormData(prev => ({
      ...prev,
      trade_type: prev.trade_type.filter(t => t !== trade)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_name.trim()) {
      alert('회사명을 입력해주세요.')
      return
    }

    if (!selectedOrgId) {
      alert('소속을 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        organization_id: selectedOrgId,
        trade_type: formData.trade_type.length > 0 ? formData.trade_type : null,
        updated_by: profile.id,
        ...(partner ? { updated_at: new Date().toISOString() } : { created_by: profile.id })
      }

      if (partner) {
        const { error } = await supabase
          .from('partner_companies')
          .update(submitData)
          .eq('id', partner.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('partner_companies')
          .insert([submitData])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Failed to save partner:', error)
      alert('파트너사 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {partner ? '파트너사 수정' : '새 파트너사 등록'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              파트너사 정보를 입력하세요
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            type="submit"
            form="partner-form"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="partner-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 회사명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* 사업자번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사업자번호
              </label>
              <input
                type="text"
                value={formData.business_number}
                onChange={(e) => handleInputChange('business_number', e.target.value)}
                placeholder="000-00-00000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 소속 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                소속 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">소속을 선택하세요</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 회사 구분 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                회사 구분
              </label>
              <select
                value={formData.company_type}
                onChange={(e) => handleInputChange('company_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="general_contractor">종합건설업</option>
                <option value="subcontractor">전문건설업</option>
                <option value="supplier">자재공급업체</option>
                <option value="consultant">설계/감리</option>
              </select>
            </div>

            {/* 대표자명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                대표자명
              </label>
              <input
                type="text"
                value={formData.representative_name}
                onChange={(e) => handleInputChange('representative_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 담당자명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                담당자명
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                연락처
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">활성</option>
                <option value="suspended">중단</option>
                <option value="terminated">종료</option>
              </select>
            </div>
          </div>
        </div>

        {/* 업종 정보 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">업종 정보</h2>
          
          {/* 업종 선택 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tradeTypes.map((trade) => (
                <label key={trade} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.trade_type.includes(trade)}
                    onChange={(e) => handleTradeTypeChange(trade, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{trade}</span>
                </label>
              ))}
            </div>

            {/* 커스텀 업종 추가 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTrade}
                onChange={(e) => setCustomTrade(e.target.value)}
                placeholder="기타 업종 직접 입력"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addCustomTrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                추가
              </button>
            </div>

            {/* 선택된 업종 */}
            {formData.trade_type.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">선택된 업종:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.trade_type.map((trade) => (
                    <span
                      key={trade}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {trade}
                      <button
                        type="button"
                        onClick={() => removeTradeType(trade)}
                        className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 계약/금융 정보 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">계약/금융 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 은행명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                은행명
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                계좌번호
              </label>
              <input
                type="text"
                value={formData.bank_account}
                onChange={(e) => handleInputChange('bank_account', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 신용등급 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                신용등급
              </label>
              <input
                type="text"
                value={formData.credit_rating}
                onChange={(e) => handleInputChange('credit_rating', e.target.value)}
                placeholder="예: AAA, AA, A"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 계약 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                계약 시작일
              </label>
              <input
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 계약 종료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                계약 종료일
              </label>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">메모</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            placeholder="추가 정보나 특이사항을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </form>
    </div>
  )
}