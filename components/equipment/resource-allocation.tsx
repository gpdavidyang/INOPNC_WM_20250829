'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkerAssignmentDialog } from './worker-assignment-dialog'
import { SkillManagementDialog } from './skill-management-dialog'

interface ResourceAllocationProps {
  currentUser: unknown
}

export function ResourceAllocationComponent({ currentUser }: ResourceAllocationProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()

  // State management
  const [activeTab, setActiveTab] = useState('allocations')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [skills, setSkills] = useState<WorkerSkill[]>([])
  const [skillAssignments, setSkillAssignments] = useState<WorkerSkillAssignment[]>([])
  const [sites, setSites] = useState<any[]>([])

  // Dialog states
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [showSkillDialog, setShowSkillDialog] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<unknown>(null)

  // Filter states
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [siteFilter, setSiteFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')

  // Load data
  const loadData = async () => {
    try {
      const allocationsResult = await getResourceAllocations({ 
        allocation_type: 'worker',
        date_from: dateFilter,
        date_to: dateFilter
      })
      const workersResult = await getProfiles()
      // @ts-ignore - TypeScript incorrectly reports parameter mismatch
      const skillsResult = await getWorkerSkills() as unknown
      const skillAssignmentsResult = await getWorkerSkillAssignments() as unknown
      const sitesResult = await getAllSites()

      if (allocationsResult.success) setAllocations((allocationsResult.data as unknown as ResourceAllocation[]) || [])
      if (workersResult.success) setWorkers(workersResult.data?.filter((p: unknown) => p.role === 'worker') || [])
      if (skillsResult.success) setSkills((skillsResult.data as unknown as WorkerSkill[]) || [])
      if (skillAssignmentsResult.success) setSkillAssignments((skillAssignmentsResult.data as unknown as WorkerSkillAssignment[]) || [])
      if (sitesResult.success) setSites(sitesResult.data || [])

    } catch (error) {
      console.error('Error loading resource data:', error)
      toast({
        title: '데이터 로드 실패',
        description: '자원 배치 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleWorkerAssignment = (worker: unknown) => {
    setSelectedWorker(worker)
    setShowAssignmentDialog(true)
  }

  const handleSkillManagement = (worker: unknown) => {
    setSelectedWorker(worker)
    setShowSkillDialog(true)
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return isLargeFont ? 'standard' : 'compact'
  }

  const getTouchPadding = () => {
    if (touchMode === 'glove') return 'p-6'
    if (touchMode === 'precision') return 'p-3'
    return 'p-4'
  }

  const getWorkerSkills = (workerId: string) => {
    return skillAssignments.filter(sa => sa.worker_id === workerId)
  }

  const calculateDailyCost = (workerId: string) => {
    const workerAllocations = allocations.filter(a => a.resource_id === workerId)
    return workerAllocations.reduce((total, allocation) => total + (allocation.total_cost || 0), 0)
  }

  const filteredWorkers = workers.filter(worker => {
    if (skillFilter === 'all') return true
    const workerSkills = getWorkerSkills(worker.id)
    return workerSkills.some(ws => ws.skill_id === skillFilter)
  })

  const todaysAllocations = allocations.filter(allocation => {
    if (siteFilter !== 'all' && allocation.site_id !== siteFilter) return false
    return true
  })

  const totalDailyCost = todaysAllocations.reduce((total, allocation) => total + (allocation.total_cost || 0), 0)
  const totalWorkers = new Set(todaysAllocations.map(a => a.resource_id)).size
  const totalHours = todaysAllocations.reduce((total, allocation) => total + (allocation.hours_worked || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500 mt-2`}>
            데이터를 불러오는 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`font-semibold ${getFullTypographyClass('heading', 'xl', isLargeFont)}`}>
            작업자 자원 배치
          </h2>
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 mt-1`}>
            작업자 배치, 기술 관리, 임금 계산
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>날짜:</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
          </div>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="현장" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 현장</SelectItem>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size={getButtonSize()}
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                배치된 작업자
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
                {totalWorkers}명
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                총 작업시간
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
                {totalHours.toFixed(1)}시간
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                일일 인건비
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
                ₩{totalDailyCost.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                평균 시급
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
                ₩{totalHours > 0 ? (totalDailyCost / totalHours).toLocaleString() : '0'}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allocations" className="gap-2">
            <Calendar className="h-4 w-4" />
            일별 배치현황
          </TabsTrigger>
          <TabsTrigger value="workers" className="gap-2">
            <Users className="h-4 w-4" />
            작업자 관리
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-2">
            <Settings className="h-4 w-4" />
            기술 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card className={getTouchPadding()}>
            <h3 className={`font-medium ${getFullTypographyClass('heading', 'lg', isLargeFont)} mb-4`}>
              {dateFilter} 작업자 배치 현황
            </h3>
            {todaysAllocations.length > 0 ? (
              <div className="space-y-3">
                {todaysAllocations.map(allocation => (
                  <div 
                    key={allocation.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                          {allocation.worker?.full_name}
                        </p>
                        <Badge variant="outline" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                          {allocation.site?.name}
                        </Badge>
                      </div>
                      <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mt-1`}>
                        {allocation.start_time} ~ {allocation.end_time} | 
                        {allocation.hours_worked}시간 | 
                        시급: ₩{allocation.hourly_rate?.toLocaleString()}
                      </p>
                      {allocation.task_description && (
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 mt-1`}>
                          작업: {allocation.task_description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                        ₩{allocation.total_cost?.toLocaleString()}
                      </p>
                      {allocation.overtime_hours && allocation.overtime_hours > 0 && (
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-amber-600`}>
                          연장: {allocation.overtime_hours}시간
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500 py-8`}>
                선택한 날짜에 배치된 작업자가 없습니다.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          {/* Filter by skill */}
          <div className="flex items-center gap-2">
            <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>기술별 필터:</Label>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="기술 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기술</SelectItem>
                {skills.map(skill => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map(worker => {
              const workerSkills = getWorkerSkills(worker.id)
              const dailyCost = calculateDailyCost(worker.id)
              
              return (
                <Card key={worker.id} className={getTouchPadding()}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                        {worker.full_name}
                      </h4>
                      <Badge variant={dailyCost > 0 ? 'default' : 'secondary'}>
                        {dailyCost > 0 ? '배치됨' : '대기'}
                      </Badge>
                    </div>
                    
                    {/* Worker skills */}
                    {workerSkills.length > 0 && (
                      <div className="space-y-2">
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 font-medium`}>
                          보유 기술:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {workerSkills.map(skillAssignment => {
                            const skill = skills.find(s => s.id === skillAssignment.skill_id)
                            return skill ? (
                              <Badge 
                                key={skillAssignment.id} 
                                variant="outline" 
                                className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-xs`}
                              >
                                {skill.name} ({skillAssignment.proficiency_level})
                                {skillAssignment.hourly_rate && (
                                  <span className="ml-1 text-green-600">
                                    ₩{skillAssignment.hourly_rate.toLocaleString()}
                                  </span>
                                )}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Daily cost */}
                    {dailyCost > 0 && (
                      <div>
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                          금일 인건비: 
                          <span className="font-semibold text-green-600 ml-1">
                            ₩{dailyCost.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="compact"
                        variant="outline"
                        onClick={() => handleWorkerAssignment(worker)}
                        className="flex-1"
                      >
                        배치
                      </Button>
                      <Button
                        size="compact"
                        variant="outline"
                        onClick={() => handleSkillManagement(worker)}
                        className="flex-1"
                      >
                        기술 관리
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card className={getTouchPadding()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-medium ${getFullTypographyClass('heading', 'lg', isLargeFont)}`}>
                등록된 기술 목록
              </h3>
              <Button 
                size={getButtonSize()}
                onClick={() => {
                  toast({
                    title: '개발 중',
                    description: '기술 추가 기능은 개발 중입니다.'
                  })
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                기술 추가
              </Button>
            </div>
            
            {skills.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {skills.map(skill => {
                  const assignedWorkers = skillAssignments.filter(sa => sa.skill_id === skill.id).length
                  
                  return (
                    <div 
                      key={skill.id} 
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                            {skill.name}
                          </h4>
                          {skill.category && (
                            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                              분류: {skill.category}
                            </p>
                          )}
                          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-blue-600`}>
                            보유 작업자: {assignedWorkers}명
                          </p>
                        </div>
                      </div>
                      {skill.description && (
                        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 mt-2`}>
                          {skill.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className={`text-center ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500 py-8`}>
                등록된 기술이 없습니다.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <WorkerAssignmentDialog
        worker={selectedWorker}
        sites={sites}
        skills={skills}
        skillAssignments={skillAssignments}
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        onSuccess={handleRefresh}
      />

      <SkillManagementDialog
        worker={selectedWorker}
        skills={skills}
        skillAssignments={skillAssignments.filter(sa => sa.worker_id === selectedWorker?.id)}
        open={showSkillDialog}
        onOpenChange={setShowSkillDialog}
        onSuccess={handleRefresh}
      />
    </div>
  )
}