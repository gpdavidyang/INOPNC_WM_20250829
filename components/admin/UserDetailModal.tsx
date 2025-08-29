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
  CheckCircle
} from 'lucide-react'
import { UserWithSites, UpdateUserData, updateUser } from '@/app/actions/admin/users'
import { UserRole, UserStatus } from '@/types'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithSites | null
  onUserUpdated: () => void
}

export default function UserDetailModal({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}: UserDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<Partial<UpdateUserData>>({})

  useEffect(() => {
    if (user && isOpen) {
      setEditData({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'active'
      })
      setIsEditing(false)
    }
  }, [user, isOpen])

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

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
      admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
      system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
    }
    
    const config = roleConfig[role] || roleConfig.worker
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        <Shield className="h-4 w-4 mr-1" />
        {config.text}
      </span>
    )
  }

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
      suspended: { text: '정지', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = statusConfig[status || 'active']
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            사용자 상세 정보
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                편집
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  취소
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                기본 정보
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.full_name || ''}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{user.full_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    이메일
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="전화번호를 입력하세요"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {user.phone || '등록되지 않음'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    역할
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.role || user.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value as UserRole })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="worker">작업자</option>
                      <option value="site_manager">현장관리자</option>
                      <option value="customer_manager">파트너사</option>
                      <option value="admin">관리자</option>
                    </select>
                  ) : (
                    <div>{getRoleBadge(user.role)}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    상태
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.status || user.status || 'active'}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as UserStatus })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="suspended">정지</option>
                    </select>
                  ) : (
                    <div>{getStatusBadge(user.status || 'active')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Organization & Stats Card */}
            <div className="space-y-4">
              {/* Organization */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  소속 조직
                </h3>
                {user.organization ? (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.organization.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.organization.type}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">소속 조직이 없습니다</p>
                )}
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  계정 정보
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">생성일:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">마지막 로그인:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '없음'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">로그인 횟수:</span>
                    <span className="text-gray-900 dark:text-gray-100">{user.login_count || 0}회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site Assignments */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              현장 배정 ({user.site_assignments?.filter(a => a.is_active).length || 0})
            </h3>
            {user.site_assignments && user.site_assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.site_assignments.filter(a => a.is_active).map((assignment, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{assignment.site_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      역할: {assignment.role} | 배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">배정된 현장이 없습니다</p>
            )}
          </div>

          {/* Required Documents */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              필수 서류 현황
            </h3>
            {user.required_documents && user.required_documents.length > 0 ? (
              <div className="space-y-2">
                {user.required_documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-gray-100">{doc.document_type}</span>
                    <div className="flex items-center gap-2">
                      {doc.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {doc.status === 'rejected' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        doc.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}>
                        {doc.status === 'approved' ? '승인' :
                         doc.status === 'rejected' ? '반려' :
                         doc.status === 'submitted' ? '제출' : '대기'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">필수 서류 정보가 없습니다</p>
            )}
          </div>

          {/* Work Log Stats */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              작업일지 통계
            </h3>
            {user.work_log_stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.work_log_stats.total_reports}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">총 작업일지</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {user.work_log_stats.this_month}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">이번 달</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    최근 작성일
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.work_log_stats.last_report_date ? 
                      new Date(user.work_log_stats.last_report_date).toLocaleDateString('ko-KR') : 
                      '없음'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">작업일지 통계가 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}