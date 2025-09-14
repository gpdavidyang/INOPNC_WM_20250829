'use client'


interface WorkerAssignmentManagerProps {
  site: Site
  onUpdate?: () => void
}

interface Assignment {
  id: string
  user_id: string
  site_id: string
  role: string
  assigned_date: string
  is_active: boolean
  unassigned_date?: string
  profiles: Profile
}

export default function WorkerAssignmentManager({ site, onUpdate }: WorkerAssignmentManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<Profile[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('current')
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [site.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch current assignments
      const { data: currentAssignments, error: assignError } = await supabase
        .from('site_assignments')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name,
            phone,
            role,
            organization_id,
            status
          )
        `)
        .eq('site_id', site.id)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false })

      if (assignError) throw assignError

      // Fetch all workers and site managers not currently assigned to this site
      const { data: allWorkers, error: workersError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['worker', 'site_manager'])
        .eq('status', 'active')
        .order('full_name')

      if (workersError) throw workersError

      // Filter out already assigned workers
      const assignedUserIds = new Set(currentAssignments?.map(a => a.user_id) || [])
      const available = allWorkers?.filter(w => !assignedUserIds.has(w.id)) || []

      setAssignments(currentAssignments || [])
      setAvailableWorkers(available)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignWorkers = async () => {
    if (selectedWorkers.size === 0) return

    try {
      setLoading(true)
      
      const newAssignments = Array.from(selectedWorkers).map(userId => ({
        user_id: userId,
        site_id: site.id,
        role: availableWorkers.find(w => w.id === userId)?.role || 'worker',
        assigned_date: new Date().toISOString(),
        is_active: true
      }))

      const { error } = await supabase
        .from('site_assignments')
        .insert(newAssignments)

      if (error) throw error

      // Clear selection and refresh
      setSelectedWorkers(new Set())
      await fetchData()
      onUpdate?.()
      
      // Show success message
      alert(`${selectedWorkers.size}명의 작업자가 배정되었습니다.`)
    } catch (error) {
      console.error('Error assigning workers:', error)
      alert('작업자 배정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignWorker = async (assignmentId: string, userName: string) => {
    if (!confirm(`${userName}님을 이 현장에서 해제하시겠습니까?`)) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('site_assignments')
        .update({ 
          is_active: false,
          unassigned_date: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error

      await fetchData()
      onUpdate?.()
      alert(`${userName}님이 현장에서 해제되었습니다.`)
    } catch (error) {
      console.error('Error unassigning worker:', error)
      alert('작업자 해제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkerSelection = (workerId: string) => {
    const newSelection = new Set(selectedWorkers)
    if (newSelection.has(workerId)) {
      newSelection.delete(workerId)
    } else {
      newSelection.add(workerId)
    }
    setSelectedWorkers(newSelection)
  }

  const filteredWorkers = availableWorkers.filter(worker =>
    worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'worker':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'site_manager':
        return '현장관리자'
      case 'worker':
        return '작업자'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with site info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{site.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{site.address}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              현재 배정: <strong>{assignments.length}명</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300">
              배정 가능: <strong>{availableWorkers.length}명</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs for current/available workers */}
      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            현재 배정 ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <UserPlusIcon className="h-4 w-4" />
            배정 가능 ({availableWorkers.length})
          </TabsTrigger>
        </TabsList>

        {/* Current Assignments Tab */}
        <TabsContent value="current" className="mt-4">
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  배정된 작업자가 없습니다
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  '배정 가능' 탭에서 작업자를 선택하여 배정하세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {assignment.profiles.full_name || '이름 없음'}
                          </h4>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(assignment.role)}`}>
                            {getRoleLabel(assignment.role)}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {assignment.profiles.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <EnvelopeIcon className="h-3 w-3" />
                              {assignment.profiles.email}
                            </div>
                          )}
                          {assignment.profiles.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <PhoneIcon className="h-3 w-3" />
                              {assignment.profiles.phone}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignWorker(assignment.id, assignment.profiles.full_name || '작업자')}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="현장에서 해제"
                      >
                        <UserMinusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Available Workers Tab */}
        <TabsContent value="available" className="mt-4">
          <div className="space-y-4">
            {/* Search and Action Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAssignWorkers}
                disabled={selectedWorkers.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedWorkers.size > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                }`}
              >
                <UserPlusIcon className="h-5 w-5" />
                배정하기 ({selectedWorkers.size})
              </button>
            </div>

            {/* Available Workers Grid */}
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  배정 가능한 작업자가 없습니다
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  모든 작업자가 이미 다른 현장에 배정되었거나 검색 결과가 없습니다.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => toggleWorkerSelection(worker.id)}
                    className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedWorkers.has(worker.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {worker.full_name || '이름 없음'}
                          </h4>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(worker.role)}`}>
                            {getRoleLabel(worker.role)}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {worker.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <EnvelopeIcon className="h-3 w-3" />
                              {worker.email}
                            </div>
                          )}
                          {worker.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <PhoneIcon className="h-3 w-3" />
                              {worker.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedWorkers.has(worker.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedWorkers.has(worker.id) && (
                          <CheckIcon className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}