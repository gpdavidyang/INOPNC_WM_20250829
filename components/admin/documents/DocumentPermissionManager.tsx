'use client'

import { useState, useEffect } from 'react'
import { DocumentWithPermissions, Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { X, User, Users, Building2, Share2, Lock, Unlock, Check, AlertCircle } from 'lucide-react'

interface DocumentPermissionManagerProps {
  document: DocumentWithPermissions
  profile: Profile
  onClose: () => void
  onSuccess: () => void
}

interface PermissionEntry {
  id?: string
  user_id?: string
  role?: string
  site_id?: string
  partner_company_id?: string
  permission_level: 'view' | 'download' | 'edit' | 'admin'
  user_name?: string
  site_name?: string
  partner_name?: string
}

export default function DocumentPermissionManager({
  document,
  profile,
  onClose,
  onSuccess
}: DocumentPermissionManagerProps) {
  const [permissions, setPermissions] = useState<PermissionEntry[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, email: string}>>([])
  const [availableSites, setAvailableSites] = useState<Array<{id: string, name: string}>>([])
  const [availablePartners, setAvailablePartners] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // New permission form
  const [newPermission, setNewPermission] = useState<Partial<PermissionEntry>>({
    permission_level: 'view'
  })
  const [permissionType, setPermissionType] = useState<'user' | 'role' | 'site' | 'partner'>('user')

  const supabase = createClient()

  useEffect(() => {
    loadPermissions()
    loadAvailableOptions()
  }, [])

  const loadPermissions = async () => {
    try {
      // For now, show basic permission info since document_access_control table doesn't exist
      // Based on current document schema
      const basicPermissions: PermissionEntry[] = []
      
      // Add owner permission
      if (document.owner_id && (document as any).profiles) {
        basicPermissions.push({
          id: 'owner',
          user_id: document.owner_id,
          permission_level: 'admin',
          user_name: (document as any).profiles?.name || '문서 소유자'
        })
      }
      
      // Add site-wide permission if public
      if ((document as any).is_public && document.site_id && (document as any).sites) {
        basicPermissions.push({
          id: 'site-public',
          site_id: document.site_id,
          permission_level: 'view',
          site_name: (document as any).sites?.name || '현장 전체'
        })
      }

      setPermissions(basicPermissions)
    } catch (error) {
      console.error('Failed to load permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableOptions = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .neq('id', profile.id)
        .limit(50)

      setAvailableUsers(usersData || [])

      // Load sites
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .limit(20)

      setAvailableSites(sitesData || [])

      // Load partner companies
      const { data: partnersData } = await supabase
        .from('partner_companies')
        .select('id, name')
        .eq('is_active', true)
        .limit(20)

      setAvailablePartners(partnersData || [])

    } catch (error) {
      console.error('Failed to load options:', error)
    }
  }

  const addPermission = async () => {
    if (!newPermission.permission_level) return

    setSaving(true)
    try {
      // For now, show placeholder since document_access_control table doesn't exist
      alert('권한 추가 기능은 데이터베이스 마이그레이션 완료 후 사용 가능합니다.')
      
      // TODO: Implement when document_access_control table is created
      // const permissionData = {
      //   document_id: document.id,
      //   user_id: permissionType === 'user' ? newPermission.user_id : null,
      //   role: permissionType === 'role' ? newPermission.role : null,
      //   site_id: permissionType === 'site' ? newPermission.site_id : null,
      //   partner_company_id: permissionType === 'partner' ? newPermission.partner_company_id : null,
      //   permission_level: newPermission.permission_level,
      //   granted_by: profile.id,
      //   granted_at: new Date().toISOString(),
      //   is_active: true
      // }

      // const { error } = await supabase
      //   .from('document_access_control')
      //   .insert([permissionData])

      // if (error) throw error

      await loadPermissions()
      setNewPermission({ permission_level: 'view' })
      setPermissionType('user')

    } catch (error) {
      console.error('Failed to add permission:', error)
      alert('권한 추가에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const removePermission = async (permissionId: string) => {
    if (!confirm('이 권한을 제거하시겠습니까?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('document_access_control')
        .update({ is_active: false })
        .eq('id', permissionId)

      if (error) throw error

      await loadPermissions()
    } catch (error) {
      console.error('Failed to remove permission:', error)
      alert('권한 제거에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'view': return <Lock className="h-4 w-4 text-gray-500" />
      case 'download': return <Unlock className="h-4 w-4 text-blue-500" />
      case 'edit': return <Share2 className="h-4 w-4 text-orange-500" />
      case 'admin': return <Check className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPermissionLabel = (level: string) => {
    const labels: Record<string, string> = {
      view: '보기',
      download: '다운로드',
      edit: '편집',
      admin: '관리'
    }
    return labels[level] || level
  }

  const getPermissionDescription = (permission: PermissionEntry) => {
    if (permission.user_name) {
      return `${permission.user_name} (개인)`
    }
    if (permission.role) {
      const roleLabels: Record<string, string> = {
        worker: '작업자',
        site_manager: '현장관리자',
        customer_manager: '고객관리자',
        admin: '관리자',
        system_admin: '시스템관리자'
      }
      return `${roleLabels[permission.role] || permission.role} (역할)`
    }
    if (permission.site_name) {
      return `${permission.site_name} (현장)`
    }
    if (permission.partner_name) {
      return `${permission.partner_name} (파트너)`
    }
    return '알 수 없음'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              문서 권한 관리
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {document.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Current Permissions */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              현재 권한 설정
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 h-12 rounded-lg"></div>
                ))}
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                설정된 권한이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getPermissionIcon(permission.permission_level)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getPermissionDescription(permission)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          권한: {getPermissionLabel(permission.permission_level)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removePermission(permission.id!)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      제거
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Permission */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              새 권한 추가
            </h3>
            
            {/* Permission Type Selection */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { key: 'user', label: '개인', icon: User },
                { key: 'role', label: '역할', icon: Users },
                { key: 'site', label: '현장', icon: Building2 },
                { key: 'partner', label: '파트너', icon: Share2 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setPermissionType(key as any)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    permissionType === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>

            {/* Target Selection */}
            <div className="mb-4">
              {permissionType === 'user' && (
                <select
                  value={newPermission.user_id || ''}
                  onChange={(e) => setNewPermission({ ...newPermission, user_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">사용자 선택</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}

              {permissionType === 'role' && (
                <select
                  value={newPermission.role || ''}
                  onChange={(e) => setNewPermission({ ...newPermission, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">역할 선택</option>
                  <option value="worker">작업자</option>
                  <option value="site_manager">현장관리자</option>
                  <option value="customer_manager">고객관리자</option>
                  <option value="admin">관리자</option>
                </select>
              )}

              {permissionType === 'site' && (
                <select
                  value={newPermission.site_id || ''}
                  onChange={(e) => setNewPermission({ ...newPermission, site_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">현장 선택</option>
                  {availableSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              )}

              {permissionType === 'partner' && (
                <select
                  value={newPermission.partner_company_id || ''}
                  onChange={(e) => setNewPermission({ ...newPermission, partner_company_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">파트너 선택</option>
                  {availablePartners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Permission Level Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                권한 수준
              </label>
              <select
                value={newPermission.permission_level}
                onChange={(e) => setNewPermission({ ...newPermission, permission_level: e.target.value as any })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="view">보기만</option>
                <option value="download">다운로드 가능</option>
                <option value="edit">편집 가능</option>
                <option value="admin">관리 권한</option>
              </select>
            </div>

            <button
              onClick={addPermission}
              disabled={saving || !canAddPermission()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {saving ? '추가 중...' : '권한 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  function canAddPermission(): boolean {
    if (!newPermission.permission_level) return false
    
    switch (permissionType) {
      case 'user': return !!newPermission.user_id
      case 'role': return !!newPermission.role
      case 'site': return !!newPermission.site_id
      case 'partner': return !!newPermission.partner_company_id
      default: return false
    }
  }
}