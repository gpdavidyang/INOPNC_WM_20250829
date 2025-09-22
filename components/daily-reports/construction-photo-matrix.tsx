'use client'


interface ConstructionPhotoMatrixProps {
  dailyReportId: string
  initialPhotoGroups?: PhotoGroup[]
  onPhotoGroupsChange: (groups: PhotoGroup[]) => void
  onGeneratePDF?: () => void
}

// 공정 타입 옵션 (사용자 요구사항에 맞춤)
const PROCESS_OPTIONS: { value: ConstructionProcessType; label: string; color: string }[] = [
  { value: 'crack', label: '균열', color: 'bg-red-100 text-red-800' },
  { value: 'surface', label: '면', color: 'bg-blue-100 text-blue-800' },
  { value: 'finishing', label: '마감', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: '기타', color: 'bg-orange-100 text-orange-800' }
]

// 부재 타입 옵션 (사용자 요구사항에 맞춤)
const COMPONENT_OPTIONS: { value: ComponentType; label: string }[] = [
  { value: 'slab', label: '슬라브' },
  { value: 'girder', label: '거더' },
  { value: 'column', label: '기둥' },
  { value: 'other', label: '기타' }
]

export default function ConstructionPhotoMatrix({
  dailyReportId,
  initialPhotoGroups = [],
  onPhotoGroupsChange,
  onGeneratePDF
}: ConstructionPhotoMatrixProps) {
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>(initialPhotoGroups)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newComponentName, setNewComponentName] = useState('')
  const [newComponentType, setNewComponentType] = useState<ComponentType>('slab')
  const [newProcessType, setNewProcessType] = useState<ConstructionProcessType>('crack')
  const [componentSuggestions, setComponentSuggestions] = useState<string[]>([])

  // initialPhotoGroups 변경 감지 및 내부 state 동기화
  useEffect(() => {
    setPhotoGroups(initialPhotoGroups)
  }, [initialPhotoGroups])

  // 부재명 자동완성 로딩
  useEffect(() => {
    // TODO: API 호출로 기존 부재명 목록 로딩
    const loadComponentSuggestions = async () => {
      try {
        // 예시 데이터 - 실제로는 component_masters 테이블에서 로딩
        setComponentSuggestions([
          '기둥-1', '기둥-2', '기둥-3',
          '보-A동', '보-B동', '보-C동',
          '슬라브-3층', '슬라브-4층',
          '벽체-외벽', '벽체-내벽'
        ])
      } catch (error) {
        console.error('Failed to load component suggestions:', error)
      }
    }
    loadComponentSuggestions()
  }, [])

  // 사진 그룹 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onPhotoGroupsChange(photoGroups)
  }, [photoGroups, onPhotoGroupsChange])

  // 새 사진 그룹 추가
  const handleAddPhotoGroup = useCallback(() => {
    if (!newComponentName.trim()) return

    const newGroup: PhotoGroup = {
      id: `temp-${Date.now()}`,
      component_name: newComponentName.trim(),
      component_type: newComponentType,
      process_type: newProcessType,
      before_photos: [],
      after_photos: [],
      progress_status: 'not_started',
      daily_report_id: dailyReportId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setPhotoGroups(prev => [...prev, newGroup])
    setNewComponentName('')
    setIsAddingGroup(false)
  }, [newComponentName, newComponentType, newProcessType, dailyReportId])

  // 사진 업로드 처리
  const handlePhotoUpload = useCallback(
    (groupId: string, stage: 'before' | 'after', files: FileList) => {
      const group = photoGroups.find(g => g.id === groupId)
      if (!group) return

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const photo: ConstructionPhoto = {
            id: `temp-${Date.now()}-${Math.random()}`,
            component_name: group.component_name,
            component_type: group.component_type,
            process_type: group.process_type,
            stage,
            file_url: URL.createObjectURL(file),
            file_name: file.name,
            file_size: file.size,
            timestamp: new Date().toISOString(),
            uploaded_by: 'current-user', // TODO: 실제 사용자 ID
            daily_report_id: dailyReportId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          setPhotoGroups(prev => 
            prev.map(g => {
              if (g.id === groupId) {
                const updatedGroup = { ...g }
                if (stage === 'before') {
                  updatedGroup.before_photos = [...updatedGroup.before_photos, photo]
                } else {
                  updatedGroup.after_photos = [...updatedGroup.after_photos, photo]
                }
                
                // 진행 상태 업데이트
                if (updatedGroup.before_photos.length > 0 && updatedGroup.after_photos.length > 0) {
                  updatedGroup.progress_status = 'completed'
                } else if (updatedGroup.before_photos.length > 0 || updatedGroup.after_photos.length > 0) {
                  updatedGroup.progress_status = 'in_progress'
                }
                
                return updatedGroup
              }
              return g
            })
          )
        }
      })
    },
    [photoGroups, dailyReportId]
  )

  // 사진 삭제
  const handlePhotoDelete = useCallback((groupId: string, photoId: string, stage: 'before' | 'after') => {
    setPhotoGroups(prev => 
      prev.map(g => {
        if (g.id === groupId) {
          const updatedGroup = { ...g }
          if (stage === 'before') {
            updatedGroup.before_photos = updatedGroup.before_photos.filter(p => p.id !== photoId)
          } else {
            updatedGroup.after_photos = updatedGroup.after_photos.filter(p => p.id !== photoId)
          }
          
          // 진행 상태 업데이트
          if (updatedGroup.before_photos.length === 0 && updatedGroup.after_photos.length === 0) {
            updatedGroup.progress_status = 'not_started'
          } else if (updatedGroup.before_photos.length > 0 && updatedGroup.after_photos.length > 0) {
            updatedGroup.progress_status = 'completed'
          } else {
            updatedGroup.progress_status = 'in_progress'
          }
          
          return updatedGroup
        }
        return g
      })
    )
  }, [])

  // 사진 그룹 삭제
  const handleGroupDelete = useCallback((groupId: string) => {
    setPhotoGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  // 전체 진행률 계산
  const calculateOverallProgress = useCallback(() => {
    if (photoGroups.length === 0) return 0
    const completedGroups = photoGroups.filter(g => g.progress_status === 'completed').length
    return Math.round((completedGroups / photoGroups.length) * 100)
  }, [photoGroups])

  // 진행 상태별 색상
  const getProgressColor = (status: PhotoGroup['progress_status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'not_started': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getProgressLabel = (status: PhotoGroup['progress_status']) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      case 'not_started': return '미시작'
      default: return '미시작'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 진행률 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Grid3X3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">부재별 공정 사진 관리</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                전체 진행률: <span className="font-semibold text-blue-600">{calculateOverallProgress()}%</span>
              </div>
              {onGeneratePDF && (
                <Button 
                  onClick={onGeneratePDF}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PDF 보고서
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            부재명과 공정별로 작업 전/후 사진을 체계적으로 관리하세요
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 새 그룹 추가 */}
          {isAddingGroup ? (
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="component-name">부재명</Label>
                  <Input
                    id="component-name"
                    value={newComponentName}
                    onChange={(e) => setNewComponentName(e.target.value)}
                    placeholder="예: 기둥-1, 보-A동"
                    list="component-suggestions"
                  />
                  <datalist id="component-suggestions">
                    {componentSuggestions.map(suggestion => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <Label htmlFor="component-type">부재 타입</Label>
                  <select
                    id="component-type"
                    value={newComponentType}
                    onChange={(e) => setNewComponentType(e.target.value as ComponentType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COMPONENT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="process-type">공정</Label>
                  <select
                    id="process-type"
                    value={newProcessType}
                    onChange={(e) => setNewProcessType(e.target.value as ConstructionProcessType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROCESS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddPhotoGroup} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </Button>
                <Button 
                  onClick={() => setIsAddingGroup(false)} 
                  variant="outline" 
                  size="sm"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setIsAddingGroup(true)}
              variant="outline"
              className="w-full mb-4 border-dashed border-2 h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 부재/공정 추가
            </Button>
          )}
          
          {/* 사진 그룹 목록 */}
          <div className="space-y-4">
            {photoGroups.map(group => {
              const processOption = PROCESS_OPTIONS.find(p => p.value === group.process_type)
              const componentOption = COMPONENT_OPTIONS.find(c => c.value === group.component_type)
              
              return (
                <Card key={group.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {group.component_name}
                        </h3>
                        <Badge variant="outline">
                          {componentOption?.label}
                        </Badge>
                        <Badge className={processOption?.color}>
                          {processOption?.label}
                        </Badge>
                        <Badge className={getProgressColor(group.progress_status)}>
                          {getProgressLabel(group.progress_status)}
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleGroupDelete(group.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 작업 전 사진 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Camera className="h-4 w-4 text-blue-600" />
                          <Label className="font-medium">작업 전 사진</Label>
                          <Badge variant="secondary">
                            {group.before_photos.length}장
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 업로드 영역 */}
                          <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => e.target.files && handlePhotoUpload(group.id, 'before', e.target.files)}
                              className="hidden"
                              id={`before-upload-${group.id}`}
                            />
                            <label 
                              htmlFor={`before-upload-${group.id}`}
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className="h-6 w-6 text-blue-500" />
                              <span className="text-sm text-blue-600 font-medium">
                                사진 업로드
                              </span>
                              <span className="text-xs text-gray-500">
                                여러 장 선택 가능
                              </span>
                            </label>
                          </div>
                          
                          {/* 사진 미리보기 */}
                          {group.before_photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {group.before_photos.map(photo => (
                                <div key={photo.id} className="relative group">
                                  <img
                                    src={photo.file_url}
                                    alt={`작업 전 - ${photo.file_name}`}
                                    className="w-full h-24 object-cover rounded border border-gray-200"
                                  />
                                  <button
                                    onClick={() => handlePhotoDelete(group.id, photo.id, 'before')}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 작업 후 사진 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Camera className="h-4 w-4 text-green-600" />
                          <Label className="font-medium">작업 후 사진</Label>
                          <Badge variant="secondary">
                            {group.after_photos.length}장
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 업로드 영역 */}
                          <div className="border-2 border-dashed border-green-200 rounded-lg p-4 text-center hover:border-green-300 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => e.target.files && handlePhotoUpload(group.id, 'after', e.target.files)}
                              className="hidden"
                              id={`after-upload-${group.id}`}
                            />
                            <label 
                              htmlFor={`after-upload-${group.id}`}
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className="h-6 w-6 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">
                                사진 업로드
                              </span>
                              <span className="text-xs text-gray-500">
                                여러 장 선택 가능
                              </span>
                            </label>
                          </div>
                          
                          {/* 사진 미리보기 */}
                          {group.after_photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {group.after_photos.map(photo => (
                                <div key={photo.id} className="relative group">
                                  <img
                                    src={photo.file_url}
                                    alt={`작업 후 - ${photo.file_name}`}
                                    className="w-full h-24 object-cover rounded border border-gray-200"
                                  />
                                  <button
                                    onClick={() => handlePhotoDelete(group.id, photo.id, 'after')}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 완료 표시 */}
                    {group.progress_status === 'completed' && (
                      <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          작업 전/후 사진이 모두 업로드되었습니다
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {/* 빈 상태 */}
          {photoGroups.length === 0 && (
            <div className="text-center py-12">
              <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                사진 그룹이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                부재명과 공정을 추가하여 체계적인 사진 관리를 시작하세요
              </p>
              <Button onClick={() => setIsAddingGroup(true)}>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 그룹 추가
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}