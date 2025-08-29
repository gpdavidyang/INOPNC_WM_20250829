'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, FileText, User, Calendar, AlertCircle } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface DocumentRequirement {
  id: string
  requirement_name: string
  document_type: string
  description?: string
  file_format_allowed: string[]
  max_file_size_mb: number
  instructions?: string
}

interface RequiredDocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RequiredDocumentUploadModal({
  isOpen,
  onClose,
  onSuccess
}: RequiredDocumentUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_id: '',
    requirement_id: '',
    expiry_date: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')

  const supabase = createClient()

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchRequirements()
      resetForm()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['worker', 'site_manager', 'partner'])
        .eq('status', 'active')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('is_active', true)
        .order('requirement_name')

      if (error) throw error
      setRequirements(data || [])
    } catch (error) {
      console.error('Error fetching requirements:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      user_id: '',
      requirement_id: '',
      expiry_date: ''
    })
    setSelectedFile(null)
    setError('')
  }

  const getSelectedRequirement = () => {
    return requirements.find(r => r.id === formData.requirement_id)
  }

  const handleFileSelect = (file: File) => {
    const selectedReq = getSelectedRequirement()
    if (!selectedReq) {
      setError('먼저 서류 유형을 선택해주세요.')
      return
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension && !selectedReq.file_format_allowed.includes(fileExtension)) {
      setError(`지원되지 않는 파일 형식입니다. 허용된 형식: ${selectedReq.file_format_allowed.join(', ').toUpperCase()}`)
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > selectedReq.max_file_size_mb) {
      setError(`파일 크기는 ${selectedReq.max_file_size_mb}MB를 초과할 수 없습니다.`)
      return
    }

    setSelectedFile(file)
    setError('')
    
    // Auto-fill title if empty
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: `${selectedReq.requirement_name} - ${users.find(u => u.id === formData.user_id)?.full_name || ''}`
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
    if (!formData.user_id) {
      setError('제출자를 선택해주세요.')
      return false
    }
    if (!formData.requirement_id) {
      setError('서류 유형을 선택해주세요.')
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
      const filePath = `required-documents/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile!)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Create document record
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        file_url: urlData.publicUrl,
        file_name: selectedFile!.name,
        file_size: selectedFile!.size,
        mime_type: selectedFile!.type,
        document_type: getSelectedRequirement()?.document_type,
        folder_path: '/required-documents',
        owner_id: (await supabase.auth.getUser()).data.user?.id,
        is_public: false,
        document_category: 'required',
        requirement_id: formData.requirement_id,
        submitted_by: formData.user_id,
        expiry_date: formData.expiry_date || null,
        status: 'pending'
      }

      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (insertError) throw insertError

      // Update user submission status
      await supabase
        .from('user_document_submissions')
        .update({
          document_id: newDoc.id,
          submission_status: 'submitted',
          submitted_at: new Date().toISOString(),
          expiry_date: formData.expiry_date || null
        })
        .eq('user_id', formData.user_id)
        .eq('requirement_id', formData.requirement_id)

      alert('필수 제출 서류가 성공적으로 등록되었습니다.')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error uploading required document:', error)
      setError(error.message || '서류 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const selectedRequirement = getSelectedRequirement()
  const selectedUser = users.find(u => u.id === formData.user_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              필수 서류 직접 등록
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
            <div className="space-y-6">
              {/* 제출자 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제출자 *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, user_id: e.target.value }))
                    // Reset title when user changes
                    if (selectedRequirement && e.target.value) {
                      const user = users.find(u => u.id === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        title: `${selectedRequirement.requirement_name} - ${user?.full_name || ''}`
                      }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">제출자를 선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* 서류 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서류 유형 *
                </label>
                <select
                  value={formData.requirement_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, requirement_id: e.target.value }))
                    // Reset file and title when requirement changes
                    setSelectedFile(null)
                    if (e.target.value && selectedUser) {
                      const req = requirements.find(r => r.id === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        title: `${req?.requirement_name} - ${selectedUser.full_name}`
                      }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">서류 유형을 선택하세요</option>
                  {requirements.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.requirement_name}
                    </option>
                  ))}
                </select>
                {selectedRequirement && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>설명:</strong> {selectedRequirement.description}
                    </p>
                    {selectedRequirement.instructions && (
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>안내사항:</strong> {selectedRequirement.instructions}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      허용 파일 형식: {selectedRequirement.file_format_allowed.join(', ').toUpperCase()} | 
                      최대 크기: {selectedRequirement.max_file_size_mb}MB
                    </p>
                  </div>
                )}
              </div>

              {/* 서류명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서류명 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="서류명을 입력하세요"
                  required
                />
              </div>

              {/* 만료일 (옵션) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  만료일 (해당하는 경우)
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="서류에 대한 추가 설명을 입력하세요..."
                />
              </div>

              {/* 파일 업로드 */}
              <div>
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
                    accept={selectedRequirement?.file_format_allowed.map(ext => `.${ext}`).join(',')}
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
                      {selectedRequirement && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedRequirement.file_format_allowed.join(', ').toUpperCase()} 
                          (최대 {selectedRequirement.max_file_size_mb}MB)
                        </p>
                      )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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