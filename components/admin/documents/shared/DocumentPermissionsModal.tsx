'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SharedDocument, DocumentPermission } from '@/types/shared-documents'
import {
  X, Plus, Trash2, Save, AlertCircle, Users, User, Building2, 
  Shield, Eye, Edit, Download, Share2, Calendar, Check, ChevronDown,
  Copy, Link, Clock, ExternalLink
} from 'lucide-react'

interface DocumentPermissionsModalProps {
  document: SharedDocument
  onClose: () => void
  onSuccess: () => void
}

interface PermissionFormData {
  permission_type: 'role_based' | 'user_specific' | 'site_specific' | 'organization_specific'
  target_role?: string
  target_user_id?: string
  target_site_id?: string
  target_organization_id?: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_share: boolean
  can_download: boolean
  expires_at?: string
}

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

interface SiteOption {
  id: string
  name: string
  address?: string
}

interface OrganizationOption {
  id: string
  name: string
}

export default function DocumentPermissionsModal({
  document,
  onClose,
  onSuccess
}: DocumentPermissionsModalProps) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 폼 상태
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<PermissionFormData>({
    permission_type: 'role_based',
    can_view: true,
    can_edit: false,
    can_delete: false,
    can_share: false,
    can_download: true
  })
  
  // 옵션 데이터
  const [users, setUsers] = useState<UserOption[]>([])
  const [sites, setSites] = useState<SiteOption[]>([])
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // 공유 링크 상태
  const [shareTokens, setShareTokens] = useState<any[]>([])
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  const supabase = createClient()

  // 역할 옵션
  const roleOptions = [
    { value: 'worker', label: '작업자' },
    { value: 'site_manager', label: '현장관리자' },
    { value: 'admin', label: '관리자' },
    { value: 'customer_manager', label: '고객사 관리자' }
  ]

  // 권한 목록 로드
  const loadPermissions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/permissions`)
      if (!response.ok) throw new Error('Failed to load permissions')
      
      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (error) {
      console.error('Failed to load permissions:', error)
      setError('권한 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 옵션 데이터 로드
  const loadOptions = async () => {
    if (loadingOptions) return
    setLoadingOptions(true)
    
    try {
      const [usersRes, sitesRes, orgsRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email, role').eq('status', 'active'),
        supabase.from('sites').select('id, name, address').eq('status', 'active'),
        supabase.from('organizations').select('id, name, type').eq('status', 'active')
      ])

      if (usersRes.data) setUsers(usersRes.data)
      if (sitesRes.data) setSites(sitesRes.data)
      if (orgsRes.data) setOrganizations(orgsRes.data)
    } catch (error) {
      console.error('Failed to load options:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    loadPermissions()
    loadOptions()
    loadShareTokens()
  }, [document.id])

  // 공유 토큰 목록 로드
  const loadShareTokens = async () => {
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/share`)
      if (response.ok) {
        const data = await response.json()
        setShareTokens(data.tokens || [])
      }
    } catch (error) {
      console.error('Failed to load share tokens:', error)
    }
  }

  // 새 공유 링크 생성
  const generateShareLink = async (expiresInHours: number = 24) => {
    setGeneratingLink(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          expiresInHours,
          allowDownload: true 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate share link')
      }

      const data = await response.json()
      await loadShareTokens()
      
      // Auto-copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl)
      setCopiedToken(data.token)
      setTimeout(() => setCopiedToken(null), 3000)
      
    } catch (error: unknown) {
      setError(error.message)
    } finally {
      setGeneratingLink(false)
    }
  }

  // 공유 링크 복사
  const copyShareLink = async (shareUrl: string, token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  // 모든 공유 링크 취소
  const revokeAllShareLinks = async () => {
    if (!confirm('모든 공유 링크를 취소하시겠습니까?')) return
    
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/share`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share links')
      }

      await loadShareTokens()
    } catch (error: unknown) {
      setError(error.message)
    }
  }

  // 새 권한 추가
  const handleAddPermission = async () => {
    if (!validateFormData()) return
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create permission')
      }

      await loadPermissions()
      setShowAddForm(false)
      resetForm()
    } catch (error: unknown) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  // 권한 수정
  const handleUpdatePermission = async (permissionId: string, updates: Partial<DocumentPermission>) => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/permissions/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update permission')
      }

      await loadPermissions()
    } catch (error: unknown) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  // 권한 삭제
  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('이 권한을 삭제하시겠습니까?')) return
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/shared-documents/${document.id}/permissions/${permissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete permission')
      }

      await loadPermissions()
    } catch (error: unknown) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  // 폼 검증
  const validateFormData = () => {
    const { permission_type, target_role, target_user_id, target_site_id, target_organization_id } = formData
    
    if (permission_type === 'role_based' && !target_role) {
      setError('역할을 선택해주세요.')
      return false
    }
    
    if (permission_type === 'user_specific' && !target_user_id) {
      setError('사용자를 선택해주세요.')
      return false
    }
    
    if (permission_type === 'site_specific' && !target_site_id) {
      setError('현장을 선택해주세요.')
      return false
    }
    
    if (permission_type === 'organization_specific' && !target_organization_id) {
      setError('조직을 선택해주세요.')
      return false
    }
    
    return true
  }

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      permission_type: 'role_based',
      can_view: true,
      can_edit: false,
      can_delete: false,
      can_share: false,
      can_download: true
    })
    setError(null)
  }

  // 권한 표시 이름 가져오기
  const getPermissionDisplayName = (permission: DocumentPermission) => {
    switch (permission.permission_type) {
      case 'role_based':
        return roleOptions.find(r => r.value === permission.target_role)?.label || permission.target_role
      case 'user_specific':
        return permission.target_user?.name || permission.target_user?.email
      case 'site_specific':
        return permission.target_site?.name
      case 'organization_specific':
        return permission.target_organization?.name
      default:
        return 'Unknown'
    }
  }

  // 권한 아이콘 가져오기
  const getPermissionIcon = (permission: DocumentPermission) => {
    switch (permission.permission_type) {
      case 'role_based':
        return <Shield className="h-4 w-4" />
      case 'user_specific':
        return <User className="h-4 w-4" />
      case 'site_specific':
        return <Building2 className="h-4 w-4" />
      case 'organization_specific':
        return <Users className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                문서 권한 관리
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Add Permission Button */}
          {!showAddForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 권한 추가
              </button>
            </div>
          )}

          {/* Add Permission Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">새 권한 추가</h3>
              
              {/* Permission Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    권한 유형
                  </label>
                  <select
                    value={formData.permission_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      permission_type: e.target.value as PermissionFormData['permission_type']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="role_based">역할 기반</option>
                    <option value="user_specific">특정 사용자</option>
                    <option value="site_specific">특정 현장</option>
                    <option value="organization_specific">특정 조직</option>
                  </select>
                </div>

                {/* Target Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.permission_type === 'role_based' && '역할'}
                    {formData.permission_type === 'user_specific' && '사용자'}
                    {formData.permission_type === 'site_specific' && '현장'}
                    {formData.permission_type === 'organization_specific' && '조직'}
                  </label>
                  
                  {formData.permission_type === 'role_based' && (
                    <select
                      value={formData.target_role || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">역할 선택</option>
                      {roleOptions.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {formData.permission_type === 'user_specific' && (
                    <select
                      value={formData.target_user_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_user_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">사용자 선택</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {roleOptions.find(r => r.value === user.role)?.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {formData.permission_type === 'site_specific' && (
                    <select
                      value={formData.target_site_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_site_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">현장 선택</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.name} {site.address && `(${site.address})`}
                        </option>
                      ))}
                    </select>
                  )}

                  {formData.permission_type === 'organization_specific' && (
                    <select
                      value={formData.target_organization_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_organization_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">조직 선택</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  권한 설정
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { key: 'can_view', label: '조회', icon: Eye, color: 'blue' },
                    { key: 'can_edit', label: '편집', icon: Edit, color: 'yellow' },
                    { key: 'can_delete', label: '삭제', icon: Trash2, color: 'red' },
                    { key: 'can_share', label: '공유', icon: Share2, color: 'green' },
                    { key: 'can_download', label: '다운로드', icon: Download, color: 'purple' }
                  ].map(({ key, label, icon: Icon, color }) => (
                    <label
                      key={key}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData[key as keyof PermissionFormData]
                          ? `border-${color}-300 bg-${color}-50 dark:bg-${color}-900/20`
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData[key as keyof PermissionFormData] as boolean}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          [key]: e.target.checked 
                        }))}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-2 ${
                        formData[key as keyof PermissionFormData] 
                          ? `text-${color}-600` 
                          : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                      </span>
                      {formData[key as keyof PermissionFormData] && (
                        <Check className={`absolute top-1 right-1 h-3 w-3 text-${color}-600`} />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  만료일 (선택사항)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="datetime-local"
                    value={formData.expires_at || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddPermission}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      권한 추가
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Permissions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">현재 권한 목록</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  설정된 권한이 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  문서를 다른 사용자와 공유하려면 권한을 추가하세요
                </p>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    첫 권한 추가
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getPermissionIcon(permission)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getPermissionDisplayName(permission)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.permission_type === 'role_based' && '역할 기반 권한'}
                          {permission.permission_type === 'user_specific' && '사용자별 권한'}
                          {permission.permission_type === 'site_specific' && '현장별 권한'}
                          {permission.permission_type === 'organization_specific' && '조직별 권한'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Permission Badges */}
                      <div className="flex items-center space-x-1">
                        {permission.can_view && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Eye className="h-3 w-3 mr-1" />
                            조회
                          </span>
                        )}
                        {permission.can_edit && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <Edit className="h-3 w-3 mr-1" />
                            편집
                          </span>
                        )}
                        {permission.can_download && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            <Download className="h-3 w-3 mr-1" />
                            다운로드
                          </span>
                        )}
                        {permission.can_share && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Share2 className="h-3 w-3 mr-1" />
                            공유
                          </span>
                        )}
                        {permission.can_delete && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                          </span>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePermission(permission.id)}
                        disabled={saving}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        title="권한 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}