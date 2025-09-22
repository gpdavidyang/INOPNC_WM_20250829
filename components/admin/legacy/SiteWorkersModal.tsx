'use client'

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
import type { UserWithSites } from '@/app/actions/admin/users'
import type { Site, UserRole } from '@/types'

interface SiteAssignment {
  id: string
  site_id: string
  user_id: string
  role: string
  assigned_date: string
  is_active: boolean
  profile: {
    id: string
    full_name: string
    email: string
    phone?: string
    role: UserRole
    status: string
  }
}

interface SiteWorkersModalProps {
  isOpen: boolean
  onClose: () => void
  site: Site | null
}

export default function SiteWorkersModal({
  isOpen,
  onClose,
  site
}: SiteWorkersModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('workers')
  const [assignments, setAssignments] = useState<SiteAssignment[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserWithSites[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'worker' | 'site_manager' | 'supervisor'>('worker')
  const [error, setError] = useState<string | null>(null)

  // Load site assignments when modal opens
  useEffect(() => {
    if (isOpen && site?.id) {
      loadSiteAssignments()
      loadAvailableUsers()
    }
  }, [isOpen, site?.id])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('workers')
      setAssignments([])
      setAvailableUsers([])
      setSearchTerm('')
      setSelectedUserId('')
      setSelectedRole('worker')
      setError(null)
    }
  }, [isOpen])

  const loadSiteAssignments = async () => {
    if (!site?.id) return

    setLoading(true)
    try {
      const result = await getSiteAssignments(site.id)
      if (result.success && result.data) {
        setAssignments(result.data)
      } else {
        setError(result.error || '배정 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('배정 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const result = await getUsers(1, 100) // Get first 100 users for assignment
      if (result.success && result.data) {
        // Filter out users who are already assigned to this site
        const unassignedUsers = result.data.users.filter(user => 
          !assignments.some(assignment => assignment.user_id === user.id && assignment.is_active)
        )
        setAvailableUsers(unassignedUsers)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleAssignUser = async () => {
    if (!site?.id || !selectedUserId || !selectedRole) return

    setAssigning(true)
    try {
      const result = await assignUserToSite({
        site_id: site.id,
        user_id: selectedUserId,
        role: selectedRole
      })

      if (result.success) {
        // Reload assignments
        await loadSiteAssignments()
        await loadAvailableUsers()
        
        // Reset form
        setSelectedUserId('')
        setSelectedRole('worker')
        setError(null)
        
        // Show success message (you might want to add toast notification here)
      } else {
        setError(result.error || '사용자 배정에 실패했습니다.')
      }
    } catch (error) {
      setError('사용자 배정 중 오류가 발생했습니다.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!site?.id) return

    try {
      const result = await removeUserFromSite(site.id, userId)
      
      if (result.success) {
        // Reload assignments
        await loadSiteAssignments()
        await loadAvailableUsers()
        setError(null)
      } else {
        setError(result.error || '사용자 해제에 실패했습니다.')
      }
    } catch (error) {
      setError('사용자 해제 중 오류가 발생했습니다.')
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

  const filteredUsers = availableUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!site) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] w-[95vw] sm:w-[90vw] lg:w-[80vw] xl:max-w-4xl overflow-hidden fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {site.name} - 작업자 관리
          </DialogTitle>
          <DialogDescription>
            현장에 배정된 작업자를 관리하고 새로운 작업자를 배정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Site Info Card */}
          <Card className="mx-6 mb-4 flex-shrink-0">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {site.address}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {site.manager_name && (
                      <span>관리자: {site.manager_name}</span>
                    )}
                    {site.construction_manager_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {site.construction_manager_phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline">
                  배정된 인원: {assignments.filter(a => a.is_active).length}명
                </Badge>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mx-6 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 mb-4 flex-shrink-0">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-hidden px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="workers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  배정된 작업자 ({assignments.filter(a => a.is_active).length})
                </TabsTrigger>
                <TabsTrigger value="assign" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  작업자 배정
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workers" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">배정 정보를 불러오는 중...</div>
              </div>
            ) : assignments.filter(a => a.is_active).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>배정된 작업자가 없습니다.</p>
                <p className="text-sm">작업자 배정 탭에서 새로운 작업자를 추가해보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.filter(a => a.is_active).map((assignment) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {assignment.profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.profile.full_name}</h4>
                            <Badge className={getRoleBadgeColor(assignment.role)}>
                              {getRoleText(assignment.role)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {assignment.profile.email}
                            </div>
                            {assignment.profile.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {assignment.profile.phone}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(assignment.user_id)}
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

              <TabsContent value="assign" className="flex-1 overflow-auto mt-4 space-y-4">
            {/* Assignment Form */}
            <Card className="p-4 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>사용자 선택</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="사용자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.full_name}</span>
                            <span className="text-muted-foreground">({user.email})</span>
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

                <Button 
                  onClick={handleAssignUser} 
                  disabled={!selectedUserId || assigning}
                  className="w-full md:w-auto"
                >
                  {assigning ? (
                    <>배정 중...</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      배정하기
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Available Users List */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>배정 가능한 사용자가 없습니다.</p>
                  {searchTerm && <p className="text-sm">검색어를 다시 확인해보세요.</p>}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{user.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getRoleText(user.role)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                            {user.phone && ` • ${user.phone}`}
                          </div>
                          {user.organization && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user.organization.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id)
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}