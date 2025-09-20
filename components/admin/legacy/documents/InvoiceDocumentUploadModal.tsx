'use client'

import React, { useState, useRef } from 'react'
import { getSessionUser } from '@/lib/supabase/session'

interface Site {
  id: string
  name: string
  address: string
}

interface Organization {
  id: string
  name: string
  business_registration_number?: string
}

interface InvoiceDocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sites: Site[]
}

// 기성청구 문서 유형
const documentTypes = [
  { value: 'contract', label: '계약서' },
  { value: 'work_order', label: '작업지시서' },
  { value: 'progress_report', label: '진행보고서' },
  { value: 'invoice', label: '청구서' },
  { value: 'completion_report', label: '완료보고서' },
  { value: 'payment_request', label: '대금청구서' },
  { value: 'tax_invoice', label: '세금계산서' },
  { value: 'other', label: '기타 서류' }
]

// 계약 단계
const contractPhases = [
  { value: 'pre_contract', label: '계약 전' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' }
]

export default function InvoiceDocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  sites
}: InvoiceDocumentUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'invoice',
    contract_phase: 'in_progress',
    site_id: '',
    partner_company_id: '',
    amount: '',
    due_date: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')

  const supabase = createClient()

  // Fetch organizations when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchOrganizations()
      resetForm()
    }
  }, [isOpen])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, business_registration_number')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: 'invoice',
      contract_phase: 'in_progress',
      site_id: '',
      partner_company_id: '',
      amount: '',
      due_date: ''
    })
    setSelectedFile(null)
    setError('')
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setError('지원되지 않는 파일 형식입니다. PDF, 이미지(JPG, PNG), Word 문서만 업로드 가능합니다.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    setSelectedFile(file)
    setError('')
    
    // Auto-fill title with filename if empty
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '')
      }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('서류명을 입력해주세요.')
      return false
    }
    if (!formData.document_type) {
      setError('문서 유형을 선택해주세요.')
      return false
    }
    if (!formData.site_id) {
      setError('현장을 선택해주세요.')
      return false
    }
    if (!formData.partner_company_id) {
      setError('파트너사를 선택해주세요.')
      return false
    }
    if (!selectedFile) {
      setError('파일을 선택해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      // Upload file to storage first
      const fileExt = selectedFile!.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `invoice-documents/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile!)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Get current user session
      const user = await getSessionUser(supabase)
      if (!user) throw new Error('User not authenticated')

      // Create document record for unified_document_system
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_name: selectedFile!.name,
        original_filename: selectedFile!.name,
        file_size: selectedFile!.size,
        mime_type: selectedFile!.type,
        category_type: 'invoice',
        status: 'active',
        folder_path: '/invoice-documents',
        uploaded_by: user.id,
        owner_id: user.id,
        is_public: false,
        site_id: formData.site_id,
        metadata: {
          document_type: formData.document_type,
          contract_phase: formData.contract_phase,
          partner_company_id: formData.partner_company_id,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          due_date: formData.due_date || null,
          approval_status: 'pending'
        }
      }

      const { error: insertError } = await supabase
        .from('unified_document_system')
        .insert([documentData])

      if (insertError) throw insertError

      alert('기성청구 서류가 성공적으로 등록되었습니다.')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error('Error uploading invoice document:', error)
      setError(error.message || '서류 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              기성청구 서류 등록
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 서류명 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서류명 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 2024년 1분기 기성청구서"
                  required
                />
              </div>

              {/* 문서 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문서 유형 *
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 계약 단계 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계약 단계 *
                </label>
                <select
                  value={formData.contract_phase}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_phase: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {contractPhases.map((phase) => (
                    <option key={phase.value} value={phase.value}>
                      {phase.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 현장 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현장 *
                </label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, site_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">현장을 선택하세요</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 파트너사 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파트너사 *
                </label>
                <select
                  value={formData.partner_company_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner_company_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">파트너사를 선택하세요</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  금액 (원)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* 만료일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  만료일
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 설명 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="서류에 대한 상세 설명을 입력하세요..."
                />
              </div>

              {/* 파일 업로드 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일 업로드 *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-center">
                      <FileText className="w-8 h-8 text-blue-500 mr-3" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        파일을 드래그하여 놓거나 클릭하여 선택하세요
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG, Word (최대 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? '등록 중...' : '서류 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
