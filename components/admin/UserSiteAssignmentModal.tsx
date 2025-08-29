'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  MapPin,
  UserPlus, 
  UserMinus, 
  Search, 
  Calendar,
  FileText,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { UserWithSites, Site } from '@/types'

interface UserSiteAssignment {
  site_id: string
  site_name: string
  site_address: string
  site_status: string
  site_role: string
  assignment_type: string
  assigned_date: string
  unassigned_date?: string
  is_active: boolean
  assignment_notes?: string
  assignment_duration_days: number
}

interface UserSiteAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithSites | null
}

export default function UserSiteAssignmentModal({
  isOpen,
  onClose,
  user
}: UserSiteAssignmentModalProps) {
  const [activeTab, setActiveTab] = useState('sites')
  const [assignments, setAssignments] = useState<UserSiteAssignment[]>([])
  const [availableSites, setAvailableSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'worker' | 'site_manager' | 'supervisor'>('worker')
  const [assignmentType, setAssignmentType] = useState<'permanent' | 'temporary' | 'substitute'>('permanent')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load user site assignments when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserSites()
      loadAvailableSites()
    }
  }, [isOpen, user?.id])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('sites')
      setAssignments([])
      setAvailableSites([])
      setSearchTerm('')
      setSelectedSiteId('')
      setSelectedRole('worker')
      setAssignmentType('permanent')
      setNotes('')
      setError(null)
    }
  }, [isOpen])

  const loadUserSites = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/sites?activeOnly=true`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setAssignments(result.data)
      } else {
        setError(result.error || '현장 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('현장 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSites = async () => {
    if (!user?.id) return

    try {
      // Get list of all active sites that user is not assigned to
      const response = await fetch(`/api/sites?status=active&excludeUser=${user.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Filter out sites where user is already assigned
        const assignedSiteIds = assignments.map(a => a.site_id)
        const unassignedSites = result.data.filter((site: Site) => 
          !assignedSiteIds.includes(site.id)
        )
        setAvailableSites(unassignedSites)
      }
    } catch (error) {
      console.error('Error loading available sites:', error)
    }
  }

  const handleAssignSite = async () => {
    if (!user?.id || !selectedSiteId || !selectedRole) return

    setAssigning(true)
    try {
      const response = await fetch(`/api/users/${user.id}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          role: selectedRole,
          assignmentType: assignmentType,
          notes: notes || null
        })
      })

      const result = await response.json()

      if (result.success) {
        // Reload assignments
        await loadUserSites()
        await loadAvailableSites()
        
        // Reset form
        setSelectedSiteId('')
        setSelectedRole('worker')
        setAssignmentType('permanent')
        setNotes('')
        setError(null)
      } else {
        setError(result.error || '현장 배정에 실패했습니다.')
      }
    } catch (error) {
      setError('현장 배정 중 오류가 발생했습니다.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveSite = async (siteId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/users/${user.id}/sites?siteId=${siteId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Reload assignments
        await loadUserSites()
        await loadAvailableSites()
        setError(null)
      } else {
        setError(result.error || '현장 해제에 실패했습니다.')
      }
    } catch (error) {
      setError('현장 해제 중 오류가 발생했습니다.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_manager': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'supervisor': return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'worker': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'site_manager': return '현장관리자'
      case 'supervisor': return '감독자'
      case 'worker': return '작업자'
      default: return role
    }
  }

  const getAssignmentTypeText = (type: string) => {
    switch (type) {
      case 'permanent': return '정규'
      case 'temporary': return '임시'
      case 'substitute': return '대체'
      default: return type
    }
  }

  const getAssignmentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-green-100 text-green-800'
      case 'temporary': return 'bg-yellow-100 text-yellow-800'
      case 'substitute': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSites = availableSites.filter(site =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {user.full_name} - 현장 배정 관리
          </DialogTitle>
          <DialogDescription>
            사용자에게 배정된 현장을 관리하고 새로운 현장을 배정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* User Info Card */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.full_name}</span>
                  <Badge variant="outline">
                    {getRoleText(user.role)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {user.phone}
                    </div>
                  )}
                </div>
                {user.organization && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {user.organization.name}
                  </div>
                )}
              </div>
              <Badge variant="outline">
                배정된 현장: {assignments.filter(a => a.is_active).length}개
              </Badge>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 mb-4">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              배정된 현장 ({assignments.filter(a => a.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              현장 배정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sites" className="overflow-auto max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">현장 정보를 불러오는 중...</div>
              </div>
            ) : assignments.filter(a => a.is_active).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>배정된 현장이 없습니다.</p>
                <p className="text-sm">현장 배정 탭에서 새로운 현장을 추가해보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.filter(a => a.is_active).map((assignment, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assignment.site_name}</h4>
                          <Badge className={getRoleBadgeColor(assignment.site_role)}>
                            {getRoleText(assignment.site_role)}
                          </Badge>
                          <Badge className={getAssignmentTypeBadgeColor(assignment.assignment_type)}>
                            {getAssignmentTypeText(assignment.assignment_type)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {assignment.site_address}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="flex items-center gap-1">
                              기간: {assignment.assignment_duration_days}일
                            </div>
                          </div>
                          {assignment.assignment_notes && (
                            <div className="flex items-start gap-1">
                              <FileText className="h-3 w-3 mt-0.5" />
                              <span className="text-xs">{assignment.assignment_notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSite(assignment.site_id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-200"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        배정 해제
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assign" className="space-y-4 overflow-auto max-h-[400px]">
            {/* Assignment Form */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>현장 선택</Label>
                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="현장을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            <div className="flex flex-col">
                              <span>{site.name}</span>
                              <span className="text-xs text-muted-foreground">{site.address}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>역할</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole as any}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>배정 유형</Label>
                    <Select value={assignmentType} onValueChange={setAssignmentType as any}>
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

                  <div className="space-y-2">
                    <Label>메모 (선택사항)</Label>
                    <Input
                      placeholder="배정 관련 특이사항"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAssignSite} 
                  disabled={!selectedSiteId || assigning}
                  className="w-full"
                >
                  {assigning ? (
                    <>배정 중...</>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      현장 배정하기
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="현장명 또는 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Available Sites List */}
            <div className="space-y-2">
              {filteredSites.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>배정 가능한 현장이 없습니다.</p>
                  {searchTerm && <p className="text-sm">검색어를 다시 확인해보세요.</p>}
                </div>
              ) : (
                filteredSites.map((site) => (
                  <Card key={site.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{site.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {site.status === 'active' ? '진행중' : '완료'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {site.address}
                          </div>
                          {site.manager_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3" />
                              관리자: {site.manager_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSiteId(site.id)
                          setActiveTab('assign')
                        }}
                        className="text-xs"
                      >
                        선택
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}