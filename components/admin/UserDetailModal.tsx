'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  MapPin, 
  Building, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  Edit3,
  Save,
  AlertTriangle,
  CheckCircle,
  Key,
  Upload,
  Trash2,
  UserCheck,
  Clock,
  Activity,
  Briefcase,
  CreditCard,
  FileCheck,
  BarChart3,
  Download,
  Eye,
  Plus
} from 'lucide-react'
import { UserWithSites, UpdateUserData, updateUser, resetUserPassword, deleteUsers } from '@/app/actions/admin/users'
import { UserRole, UserStatus } from '@/types'
import {
  CustomSelect as Select,
  CustomSelectContent as SelectContent,
  CustomSelectItem as SelectItem,
  CustomSelectTrigger as SelectTrigger,
  CustomSelectValue as SelectValue
} from '@/components/ui/custom-select'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithSites | null
  onUserUpdated: () => void
  onUserDeleted?: () => void
}

export default function UserDetailModal({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated,
  onUserDeleted 
}: UserDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<Partial<UpdateUserData>>({})
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [userDocuments, setUserDocuments] = useState<any>({})
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)

  useEffect(() => {
    if (user && isOpen) {
      setEditData({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'active',
        organization_id: user.organization?.id || ''
      })
      setIsEditing(false)
      fetchOrganizations()
      fetchUserDocuments()
    }
  }, [user, isOpen])

  const fetchOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      } else {
        console.error('Failed to fetch organizations:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const fetchUserDocuments = async () => {
    if (!user) return
    
    setLoadingDocs(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        setUserDocuments(data.documents || {})
      } else {
        console.error('Failed to fetch user documents:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch user documents:', error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return

    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const response = await fetch(`/api/admin/users/${user.id}/documents`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchUserDocuments()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '파일 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleDocumentDelete = async (documentType: string) => {
    if (!user || !confirm('이 문서를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}/documents?documentType=${documentType}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchUserDocuments()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '문서 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Document delete error:', error)
      alert('문서 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDocumentDownload = async (documentType: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}/documents/download?documentType=${documentType}`)
      
      if (response.ok) {
        const data = await response.json()
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '다운로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleSave = async () => {
    if (!user || !editData.id) return

    setLoading(true)
    try {
      const result = await updateUser(editData as UpdateUserData)
      if (result.success) {
        alert(result.message)
        setIsEditing(false)
        onUserUpdated()
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('업데이트 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user) return

    if (!confirm(`${user.full_name}님의 비밀번호를 재설정하시겠습니까?\n새로운 임시 비밀번호가 생성됩니다.`)) {
      return
    }

    setLoading(true)
    try {
      const result = await resetUserPassword(user.id)
      if (result.success && result.data) {
        alert(`비밀번호가 재설정되었습니다.\n\n임시 비밀번호: ${result.data}\n\n이 비밀번호를 사용자에게 안전하게 전달해주세요.`)
      } else {
        alert(result.error || '비밀번호 재설정에 실패했습니다.')
      }
    } catch (error) {
      alert('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800' },
      site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800' },
      customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800' },
      admin: { text: '관리자', color: 'bg-red-100 text-red-800' },
      system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = roleConfig[role] || roleConfig.worker
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      active: { text: '활성', color: 'bg-green-100 text-green-800' },
      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800' },
      suspended: { text: '정지', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status || 'active']
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">사용자 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-end gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              편집
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                저장
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information & Organization */}
            <div className="grid grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">기본 정보</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">이름</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.full_name || ''}
                          onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <p className="text-sm font-medium">{user.full_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">역할</label>
                      {isEditing ? (
                        <Select
                          value={editData.role || user.role}
                          onValueChange={(value) => setEditData({ ...editData, role: value as UserRole })}
                        >
                          <SelectTrigger className="h-7 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worker">작업자</SelectItem>
                            <SelectItem value="site_manager">현장관리자</SelectItem>
                            <SelectItem value="customer_manager">파트너사</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">이메일</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    ) : (
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">전화번호</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {user.phone || '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">상태</label>
                      {isEditing ? (
                        <Select
                          value={editData.status || 'active'}
                          onValueChange={(value) => setEditData({ ...editData, status: value as UserStatus })}
                        >
                          <SelectTrigger className="h-7 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
                            <SelectItem value="suspended">정지</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(user.status || 'active')
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 소속 조직 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">소속 조직</h3>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {isEditing ? (
                    <Select
                      value={editData.organization_id || 'none'}
                      onValueChange={(value) => setEditData({ ...editData, organization_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="소속 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {loadingOrgs ? (
                          <SelectItem value="loading" disabled>
                            로딩 중...
                          </SelectItem>
                        ) : organizations.length > 0 ? (
                          organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-orgs" disabled>
                            조직이 없습니다
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : user.organization ? (
                    <div>
                      <p className="text-sm font-medium">{user.organization.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.organization.type === 'partner' ? '파트너사' : '일반'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">소속 없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900">계정 정보</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">생성일</p>
                  <p className="text-sm font-medium mt-1">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">마지막 로그인</p>
                  <p className="text-sm font-medium mt-1">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">로그인 횟수</p>
                  <p className="text-sm font-medium mt-1">{user.login_count || 0}회</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">최근 활동</p>
                  <p className="text-sm font-medium mt-1">
                    {user.last_login_at ? 
                      `${Math.floor((Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24))}일 전` : 
                      '-'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Site Assignments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">
                    현장 배정 ({user.site_assignments?.filter(a => a.is_active).length || 0})
                  </h3>
                </div>
              </div>
              {user.site_assignments && user.site_assignments.filter(a => a.is_active).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {user.site_assignments.filter(a => a.is_active).map((assignment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{assignment.site_name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            역할: {assignment.role === 'worker' ? '작업자' : assignment.role === 'site_manager' ? '현장담당' : assignment.role}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">배정된 현장이 없습니다</p>
                </div>
              )}
            </div>

            {/* Required Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900">필수 서류 현황</h3>
              </div>
              {loadingDocs ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">서류 정보를 불러오는 중...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(userDocuments).map(([docType, docInfo]: [string, any]) => (
                    <div key={docType} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{docInfo.label}</h4>
                          {docInfo.uploaded && docInfo.document && (
                            <p className="text-xs text-gray-500 mt-1">
                              {docInfo.document.original_filename}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {docInfo.uploaded ? (
                            <>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                업로드됨
                              </span>
                              <button
                                onClick={() => handleDocumentDownload(docType)}
                                className="p-1 hover:bg-gray-100 rounded text-blue-600"
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {isEditing && (
                                <button
                                  onClick={() => handleDocumentDelete(docType)}
                                  className="p-1 hover:bg-gray-100 rounded text-red-600"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                미제출
                              </span>
                              {isEditing && (
                                <div className="relative">
                                  <input
                                    type="file"
                                    id={`file-${docType}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleFileUpload(docType, file)
                                      }
                                    }}
                                    disabled={uploadingDoc === docType}
                                  />
                                  <button
                                    onClick={() => document.getElementById(`file-${docType}`)?.click()}
                                    disabled={uploadingDoc === docType}
                                    className="p-1 hover:bg-gray-100 rounded text-blue-600 disabled:opacity-50"
                                    title="업로드"
                                  >
                                    {uploadingDoc === docType ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Log Statistics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900">작업일지 통계</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {user.work_log_stats?.total_reports || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">총 작업일지</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {user.work_log_stats?.this_month || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">이번 달</p>
                </div>
              </div>
              {user.work_log_stats?.last_report_date && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-center">
                  <p className="text-xs text-gray-500">
                    최근 작성일: {new Date(user.work_log_stats.last_report_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}