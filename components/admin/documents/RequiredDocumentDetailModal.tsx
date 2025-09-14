'use client'

import React, { useState, useEffect } from 'react'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface DocumentRequirement {
  id: string
  code: string
  name_ko: string
  name_en?: string
  description?: string
  file_types: string[]
  max_file_size: number
}

interface RequiredDocument {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  document_type: string
  requirement_id: string
  submitted_by: string
  expiry_date?: string
  status: string
  created_at: string
  updated_at: string
  document_requirements?: DocumentRequirement
  submitted_by_profile?: User
  review_notes?: string
  reviewed_by?: string
}

interface UserDocumentSubmission {
  id: string
  submission_status: 'not_submitted' | 'submitted' | 'approved' | 'rejected' | 'expired'
  submitted_at?: string
  approved_at?: string
  rejected_at?: string
  expiry_date?: string
  rejection_reason?: string
  reviewed_by?: string
}

interface RequiredDocumentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  documentId: string | null
}

export default function RequiredDocumentDetailModal({
  isOpen,
  onClose,
  onSuccess,
  documentId
}: RequiredDocumentDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [document, setDocument] = useState<RequiredDocument | null>(null)
  const [submission, setSubmission] = useState<UserDocumentSubmission | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string>('')
  const [reviewNotes, setReviewNotes] = useState('')
  
  // Edit functionality states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument()
    }
  }, [isOpen, documentId])

  const fetchDocument = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      // Fetch document details
      const { data: docData, error: docError } = await supabase
        .from('unified_document_system')
        .select(`
          *,
          profiles:uploaded_by (
            id, full_name, email, role
          ),
          approver_profile:approved_by (
            id, full_name, email, role
          )
        `)
        .eq('id', documentId)
        .eq('category_type', 'required')
        .single()

      if (docError) throw docError
      setDocument(docData)
      setReviewNotes(docData.review_notes || '')
      setEditFormData({
        title: docData.title || '',
        description: docData.description || ''
      })

      // Fetch submission status
      if (docData.submitted_by && docData.requirement_id) {
        const { data: submissionData, error: submissionError } = await supabase
          .from('user_document_submissions')
          .select('*')
          .eq('user_id', docData.submitted_by)
          .eq('requirement_id', docData.requirement_id)
          .single()

        if (submissionError && submissionError.code !== 'PGRST116') {
          throw submissionError
        }
        setSubmission(submissionData)
      }
    } catch (error: unknown) {
      console.error('Error fetching document:', error)
      setError(error.message || '문서 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!document || !submission) return

    setLoading(true)
    setError('')

    try {
      const currentUser = await supabase.auth.getUser()
      const now = new Date().toISOString()

      // Update submission status
      const updateData: unknown = {
        submission_status: newStatus,
        reviewed_by: currentUser.data.user?.id,
        review_date: now
      }

      if (newStatus === 'approved') {
        updateData.approved_at = now
        updateData.rejected_at = null
        updateData.rejection_reason = null
      } else {
        updateData.rejected_at = now
        updateData.approved_at = null
        updateData.rejection_reason = reviewNotes || '승인 거부됨'
      }

      const { error: submissionError } = await supabase
        .from('user_document_submissions')
        .update(updateData)
        .eq('id', submission.id)

      if (submissionError) throw submissionError

      // Update document record
      const { error: docError } = await supabase
        .from('documents')
        .update({
          status: newStatus === 'approved' ? 'approved' : 'rejected',
          review_notes: reviewNotes,
          reviewed_by: currentUser.data.user?.id,
          review_date: now
        })
        .eq('id', document.id)

      if (docError) throw docError

      alert(`서류가 성공적으로 ${newStatus === 'approved' ? '승인' : '거부'}되었습니다.`)
      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error('Error updating status:', error)
      setError(error.message || '상태 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const startEditMode = () => {
    setIsEditMode(true)
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    if (document) {
      setEditFormData({
        title: document.title || '',
        description: document.description || ''
      })
    }
  }

  const saveDocumentChanges = async () => {
    if (!document) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      if (error) throw error

      // Update local document state
      setDocument(prev => prev ? {
        ...prev,
        title: editFormData.title,
        description: editFormData.description
      } : null)

      setIsEditMode(false)
      onSuccess() // Refresh parent component
    } catch (error: unknown) {
      console.error('Error updating document:', error)
      setError(error.message || '문서 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!document?.file_url) return

    try {
      const response = await fetch(document.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('파일 다운로드에 실패했습니다.')
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: '검토 대기',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        }
      case 'approved':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: '승인됨',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        }
      case 'rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: '거부됨',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        }
      case 'expired':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
          text: '만료됨',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        }
      default:
        return {
          icon: <Clock className="w-5 h-5 text-gray-500" />,
          text: '알 수 없음',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        }
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (!isOpen || !document) return null

  const statusInfo = getStatusInfo(document.status)
  const canApprove = document.status === 'pending' || document.status === 'submitted'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-3xl px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              필수 서류 상세보기
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-6">
            {/* 문서 기본 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* 제목 부분 */}
              <div className="mb-3">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="문서 제목을 입력하세요"
                  />
                ) : (
                  <h4 className="text-lg font-medium text-gray-900">{document.title}</h4>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">서류 유형:</span>
                  <span className="ml-2 text-gray-900">
                    {document.document_requirements?.requirement_name || document.document_type}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">제출자:</span>
                  <span className="ml-2 text-gray-900">
                    {document.submitted_by_profile?.full_name} ({document.submitted_by_profile?.email})
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">파일명:</span>
                  <span className="ml-2 text-gray-900">{document.file_name}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">파일 크기:</span>
                  <span className="ml-2 text-gray-900">
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">제출일:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(document.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                
                {document.expiry_date && (
                  <div>
                    <span className="font-medium text-gray-700">만료일:</span>
                    <span className={`ml-2 ${
                      isExpired(document.expiry_date) 
                        ? 'text-red-600 font-medium' 
                        : isExpiringSoon(document.expiry_date) 
                        ? 'text-orange-600 font-medium' 
                        : 'text-gray-900'
                    }`}>
                      {new Date(document.expiry_date).toLocaleDateString('ko-KR')}
                      {isExpired(document.expiry_date) && ' (만료됨)'}
                      {!isExpired(document.expiry_date) && isExpiringSoon(document.expiry_date) && ' (곧 만료)'}
                    </span>
                  </div>
                )}
              </div>

              {/* 설명 부분 */}
              <div className="mt-3">
                <span className="font-medium text-gray-700">설명:</span>
                {isEditMode ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="문서 설명을 입력하세요"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">{document.description || '설명이 없습니다.'}</p>
                )}
              </div>
            </div>

            {/* 승인 상태 */}
            <div className={`p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {statusInfo.icon}
                  <span className={`ml-2 font-medium ${statusInfo.textColor}`}>
                    {statusInfo.text}
                  </span>
                </div>
                
                <button
                  onClick={handleDownload}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  다운로드
                </button>
              </div>

              {submission && (
                <div className="mt-3 text-sm text-gray-600">
                  {submission.approved_at && (
                    <p>승인일: {new Date(submission.approved_at).toLocaleString('ko-KR')}</p>
                  )}
                  {submission.rejected_at && (
                    <p>거부일: {new Date(submission.rejected_at).toLocaleString('ko-KR')}</p>
                  )}
                  {submission.rejection_reason && (
                    <p className="mt-1 text-red-600">거부 사유: {submission.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>

            {/* 서류 요구사항 정보 */}
            {document.document_requirements && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">서류 요구사항</h5>
                <p className="text-sm text-blue-800">
                  {document.document_requirements.description}
                </p>
              </div>
            )}

            {/* 관리자 검토 노트 */}
            {canApprove && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">관리자 검토 노트</h5>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    {isEditing ? '취소' : '편집'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="검토 노트를 입력하세요..."
                  />
                ) : (
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    {reviewNotes || '검토 노트가 없습니다.'}
                  </p>
                )}
              </div>
            )}

            {/* 기존 검토 노트 (승인/거부된 경우) */}
            {!canApprove && document.review_notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">검토 노트</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{document.review_notes}</p>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading || isSaving}
            >
              닫기
            </button>
            
            {!canApprove && !isEditMode && (
              <button
                onClick={startEditMode}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
              >
                <Edit2 className="w-4 h-4 mr-1 inline" />
                편집
              </button>
            )}
            
            {isEditMode && (
              <>
                <button
                  onClick={cancelEditMode}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={saveDocumentChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-1 inline" />
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </>
            )}
            
            {canApprove && (
              <>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isEditMode}
                >
                  거부
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isEditMode}
                >
                  승인
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}