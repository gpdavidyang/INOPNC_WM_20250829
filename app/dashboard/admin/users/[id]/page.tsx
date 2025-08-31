'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, Shield, Building, Calendar, FileText, ClipboardCheck, Edit, Key, UserCheck, UserX } from 'lucide-react'
import { UserWithSites, getUser, updateUser, resetUserPassword, updateUserStatus } from '@/app/actions/admin/users'
import { UserRole, UserStatus } from '@/types'
import { toast } from 'sonner'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserWithSites | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: '' as UserRole,
    status: '' as UserStatus
  })

  useEffect(() => {
    loadUser()
  }, [userId])

  const loadUser = async () => {
    setLoading(true)
    try {
      const result = await getUser(userId)
      if (result.success && result.data) {
        setUser(result.data)
        setFormData({
          full_name: result.data.full_name,
          phone: result.data.phone || '',
          role: result.data.role,
          status: result.data.status || 'active'
        })
      } else {
        toast.error(result.error || '사용자 정보를 불러오는데 실패했습니다.')
        router.push('/dashboard/admin/users')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      toast.error('사용자 정보를 불러오는데 실패했습니다.')
      router.push('/dashboard/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const result = await updateUser({
        id: user.id,
        ...formData
      })
      
      if (result.success) {
        toast.success('사용자 정보가 수정되었습니다.')
        setIsEditing(false)
        loadUser()
      } else {
        toast.error(result.error || '수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user) return
    
    if (!confirm(`${user.full_name}님의 비밀번호를 재설정하시겠습니까?`)) {
      return
    }

    try {
      const result = await resetUserPassword(user.id)
      if (result.success && result.data) {
        alert(`비밀번호가 재설정되었습니다.\n새 임시 비밀번호: ${result.data}`)
      } else {
        toast.error(result.error || '비밀번호 재설정에 실패했습니다.')
      }
    } catch (error) {
      toast.error('비밀번호 재설정 중 오류가 발생했습니다.')
    }
  }

  const handleStatusToggle = async () => {
    if (!user) return
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '활성화' : '비활성화'
    
    if (!confirm(`${user.full_name}님을 ${statusText}하시겠습니까?`)) {
      return
    }

    try {
      const result = await updateUserStatus([user.id], newStatus)
      if (result.success) {
        toast.success(`사용자가 ${statusText}되었습니다.`)
        loadUser()
      } else {
        toast.error(result.error || `${statusText}에 실패했습니다.`)
      }
    } catch (error) {
      toast.error(`${statusText} 중 오류가 발생했습니다.`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const roleConfig = {
    worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
  }

  const statusConfig = {
    active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
    suspended: { text: '정지', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            사용자 목록으로 돌아가기
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              사용자 상세 정보
            </h1>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    비밀번호 재설정
                  </button>
                  <button
                    onClick={handleStatusToggle}
                    className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
                      user.status === 'active' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {user.status === 'active' ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        비활성화
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        활성화
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    저장
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Information Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                기본 정보
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-gray-100">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {user.full_name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    이메일
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-gray-100">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {user.phone || '-'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    역할
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="worker">작업자</option>
                      <option value="site_manager">현장관리자</option>
                      <option value="customer_manager">파트너사</option>
                      <option value="admin">관리자</option>
                      <option value="system_admin">시스템관리자</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${roleConfig[user.role].color}`}>
                        {roleConfig[user.role].text}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    상태
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="suspended">정지</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[user.status || 'active'].color}`}>
                      {statusConfig[user.status || 'active'].text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Organization & Additional Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                소속 및 추가 정보
              </h2>
              
              <div className="space-y-4">
                {user.organization && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      소속 조직
                    </label>
                    <div className="flex items-center text-gray-900 dark:text-gray-100">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {user.organization.name}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    가입일
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {user.work_log_stats && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      작업일지 통계
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-900 dark:text-gray-100">
                        <ClipboardCheck className="h-4 w-4 mr-2 text-gray-400" />
                        총 {user.work_log_stats.total_reports}건
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        이번 달 {user.work_log_stats.this_month}건
                      </div>
                      {user.work_log_stats.last_report_date && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          최근 작성: {new Date(user.work_log_stats.last_report_date).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {user.required_documents && user.required_documents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      필수 서류
                    </label>
                    <div className="space-y-2">
                      {user.required_documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {doc.document_name}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            doc.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.status === 'approved' ? '승인' :
                             doc.status === 'submitted' ? '제출' :
                             doc.status === 'rejected' ? '반려' : '대기'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Site Assignments */}
        {user.site_assignments && user.site_assignments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              배정 현장
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      현장명
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      역할
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      배정일
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.site_assignments.map((assignment, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {assignment.site_name}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {assignment.role}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {new Date(assignment.assigned_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          assignment.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {assignment.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}