'use client'

import React, { useState, useEffect, DragEvent } from 'react'

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

interface UserAssignmentMatrixDnDProps {
  onUpdate?: () => void
}

export default function UserAssignmentMatrixDnD({ onUpdate }: UserAssignmentMatrixDnDProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [draggedUser, setDraggedUser] = useState<User | null>(null)
  const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null)
  const [dragOverSite, setDragOverSite] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form state
  const [assignmentData, setAssignmentData] = useState({
    user_id: '',
    site_id: '',
    assignment_type: 'permanent' as const,
    role: 'worker' as const,
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

  // Drag and Drop Handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, user: User | null, assignment: Assignment | null) => {
    e.dataTransfer.effectAllowed = 'move'
    if (user) {
      setDraggedUser(user)
      e.dataTransfer.setData('type', 'user')
      e.dataTransfer.setData('userId', user.id)
    } else if (assignment) {
      setDraggedAssignment(assignment)
      e.dataTransfer.setData('type', 'assignment')
      e.dataTransfer.setData('assignmentId', assignment.id)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, siteId: string) => {
    e.preventDefault()
    setDragOverSite(siteId)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Only clear if we're leaving the drop zone entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !relatedTarget.closest('.drop-zone')) {
      setDragOverSite(null)
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetSiteId: string) => {
    e.preventDefault()
    setDragOverSite(null)
    
    const type = e.dataTransfer.getData('type')
    
    if (isProcessing) {
      toast.warning('이전 작업이 진행 중입니다. 잠시 기다려주세요.')
      return
    }

    setIsProcessing(true)

    try {
      if (type === 'user' && draggedUser) {
        // Assign unassigned user to site
        await assignUserToSite(draggedUser.id, targetSiteId)
      } else if (type === 'assignment' && draggedAssignment) {
        // Move assigned user to different site
        if (draggedAssignment.site_id !== targetSiteId) {
          await moveUserToSite(draggedAssignment, targetSiteId)
        }
      }
    } finally {
      setIsProcessing(false)
      setDraggedUser(null)
      setDraggedAssignment(null)
    }
  }

  const assignUserToSite = async (userId: string, siteId: string) => {
    try {
      const response = await fetch('/api/admin/assignment/user-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          site_id: siteId,
          assignment_type: 'permanent',
          role: 'worker',
          notes: '드래그 앤 드롭으로 배정됨'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadAssignments()
        const user = users.find(u => u.id === userId)
        const site = sites.find(s => s.id === siteId)
        toast.success(`${user?.full_name}님이 ${site?.name}에 배정되었습니다`)
        onUpdate?.()
      } else {
        toast.error(result.error || '사용자 배정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to assign user:', error)
      toast.error('배정 처리 중 오류가 발생했습니다')
    }
  }

  const moveUserToSite = async (assignment: Assignment, newSiteId: string) => {
    try {
      // First unassign from current site
      await fetch(`/api/admin/assignment/user-assignments/${assignment.id}`, {
        method: 'DELETE'
      })
      
      // Then assign to new site
      const response = await fetch('/api/admin/assignment/user-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: assignment.user_id,
          site_id: newSiteId,
          assignment_type: assignment.assignment_type,
          role: assignment.role,
          notes: `${assignment.site.name}에서 이동됨 (드래그 앤 드롭)`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadAssignments()
        const newSite = sites.find(s => s.id === newSiteId)
        toast.success(`${assignment.user.full_name}님이 ${newSite?.name}으로 이동되었습니다`)
        onUpdate?.()
      } else {
        toast.error(result.error || '사용자 이동에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to move user:', error)
      toast.error('이동 처리 중 오류가 발생했습니다')
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

  const getUnassignedUsers = () => {
    const assignedUserIds = assignments
      .filter(a => a.is_active)
      .map(a => a.user_id)
    
    return users.filter(user => !assignedUserIds.includes(user.id))
  }

  const getAssignmentsBySite = (siteId: string) => {
    return assignments.filter(a => a.site_id === siteId && a.is_active)
  }

  const filteredUnassignedUsers = getUnassignedUsers().filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MoveRight className="h-6 w-6" />
            드래그 앤 드롭 배정 관리
            <AssignmentExplanationTooltip />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            사용자를 드래그하여 현장에 배정하거나 현장 간 이동할 수 있습니다
          </p>
        </div>
        <Button onClick={() => loadAssignments()} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="사용자명, 이메일로 검색..."
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
            <SelectItem value="all">모든 역할</SelectItem>
            <SelectItem value="worker">작업자</SelectItem>
            <SelectItem value="site_manager">현장관리자</SelectItem>
            <SelectItem value="customer_manager">파트너사</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Users Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              미배정 사용자
            </CardTitle>
            <CardDescription>
              드래그하여 현장에 배정하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUnassignedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>모든 사용자가 배정됨</p>
              </div>
            ) : (
              filteredUnassignedUsers.map((user) => (
                <div
                  key={user.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, user, null)}
                  className={cn(
                    "p-3 bg-white dark:bg-gray-800 border rounded-lg cursor-move",
                    "hover:shadow-md transition-all hover:border-blue-300",
                    "flex items-center gap-2"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    {user.partner_company && (
                      <div className="text-xs text-gray-400">
                        {user.partner_company.company_name}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role === 'worker' ? '작업자' : 
                     user.role === 'site_manager' ? '관리자' : '파트너'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sites Columns (2 columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => {
            const siteAssignments = getAssignmentsBySite(site.id)
            const isDropTarget = dragOverSite === site.id
            
            return (
              <Card
                key={site.id}
                className={cn(
                  "drop-zone transition-all",
                  isDropTarget && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                )}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, site.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, site.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    {site.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {site.address}
                    <Badge variant="secondary" className="ml-2">
                      {siteAssignments.length}명
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                  {siteAssignments.length === 0 ? (
                    <div className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center",
                      isDropTarget ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300"
                    )}>
                      <UserPlus className={cn(
                        "h-8 w-8 mx-auto mb-2",
                        isDropTarget ? "text-blue-500" : "text-gray-400"
                      )} />
                      <p className={cn(
                        "text-sm",
                        isDropTarget ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                      )}>
                        {isDropTarget ? "여기에 놓으세요" : "사용자를 드래그하여 배정"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {siteAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, null, assignment)}
                          className={cn(
                            "p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
                            "rounded cursor-move hover:shadow-md transition-all",
                            "flex items-center gap-2"
                          )}
                        >
                          <GripVertical className="h-3 w-3 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate">
                              {assignment.user.full_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {assignment.user.email}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnassignUser(assignment.id)
                            }}
                            className="h-6 w-6 p-0 hover:text-red-600"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {isDropTarget && (
                        <div className="border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            여기에 놓아 이동
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2">사용 방법</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• 미배정 사용자를 드래그하여 원하는 현장에 놓으면 자동 배정됩니다</li>
            <li>• 이미 배정된 사용자를 다른 현장으로 드래그하여 이동할 수 있습니다</li>
            <li>• 배정 해제는 사용자 카드의 X 버튼을 클릭하세요</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}