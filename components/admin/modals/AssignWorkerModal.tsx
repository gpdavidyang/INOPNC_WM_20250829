'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { Profile } from '@/types'
import { searchAvailableUsers, assignUserToSite } from '@/app/actions/admin/sites'
import { toast } from '@/hooks/use-toast'

interface AssignWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
  siteName: string
  onSuccess: () => void
}

interface AvailableUser extends Profile {
  organization_name?: string
  current_sites_count?: number
  last_assignment_date?: string
  is_available?: boolean
}

export default function AssignWorkerModal({
  isOpen,
  onClose,
  siteId,
  siteName,
  onSuccess
}: AssignWorkerModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 20

  const searchUsers = async (page = 0, append = false) => {
    if (!isOpen) return
    
    setIsSearching(true)
    try {
      const result = await searchAvailableUsers(
        siteId,
        searchTerm,
        selectedRoleFilter && selectedRoleFilter !== 'all' ? selectedRoleFilter : undefined,
        ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      )

      if (result.success && result.data) {
        const newUsers = result.data.users as AvailableUser[]
        setAvailableUsers(prev => append ? [...prev, ...newUsers] : newUsers)
        setHasMore(newUsers.length === ITEMS_PER_PAGE)
      } else {
        toast({
          title: '오류',
          description: result.error || '사용자 검색에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: '오류',
        description: '사용자 검색 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const loadMore = () => {
    if (!hasMore || isSearching) return
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    searchUsers(nextPage, true)
  }

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0)
      searchUsers(0, false)
    }
  }, [isOpen, searchTerm, selectedRoleFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isOpen) {
        setCurrentPage(0)
        searchUsers(0, false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedRoleFilter])

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleAssign = async () => {
    if (selectedUsers.size === 0 || !selectedRole) {
      toast({
        title: '입력 오류',
        description: '사용자와 역할을 선택해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsAssigning(true)
    
    try {
      const assignments = Array.from(selectedUsers).map(userId => 
        assignUserToSite({
          site_id: siteId,
          user_id: userId,
          role: selectedRole as 'worker' | 'site_manager' | 'supervisor'
        })
      )

      const results = await Promise.allSettled(assignments)
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length

      if (successful > 0) {
        toast({
          title: '성공',
          description: `${successful}명의 사용자가 현장에 배정되었습니다.`,
          variant: 'default'
        })
        onSuccess()
        onClose()
      }

      const failed = results.length - successful
      if (failed > 0) {
        toast({
          title: '부분 실패',
          description: `${failed}명의 배정에 실패했습니다.`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Assignment error:', error)
      toast({
        title: '오류',
        description: '사용자 배정 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedRole('')
    setSelectedRoleFilter('all')
    setAvailableUsers([])
    setSelectedUsers(new Set())
    setCurrentPage(0)
    onClose()
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'worker': return '작업자'
      case 'site_manager': return '현장관리자'
      case 'customer_manager': return '파트너사 담당자'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'worker': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'site_manager': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'customer_manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            현장 작업자 배정
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">{siteName}</span>에 배정할 사용자를 선택하세요.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          {/* Search and Filters */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">사용자 검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="이름 또는 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="role-filter">역할 필터</Label>
                <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 역할" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 역할</SelectItem>
                    <SelectItem value="worker">작업자</SelectItem>
                    <SelectItem value="site_manager">현장관리자</SelectItem>
                    <SelectItem value="customer_manager">파트너사 담당자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-48">
              <Label htmlFor="assign-role">배정할 역할 *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">작업자</SelectItem>
                  <SelectItem value="site_manager">현장관리자</SelectItem>
                  <SelectItem value="supervisor">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-auto">
            {isSearching && availableUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">검색 중...</span>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">배정 가능한 사용자가 없습니다.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedUsers.has(user.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => {}}
                        className="rounded border-border"
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.full_name}</h4>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {user.organization_name && (
                        <p>{user.organization_name}</p>
                      )}
                      {user.current_sites_count !== undefined && (
                        <p>현재 배정: {user.current_sites_count}개 현장</p>
                      )}
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center py-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          로딩 중...
                        </>
                      ) : (
                        '더 보기'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedUsers.size}명 선택됨
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedUsers.size === 0 || !selectedRole || isAssigning}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    배정 중...
                  </>
                ) : (
                  `${selectedUsers.size}명 배정`
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}