'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserPlus, 
  UserMinus,
  MapPin, 
  Search, 
  Filter,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { AssignmentExplanationTooltip } from './AssignmentTooltip'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  phone?: string
  partner_company?: {
    id: string
    company_name: string
  }
}

interface Site {
  id: string
  name: string
  address: string
  status: string
  manager_name?: string
}

interface Assignment {
  id: string
  user_id: string
  site_id: string
  assignment_type: string
  role: string
  assigned_date: string
  unassigned_date?: string
  is_active: boolean
  notes?: string
  user: User
  site: Site
}

interface UserAssignmentMatrixProps {
  onUpdate?: () => void
}

export default function UserAssignmentMatrix({ onUpdate }: UserAssignmentMatrixProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Form state
  const [assignmentData, setAssignmentData] = useState({
    user_id: '',
    site_id: '',
    assignment_type: 'permanent' as const,
    role: 'worker' as const,
    notes: ''
  })

  const [bulkAssignmentData, setBulkAssignmentData] = useState({
    site_id: '',
    assignment_type: 'permanent' as const,
    role: 'worker' as const,
    partner_company_id: '',
    notes: ''
  })

  useEffect(() => {
    loadAssignments()
    loadUsers()
    loadSites()
  }, [statusFilter])

  const loadAssignments = async () => {
    try {
      const response = await fetch(`/api/admin/assignment/user-assignments?status=${statusFilter}`)
      const result = await response.json()
      
      if (result.success) {
        setAssignments(result.data)
      } else {
        toast.error('사용자 배정 정보를 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('Failed to load assignments:', error)
      toast.error('배정 데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1000')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadSites = async () => {
    try {
      const response = await fetch('/api/admin/sites?status=active&limit=1000')
      const result = await response.json()
      
      if (result.success) {
        setSites(result.data.sites || result.data)
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const handleAssignUser = async () => {
    try {
      const response = await fetch('/api/admin/assignment/user-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadAssignments()
        setShowAssignModal(false)
        resetAssignmentForm()
        toast.success('사용자가 현장에 배정되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '사용자 배정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to assign user:', error)
      toast.error('배정 처리 중 오류가 발생했습니다')
    }
  }

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0) {
      toast.error('배정할 사용자를 선택해주세요')
      return
    }

    try {
      const assignments = selectedUsers.map(user_id => ({
        user_id,
        site_id: bulkAssignmentData.site_id,
        assignment_type: bulkAssignmentData.assignment_type,
        role: bulkAssignmentData.role,
        notes: bulkAssignmentData.notes
      }))

      const response = await fetch('/api/admin/assignment/user-assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadAssignments()
        setShowBulkAssignModal(false)
        setBulkAssignmentData({
          site_id: '',
          assignment_type: 'permanent',
          role: 'worker',
          partner_company_id: '',
          notes: ''
        })
        setSelectedUsers([])
        toast.success(`${selectedUsers.length}명의 사용자가 현장에 배정되었습니다`)
        onUpdate?.()
      } else {
        toast.error(result.error || '일괄 배정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to bulk assign:', error)
      toast.error('일괄 배정 처리 중 오류가 발생했습니다')
    }
  }

  const handleUnassignUser = async (assignmentId: string) => {
    if (!confirm('정말로 이 사용자의 현장 배정을 해제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/assignment/user-assignments/${assignmentId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadAssignments()
        toast.success('사용자의 현장 배정이 해제되었습니다')
        onUpdate?.()
      } else {
        toast.error(result.error || '배정 해제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to unassign user:', error)
      toast.error('배정 해제 처리 중 오류가 발생했습니다')
    }
  }

  const resetAssignmentForm = () => {
    setAssignmentData({
      user_id: '',
      site_id: '',
      assignment_type: 'permanent',
      role: 'worker',
      notes: ''
    })
  }

  const getUnassignedUsers = () => {
    const assignedUserIds = assignments
      .filter(a => a.is_active)
      .map(a => a.user_id)
    
    return users.filter(user => !assignedUserIds.includes(user.id))
  }

  const filteredAssignments = assignments.filter(assignment => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      assignment.user.full_name.toLowerCase().includes(searchLower) ||
      assignment.user.email.toLowerCase().includes(searchLower) ||
      assignment.site.name.toLowerCase().includes(searchLower) ||
      assignment.site.address.toLowerCase().includes(searchLower)
    
    const matchesRole = !roleFilter || assignment.user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const filteredUnassignedUsers = getUnassignedUsers().filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesPartner = !bulkAssignmentData.partner_company_id || 
      user.partner_company?.id === bulkAssignmentData.partner_company_id
    
    return matchesSearch && matchesRole && matchesPartner
  })

  const partnersWithUsers = Array.from(new Set(
    users
      .filter(u => u.partner_company)
      .map(u => u.partner_company!.id)
  )).map(id => {
    const user = users.find(u => u.partner_company?.id === id)
    return user?.partner_company!
  }).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            사용자 현장 배정 관리
            <AssignmentExplanationTooltip />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            개별 사용자를 특정 현장에 배정하거나 일괄 배정을 관리할 수 있습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            개별 배정
          </Button>
          <Button onClick={() => setShowBulkAssignModal(true)} variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            일괄 배정
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="사용자명, 이메일, 현장명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="모든 역할" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">모든 역할</SelectItem>
            <SelectItem value="worker">작업자</SelectItem>
            <SelectItem value="site_manager">현장관리자</SelectItem>
            <SelectItem value="customer_manager">파트너사</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">활성 배정</SelectItem>
            <SelectItem value="inactive">비활성 배정</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            배정된 사용자 ({filteredAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            미배정 사용자 ({getUnassignedUsers().length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  배정된 사용자가 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  사용자를 현장에 배정하여 작업 관리를 시작하세요
                </p>
                <Button onClick={() => setShowAssignModal(true)}>
                  첫 배정 추가하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className={`transition-all ${
                  assignment.is_active 
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 opacity-75'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {assignment.user.full_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {assignment.role === 'worker' ? '작업자' : 
                             assignment.role === 'site_manager' ? '현장관리자' : '감독자'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {assignment.user.email}
                        </p>
                        {assignment.user.partner_company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            소속: {assignment.user.partner_company.company_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {assignment.site.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.site.address}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {assignment.assignment_type === 'permanent' ? '정규' :
                           assignment.assignment_type === 'temporary' ? '임시' : '대체'}
                        </Badge>
                      </div>
                      {assignment.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                          {assignment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignUser(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-200"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        배정 해제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnassignedUsers.map((user) => (
              <Card key={user.id} className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {user.full_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'worker' ? '작업자' : 
                           user.role === 'site_manager' ? '현장관리자' : 
                           user.role === 'customer_manager' ? '파트너사' : user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {user.phone}
                        </p>
                      )}
                      {user.partner_company && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          소속: {user.partner_company.company_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">미배정</Badge>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAssignmentData(prev => ({ ...prev, user_id: user.id }))
                        setShowAssignModal(true)
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      배정하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUnassignedUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  모든 사용자가 배정되었습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  현재 조건에 맞는 미배정 사용자가 없습니다
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Individual Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>사용자 현장 배정</DialogTitle>
            <DialogDescription>
              개별 사용자를 특정 현장에 배정합니다
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>사용자</Label>
              <Select
                value={assignmentData.user_id}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="사용자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {getUnassignedUsers().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>현장</Label>
              <Select
                value={assignmentData.site_id}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, site_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="현장을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} - {site.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>배정 유형</Label>
                <Select
                  value={assignmentData.assignment_type}
                  onValueChange={(value: any) => setAssignmentData(prev => ({ ...prev, assignment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">정규</SelectItem>
                    <SelectItem value="temporary">임시</SelectItem>
                    <SelectItem value="substitute">대체</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>현장 역할</Label>
                <Select
                  value={assignmentData.role}
                  onValueChange={(value: any) => setAssignmentData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">작업자</SelectItem>
                    <SelectItem value="supervisor">감독자</SelectItem>
                    <SelectItem value="site_manager">현장관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>메모 (선택)</Label>
              <Input
                placeholder="배정 관련 메모"
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignModal(false)
              resetAssignmentForm()
            }}>
              취소
            </Button>
            <Button onClick={handleAssignUser}>
              배정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>일괄 현장 배정</DialogTitle>
            <DialogDescription>
              여러 사용자를 한번에 현장에 배정할 수 있습니다
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>현장</Label>
                <Select
                  value={bulkAssignmentData.site_id}
                  onValueChange={(value) => setBulkAssignmentData(prev => ({ ...prev, site_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="현장을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>파트너사 필터 (선택)</Label>
                <Select
                  value={bulkAssignmentData.partner_company_id}
                  onValueChange={(value) => setBulkAssignmentData(prev => ({ ...prev, partner_company_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="모든 파트너사" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">모든 파트너사</SelectItem>
                    {partnersWithUsers.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>배정 유형</Label>
                <Select
                  value={bulkAssignmentData.assignment_type}
                  onValueChange={(value: any) => setBulkAssignmentData(prev => ({ ...prev, assignment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">정규</SelectItem>
                    <SelectItem value="temporary">임시</SelectItem>
                    <SelectItem value="substitute">대체</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>현장 역할</Label>
                <Select
                  value={bulkAssignmentData.role}
                  onValueChange={(value: any) => setBulkAssignmentData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">작업자</SelectItem>
                    <SelectItem value="supervisor">감독자</SelectItem>
                    <SelectItem value="site_manager">현장관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>사용자 선택</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-2">
                {filteredUnassignedUsers.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id])
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                      {user.partner_company && (
                        <div className="text-xs text-gray-400">
                          소속: {user.partner_company.company_name}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
                
                {filteredUnassignedUsers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    배정 가능한 사용자가 없습니다
                  </div>
                )}
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary">
                    {selectedUsers.length}명 선택됨
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label>메모 (선택)</Label>
              <Input
                placeholder="일괄 배정 관련 메모"
                value={bulkAssignmentData.notes}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkAssignModal(false)
              setBulkAssignmentData({
                site_id: '',
                assignment_type: 'permanent',
                role: 'worker',
                partner_company_id: '',
                notes: ''
              })
              setSelectedUsers([])
            }}>
              취소
            </Button>
            <Button onClick={handleBulkAssign} disabled={selectedUsers.length === 0}>
              {selectedUsers.length}명 배정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}