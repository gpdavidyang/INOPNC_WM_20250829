'use client'


interface PhotoGridPreviewProps {
  photoGroups: PhotoGroup[]
  siteName?: string
  reportDate?: string
  reporterName?: string
  onGeneratePDF?: () => void
}

// 공정 타입별 한글 라벨 (사용자 요구사항에 맞춤)
const PROCESS_LABELS: Record<ConstructionProcessType, string> = {
  crack: '균열',
  surface: '면',
  finishing: '마감',
  other: '기타'
}

// 부재 타입별 한글 라벨 (사용자 요구사항에 맞춤)
const COMPONENT_LABELS: Record<ComponentType, string> = {
  slab: '슬라브',
  girder: '거더',
  column: '기둥',
  other: '기타'
}

export default function PhotoGridPreview({
  photoGroups,
  siteName = '강남 A현장',
  reportDate,
  reporterName = '작업자',
  onGeneratePDF
}: PhotoGridPreviewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null)

  // 그룹을 부재명별로 정리
  const groupedByComponent = useMemo(() => {
    const grouped: Record<string, PhotoGroup[]> = {}
    
    photoGroups.forEach(group => {
      if (!grouped[group.component_name]) {
        grouped[group.component_name] = []
      }
      grouped[group.component_name].push(group)
    })
    
    // 각 부재명별로 공정 순서대로 정렬
    Object.keys(grouped).forEach(componentName => {
      grouped[componentName].sort((a, b) => {
        const processOrder: ConstructionProcessType[] = [
          'crack', 'surface', 'finishing', 'other'
        ]
        return processOrder.indexOf(a.process_type) - processOrder.indexOf(b.process_type)
      })
    })
    
    return grouped
  }, [photoGroups])

  // 전체 통계 계산
  const stats = useMemo(() => {
    const totalGroups = photoGroups.length
    const completedGroups = photoGroups.filter(g => g.progress_status === 'completed').length
    const totalBeforePhotos = photoGroups.reduce((sum, g) => sum + g.before_photos.length, 0)
    const totalAfterPhotos = photoGroups.reduce((sum, g) => sum + g.after_photos.length, 0)
    
    return {
      totalGroups,
      completedGroups,
      totalBeforePhotos,
      totalAfterPhotos,
      completionRate: totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0
    }
  }, [photoGroups])

  // 사진 확대 보기
  const handlePhotoClick = (url: string, componentName: string, processType: string, stage: string) => {
    setSelectedPhoto({
      url,
      title: `${componentName} - ${PROCESS_LABELS[processType as ConstructionProcessType]} (${stage === 'before' ? '작업 전' : '작업 후'})`
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 정보 - 모바일 최적화 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg md:text-xl text-blue-900 dark:text-blue-100">
                사진 대지 미리보기
              </CardTitle>
            </div>
            
            {onGeneratePDF && (
              <Button 
                onClick={onGeneratePDF}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm md:text-base"
              >
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                PDF 생성
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mt-3 md:mt-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-blue-800 dark:text-blue-200">
              <Building className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="font-medium">공사명:</span>
              <span className="truncate">{siteName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-blue-800 dark:text-blue-200">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="font-medium">일자:</span>
              <span>{reportDate || new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-blue-800 dark:text-blue-200">
              <User className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="font-medium">작성자:</span>
              <span className="truncate">{reporterName}</span>
            </div>
          </div>
        </CardHeader>
      </Card>


      {/* 부재별 사진 표 */}
      <div className="space-y-6">
        {Object.entries(groupedByComponent).map(([componentName, groups]) => {
          const componentType = groups[0]?.component_type
          const componentLabel = componentType ? COMPONENT_LABELS[componentType] : ''
          
          return (
            <Card key={componentName} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Grid3X3 className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <CardTitle className="text-base md:text-lg text-gray-900 dark:text-gray-100">
                      {componentName}
                    </CardTitle>
                    {componentLabel && (
                      <Badge variant="outline" className="text-xs">
                        {componentLabel}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {groups.filter(g => g.progress_status === 'completed').length} / {groups.length} 완료
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-600">
                          공정
                        </th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-600">
                          작업 전
                        </th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">
                          작업 후
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {groups.map((group, index) => (
                        <tr key={group.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                          <td className="px-2 sm:px-3 md:px-4 py-2 md:py-4 border-r dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
                                {PROCESS_LABELS[group.process_type]}
                              </span>
                              <Badge 
                                className={cn(
                                  'text-xs',
                                  group.progress_status === 'completed' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : group.progress_status === 'in_progress'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                )}
                              >
                                {group.progress_status === 'completed' ? '완료' : 
                                 group.progress_status === 'in_progress' ? '진행중' : '미시작'}
                              </Badge>
                            </div>
                          </td>
                          
                          {/* 작업 전 사진 */}
                          <td className="px-2 sm:px-3 md:px-4 py-2 md:py-4 border-r dark:border-gray-700">
                            {group.before_photos.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1 md:gap-2 max-w-[150px] sm:max-w-[200px] md:max-w-xs mx-auto">
                                {group.before_photos.slice(0, 4).map((photo, photoIndex) => (
                                  <div 
                                    key={photo.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handlePhotoClick(
                                      photo.file_url, 
                                      componentName, 
                                      group.process_type, 
                                      'before'
                                    )}
                                  >
                                    <img
                                      src={photo.file_url}
                                      alt={`작업 전 ${photoIndex + 1}`}
                                      className="w-full h-12 sm:h-14 md:h-16 object-cover rounded border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                      <ZoomIn className="h-3 w-3 md:h-4 md:w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                                {group.before_photos.length > 4 && (
                                  <div className="flex items-center justify-center h-12 sm:h-14 md:h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
                                    +{group.before_photos.length - 4}장
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-12 sm:h-14 md:h-16 bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-200 dark:border-gray-600">
                                <div className="text-center">
                                  <Camera className="h-3 w-3 md:h-4 md:w-4 text-gray-300 dark:text-gray-600 mx-auto mb-0.5 md:mb-1" />
                                  <span className="text-xs text-gray-400 dark:text-gray-500">사진 없음</span>
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* 작업 후 사진 */}
                          <td className="px-2 sm:px-3 md:px-4 py-2 md:py-4">
                            {group.after_photos.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1 md:gap-2 max-w-[150px] sm:max-w-[200px] md:max-w-xs mx-auto">
                                {group.after_photos.slice(0, 4).map((photo, photoIndex) => (
                                  <div 
                                    key={photo.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handlePhotoClick(
                                      photo.file_url, 
                                      componentName, 
                                      group.process_type, 
                                      'after'
                                    )}
                                  >
                                    <img
                                      src={photo.file_url}
                                      alt={`작업 후 ${photoIndex + 1}`}
                                      className="w-full h-12 sm:h-14 md:h-16 object-cover rounded border border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                      <ZoomIn className="h-3 w-3 md:h-4 md:w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                                {group.after_photos.length > 4 && (
                                  <div className="flex items-center justify-center h-12 sm:h-14 md:h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
                                    +{group.after_photos.length - 4}장
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-12 sm:h-14 md:h-16 bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-200 dark:border-gray-600">
                                <div className="text-center">
                                  <Camera className="h-3 w-3 md:h-4 md:w-4 text-gray-300 dark:text-gray-600 mx-auto mb-0.5 md:mb-1" />
                                  <span className="text-xs text-gray-400 dark:text-gray-500">사진 없음</span>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 빈 상태 */}
      {Object.keys(groupedByComponent).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              사진 데이터가 없습니다
            </h3>
            <p className="text-gray-500">
              부재별 공정 사진을 추가하면 여기에 표 형태로 표시됩니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
            />
            
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center">
              <p className="text-sm font-medium">{selectedPhoto.title}</p>
              <p className="text-xs text-gray-300 mt-1">클릭하거나 ESC 키로 닫기</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}