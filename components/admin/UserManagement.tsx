'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, UserPlus, Edit, Trash2, MoreVertical, Search, Filter, Eye,
  User, Mail, Phone, Building, Shield, FileText, ClipboardCheck, Calendar, Plus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import AdminDataTable from './AdminDataTable'
import UserDetail from './users/UserDetail'
import CreateUserModal from './users/CreateUserModal'
import EditUserModal from './users/EditUserModal'
import UserDetailModal from './UserDetailModal'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUsers, 
  updateUserRole,
  updateUserStatus,
  exportUsers 
} from '@/app/actions/admin/users'
import type { UserWithSites, UserRole, UserStatus, Profile } from '@/types'

interface UserManagementProps {
  profile?: Profile
}

export default function UserManagement({ profile }: UserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithSites[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithSites | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailUser, setDetailUser] = useState<UserWithSites | null>(null)

  // Load users data
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // console.log('[UserManagement] Loading users with params:', {
      //   currentPage,
      //   pageSize,
      //   searchTerm,
      //   roleFilter,
      //   statusFilter
      // })
      
      const result = await getUsers(
        currentPage,
        pageSize,
        searchTerm,
        roleFilter || undefined,
        statusFilter || undefined
      )
      
      // console.log('[UserManagement] GetUsers result:', result)
      
      if (result.success && result.data) {
        // console.log('[UserManagement] Users loaded:', result.data.users.length, 'total:', result.data.total)
        setUsers(result.data.users)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        console.error('[UserManagement] Failed to load users:', result.error)
        setError(result.error || '사용자 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('[UserManagement] Error loading users:', err)
      setError('사용자 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, roleFilter, statusFilter])

  // Load data on mount and when filters change with debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers()
    }, searchTerm ? 300 : 0) // Only debounce search, not pagination/filters

    return () => clearTimeout(handler)
  }, [currentPage, searchTerm, roleFilter, statusFilter, loadUsers])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle role filter
  const handleRoleFilter = (role: UserRole | '') => {
    setRoleFilter(role)
    setCurrentPage(1)
  }

  // Handle status filter
  const handleStatusFilter = (status: UserStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Handle bulk delete
  const handleBulkDelete = async (userIds: string[]) => {
    try {
      const result = await deleteUsers(userIds)
      if (result.success) {
        await loadUsers()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle bulk role update
  const handleBulkRoleUpdate = (role: UserRole) => async (userIds: string[]) => {
    try {
      const result = await updateUserRole(userIds, role)
      if (result.success) {
        await loadUsers()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('역할 업데이트 중 오류가 발생했습니다.')
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = (status: UserStatus) => async (userIds: string[]) => {
    try {
      const result = await updateUserStatus(userIds, status)
      if (result.success) {
        await loadUsers()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  // Handle create user
  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  // Handle edit user
  const handleEditUser = (user: UserWithSites) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  // Handle view user
  const handleViewUser = (user: UserWithSites) => {
    router.push(`/dashboard/admin/users/${user.id}`)
  }

  // Handle password reset
  const handlePasswordReset = async (user: UserWithSites) => {
    if (!confirm(`${user.full_name}님의 비밀번호를 재설정하시겠습니까?`)) {
      return
    }

    try {
      const result = await resetUserPassword(user.id)
      if (result.success && result.data) {
        alert(`비밀번호가 재설정되었습니다.\n새 임시 비밀번호: ${result.data}`)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('비밀번호 재설정 중 오류가 발생했습니다.')
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'full_name',
      label: '사용자 정보',
      sortable: true,
      filterable: true,
      render: (value: string, user: UserWithSites) => (
        <div className="flex items-center">
          <User className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <button
              onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
            >
              {value}
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </div>
            {user.phone && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {user.phone}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'organization',
      label: '소속 조직',
      render: (organization: UserWithSites['organization']) => {
        if (!organization) {
          return <span className="text-gray-400">소속 없음</span>
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center text-gray-900 dark:text-gray-100 font-medium">
              <Building className="h-3 w-3 mr-1" />
              {organization.name}
            </div>
          </div>
        )
      }
    },
    {
      key: 'role',
      label: '역할',
      render: (value: UserRole) => {
        const roleConfig = {
          worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
          site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
          admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
          system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
        }
        
        const config = roleConfig[value] || roleConfig.worker
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Shield className="h-3 w-3 mr-1" />
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: '상태',
      render: (value: UserStatus) => {
        const statusConfig = {
          active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
          suspended: { text: '정지', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
        }
        
        const config = statusConfig[value || 'active']
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'site_assignments',
      label: '배정 현장',
      render: (assignments: UserWithSites['site_assignments'], user: UserWithSites) => {
        const activeAssignments = assignments?.filter(a => a.is_active) || []
        if (activeAssignments.length === 0) {
          return (
            <div className="text-sm">
              <span className="text-orange-600 dark:text-orange-400">미배정</span>
              <button
                onClick={() => router.push(`/dashboard/admin/assignment?user=${user.id}`)}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                배정하기
              </button>
            </div>
          )
        }
        
        return (
          <div className="space-y-1">
            {activeAssignments.slice(0, 2).map((assignment, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-900 dark:text-gray-100">
                  {assignment.site_name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  ({assignment.role})
                </span>
              </div>
            ))}
            {activeAssignments.length > 2 && (
              <div className="text-xs text-gray-400">
                +{activeAssignments.length - 2} 더보기
              </div>
            )}
            <button
              onClick={() => router.push(`/dashboard/admin/assignment?user=${user.id}`)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              배정 관리
            </button>
          </div>
        )
      }
    },
    {
      key: 'required_documents',
      label: '필수 서류',
      render: (documents: UserWithSites['required_documents']) => {
        if (!documents || documents.length === 0) {
          return <span className="text-gray-400">서류 없음</span>
        }
        
        const submitted = documents.filter(d => d.status === 'submitted' || d.status === 'approved').length
        const total = documents.length
        const pending = documents.filter(d => d.status === 'pending').length
        const rejected = documents.filter(d => d.status === 'rejected').length
        
        const getStatusColor = () => {
          if (rejected > 0) return 'text-red-600 dark:text-red-400'
          if (pending > 0) return 'text-yellow-600 dark:text-yellow-400'
          if (submitted === total) return 'text-green-600 dark:text-green-400'
          return 'text-gray-600 dark:text-gray-400'
        }
        
        return (
          <div className="text-sm">
            <div className={`flex items-center font-medium ${getStatusColor()}`}>
              <FileText className="h-3 w-3 mr-1" />
              {submitted}/{total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {pending > 0 && <span className="text-yellow-600">대기 {pending}건</span>}
              {rejected > 0 && (
                <span className={`${pending > 0 ? 'ml-2' : ''} text-red-600`}>반려 {rejected}건</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'work_log_stats',
      label: '작업일지',
      render: (stats: UserWithSites['work_log_stats']) => {
        if (!stats) {
          return <span className="text-gray-400">통계 없음</span>
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center text-gray-900 dark:text-gray-100">
              <ClipboardCheck className="h-3 w-3 mr-1" />
              <span className="font-medium">총 {stats.total_reports}건</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              이번 달 {stats.this_month}건
            </div>
            {stats.last_report_date && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                최근 {new Date(stats.last_report_date).toLocaleDateString('ko-KR')}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'created_at',
      label: '생성일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ]

  // Define bulk actions
  const bulkActions = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'activate',
      label: '활성화',
      icon: UserCheck,
      onClick: handleBulkStatusUpdate('active')
    },
    {
      id: 'deactivate',
      label: '비활성화',
      icon: UserX,
      variant: 'secondary' as const,
      onClick: handleBulkStatusUpdate('inactive')
    },
    {
      id: 'set-worker',
      label: '작업자로 변경',
      icon: User,
      variant: 'secondary' as const,
      onClick: handleBulkRoleUpdate('worker')
    },
    {
      id: 'set-manager',
      label: '현장관리자로 변경',
      icon: Shield,
      variant: 'secondary' as const,
      onClick: handleBulkRoleUpdate('site_manager')
    }
  ]


  // Custom actions for individual users
  const customActions = [
    {
      icon: Key,
      label: '비밀번호 재설정',
      onClick: handlePasswordReset,
      show: (user: UserWithSites) => user.role !== 'system_admin' || profile?.role === 'system_admin'
    }
  ]
  
  // Handle individual user deletion
  const handleDeleteUser = async (user: UserWithSites) => {
    if (!confirm(`정말로 ${user.full_name || user.email} 사용자를 삭제하시겠습니까?`)) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteUsers([user.id])
      if (result.success) {
        toast.success('사용자가 삭제되었습니다')
        await loadUsers()
      } else {
        toast.error(result.error || '사용자 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('사용자 삭제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex flex-row gap-2 flex-shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value as UserRole | '')}
            className="min-w-[120px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 역할</option>
            <option value="worker">작업자</option>
            <option value="site_manager">현장관리자</option>
            <option value="customer_manager">파트너사</option>
            <option value="admin">관리자</option>
            <option value="system_admin">시스템관리자</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as UserStatus | '')}
            className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="suspended">정지</option>
          </select>
          
          <button
            onClick={() => router.push('/dashboard/admin/assignment')}
            className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            통합 배정 관리
          </button>
          
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 사용자
          </button>
        </div>
      </div>

      {/* Users table */}
      <AdminDataTable
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(user: UserWithSites) => user.id}
        onView={handleViewUser}
        onDelete={handleDeleteUser}
        customActions={customActions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        emptyMessage="사용자가 없습니다"
        emptyDescription="새 사용자를 추가하여 시작하세요."
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalCount={totalCount}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Modals */}
      <UserDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setDetailUser(null)
        }}
        user={detailUser}
        onUserUpdated={loadUsers}
        onUserDeleted={() => {
          setShowDetailModal(false)
          setDetailUser(null)
          loadUsers()
        }}
      />

      {showCreateModal && (
        <UserCreateEditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
          }}
        />
      )}
      
      {showEditModal && editingUser && (
        <UserCreateEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingUser(null)
            loadUsers()
          }}
          user={editingUser}
        />
      )}
    </div>
  )
}

// User Create/Edit Modal Component
interface UserCreateEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: UserWithSites
}

function UserCreateEditModal({ isOpen, onClose, onSuccess, user }: UserCreateEditModalProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    full_name: '',
    phone: '',
    role: 'worker',
    status: 'active'
  })
  
  const [loading, setLoading] = useState(false)

  const isEditing = !!user

  // Initialize form data when editing
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role,
        status: user.status || 'active'
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      let result
      if (isEditing) {
        result = await updateUser({ id: user.id, ...formData } as UpdateUserData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        alert(result.message)
        onSuccess()
      } else {
        if (result.error) {
          alert(result.error)
        }
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {isEditing ? '사용자 편집' : '새 사용자 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일 *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={isEditing} // Don't allow email changes in edit mode
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이름 *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                역할 *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="worker">작업자</option>
                <option value="site_manager">현장관리자</option>
                <option value="customer_manager">파트너사</option>
                <option value="admin">관리자</option>
                <option value="system_admin">시스템관리자</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="suspended">정지</option>
              </select>
            </div>

            {!isEditing && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  사용자 생성 시 임시 비밀번호가 자동 생성됩니다. 생성 후 사용자에게 전달해주세요.
                </p>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '저장 중...' : isEditing ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}