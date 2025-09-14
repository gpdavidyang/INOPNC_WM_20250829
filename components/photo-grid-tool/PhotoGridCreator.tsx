'use client'


interface PhotoGridCreatorProps {
  document?: unknown
  onBack: () => void
  onSave: () => void
}

interface PhotoData {
  before: File[]
  after: File[]
  beforePreviews: string[]
  afterPreviews: string[]
}

export default function PhotoGridCreator({ document, onBack, onSave }: PhotoGridCreatorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  
  // Form state
  const [selectedSite, setSelectedSite] = useState(document?.site_id || '')
  const [componentName, setComponentName] = useState(document?.component_name || '')
  const [customComponentName, setCustomComponentName] = useState('')
  const [workProcess, setWorkProcess] = useState(document?.work_process || '')
  const [customWorkProcess, setCustomWorkProcess] = useState('')
  const [workSection, setWorkSection] = useState(document?.work_section || '')
  const [workDate, setWorkDate] = useState(
    document?.work_date || format(new Date(), 'yyyy-MM-dd')
  )
  const [photos, setPhotos] = useState<PhotoData>({
    before: [],
    after: [],
    beforePreviews: [],
    afterPreviews: [],
  })

  // Load work options from database
  const { componentTypes: dbComponentTypes, processTypes: dbProcessTypes, loading: optionsLoading } = useWorkOptions()

  // Use database options or fallback to defaults
  const componentTypes = dbComponentTypes.length > 0 
    ? dbComponentTypes.map(type => type.option_label)
    : ['슬라브', '거더', '기둥', '기타']
  
  const processTypes = dbProcessTypes.length > 0
    ? dbProcessTypes.map(type => type.option_label)
    : ['균열', '면', '마감', '기타']

  useEffect(() => {
    fetchSites()
    // Load existing photos if editing
    if (document?.id) {
      loadExistingPhotos(document.id)
    }
  }, [document])

  const fetchSites = async () => {
    try {
      console.log('🔍 Fetching sites...')
      const response = await fetch('/api/sites')
      console.log('🔍 Sites response:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🔍 Sites result:', result)
        
        // Handle the response format: { success: true, data: [...] }
        if (result.success && Array.isArray(result.data)) {
          setSites(result.data)
        } else if (Array.isArray(result)) {
          setSites(result)
        } else {
          console.log('🔍 Unexpected sites data format:', result)
          setSites([])
        }
      } else {
        console.log('🔍 Sites response not ok:', response.status)
        const errorData = await response.text()
        console.log('🔍 Sites error:', errorData)
        setSites([])
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
      setSites([])
    }
  }

  const loadExistingPhotos = async (photoGridId: string) => {
    try {
      const response = await fetch(`/api/photo-grids/${photoGridId}/images`)
      if (response.ok) {
        const images = await response.json()
        
        const beforeImages = images.filter((img: unknown) => img.photo_type === 'before')
          .sort((a: unknown, b: unknown) => a.photo_order - b.photo_order)
        const afterImages = images.filter((img: unknown) => img.photo_type === 'after')
          .sort((a: unknown, b: unknown) => a.photo_order - b.photo_order)
        
        setPhotos({
          before: [],
          after: [],
          beforePreviews: beforeImages.map((img: unknown) => img.photo_url),
          afterPreviews: afterImages.map((img: unknown) => img.photo_url),
        })
      }
    } catch (error) {
      console.error('Failed to load existing photos:', error)
    }
  }

  const handlePhotoUpload = (type: 'before' | 'after', index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    // Check file size (10MB limit per file)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 10MB 이하여야 합니다.',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos(prev => {
        const newPhotos = { ...prev }
        
        if (type === 'before') {
          const newBeforeFiles = [...prev.before]
          const newBeforePreviews = [...prev.beforePreviews]
          
          newBeforeFiles[index] = file
          newBeforePreviews[index] = reader.result as string
          
          return {
            ...newPhotos,
            before: newBeforeFiles,
            beforePreviews: newBeforePreviews,
          }
        } else {
          const newAfterFiles = [...prev.after]
          const newAfterPreviews = [...prev.afterPreviews]
          
          newAfterFiles[index] = file
          newAfterPreviews[index] = reader.result as string
          
          return {
            ...newPhotos,
            after: newAfterFiles,
            afterPreviews: newAfterPreviews,
          }
        }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
    setPhotos(prev => {
      const newPhotos = { ...prev }
      
      if (type === 'before') {
        const newBeforeFiles = [...prev.before]
        const newBeforePreviews = [...prev.beforePreviews]
        
        newBeforeFiles.splice(index, 1)
        newBeforePreviews.splice(index, 1)
        
        return {
          ...newPhotos,
          before: newBeforeFiles,
          beforePreviews: newBeforePreviews,
        }
      } else {
        const newAfterFiles = [...prev.after]
        const newAfterPreviews = [...prev.afterPreviews]
        
        newAfterFiles.splice(index, 1)
        newAfterPreviews.splice(index, 1)
        
        return {
          ...newPhotos,
          after: newAfterFiles,
          afterPreviews: newAfterPreviews,
        }
      }
    })
  }

  const handleSave = async () => {
    // Validation
    if (!selectedSite) {
      toast({
        title: '오류',
        description: '현장을 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!componentName || !workProcess) {
      toast({
        title: '오류',
        description: '부재명과 작업공정을 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (componentName === '기타' && !customComponentName) {
      toast({
        title: '오류',
        description: '부재명을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (workProcess === '기타' && !customWorkProcess) {
      toast({
        title: '오류',
        description: '작업공정을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    const totalPhotos = photos.before.length + photos.beforePreviews.filter((p, i) => !photos.before[i]).length +
                       photos.after.length + photos.afterPreviews.filter((p, i) => !photos.after[i]).length

    if (totalPhotos === 0) {
      toast({
        title: '오류',
        description: '최소 1장 이상의 사진을 업로드해주세요.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('site_id', selectedSite)
      formData.append('component_name', componentName === '기타' ? customComponentName : componentName)
      formData.append('work_process', workProcess === '기타' ? customWorkProcess : workProcess)
      formData.append('work_section', workSection)
      formData.append('work_date', workDate)
      
      // Add all before photos
      photos.before.forEach((file, index) => {
        formData.append(`before_photos`, file)
        formData.append(`before_photo_orders`, index.toString())
      })
      
      // Add all after photos
      photos.after.forEach((file, index) => {
        formData.append(`after_photos`, file)
        formData.append(`after_photo_orders`, index.toString())
      })

      // Keep track of existing photos (for edit mode)
      if (document?.id) {
        const existingBefore = photos.beforePreviews
          .map((url, index) => !photos.before[index] ? { url, order: index } : null)
          .filter(Boolean)
        const existingAfter = photos.afterPreviews
          .map((url, index) => !photos.after[index] ? { url, order: index } : null)
          .filter(Boolean)
        
        formData.append('existing_before_photos', JSON.stringify(existingBefore))
        formData.append('existing_after_photos', JSON.stringify(existingAfter))
      }

      const url = document 
        ? `/api/photo-grids/${document.id}`
        : '/api/photo-grids'
      
      const method = document ? 'PUT' : 'POST'

      // Add timestamp to force cache bypass
      const cacheBuster = `?t=${Date.now()}`
      const finalUrl = url + cacheBuster

      console.log(`[PhotoGrid] Sending ${method} request to:`, finalUrl)

      const response = await fetch(finalUrl, {
        method,
        body: formData,
        cache: 'no-cache',
      })

      console.log(`[PhotoGrid] Response status:`, response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('[PhotoGrid] Save successful:', result)
        toast({
          title: '성공',
          description: '사진대지가 저장되었습니다.',
        })
        onSave()
      } else {
        const errorText = await response.text()
        console.error(`[PhotoGrid] Error response (${response.status}):`, errorText)
        throw new Error(`서버 오류 (${response.status}): ${errorText || 'Failed to save document'}`)
      }
    } catch (error) {
      console.error('Error saving document:', error)
      const errorMessage = error instanceof Error ? error.message : '문서 저장에 실패했습니다.'
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Photo upload slot component
  const PhotoUploadSlot = ({ 
    type, 
    index, 
    photo, 
    preview 
  }: { 
    type: 'before' | 'after'
    index: number
    photo?: File
    preview?: string 
  }) => (
    <div className="relative">
      {preview ? (
        <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt={`${type === 'before' ? '작업 전' : '작업 후'} ${index + 1}`}
            fill
            className="object-cover"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => handleRemovePhoto(type, index)}
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {index + 1}
          </span>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePhotoUpload(type, index, file)
            }}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 h-40 flex flex-col items-center justify-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              사진 {index + 1}
            </p>
            <p className="text-xs text-gray-500">
              클릭하여 업로드
            </p>
          </div>
        </label>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">
          {document ? '사진대지 수정' : '새 사진대지 생성'}
        </h1>
      </div>

      {/* Form Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="site">현장 선택 *</Label>
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger id="site">
                  <CustomSelectValue placeholder="현장을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {sites.map(site => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div>
              <Label htmlFor="workDate">작업일자</Label>
              <Input
                id="workDate"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="section">작업구간</Label>
              <Input
                id="section"
                placeholder="예: 1층 A구역"
                value={workSection}
                onChange={(e) => setWorkSection(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="component">부재명 *</Label>
              <CustomSelect value={componentName} onValueChange={(value) => {
                setComponentName(value)
                if (value !== '기타') {
                  setCustomComponentName('')
                }
              }}>
                <CustomSelectTrigger id="component">
                  <CustomSelectValue placeholder="부재명을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {componentTypes.map(type => (
                    <CustomSelectItem key={type} value={type}>
                      {type}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              {componentName === '기타' && (
                <Input
                  className="mt-2"
                  placeholder="부재명을 입력하세요"
                  value={customComponentName}
                  onChange={(e) => setCustomComponentName(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="process">작업공정 *</Label>
              <CustomSelect value={workProcess} onValueChange={(value) => {
                setWorkProcess(value)
                if (value !== '기타') {
                  setCustomWorkProcess('')
                }
              }}>
                <CustomSelectTrigger id="process">
                  <CustomSelectValue placeholder="작업공정을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {processTypes.map(type => (
                    <CustomSelectItem key={type} value={type}>
                      {type}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              {workProcess === '기타' && (
                <Input
                  className="mt-2"
                  placeholder="작업공정을 입력하세요"
                  value={customWorkProcess}
                  onChange={(e) => setCustomWorkProcess(e.target.value)}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Section - Side by side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Before Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              작업 전 사진
              <span className="text-sm font-normal text-gray-500">(최대 3장)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map(index => (
              <PhotoUploadSlot
                key={`before-${index}`}
                type="before"
                index={index}
                photo={photos.before[index]}
                preview={photos.beforePreviews[index]}
              />
            ))}
          </CardContent>
        </Card>

        {/* Right Column - After Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              작업 후 사진
              <span className="text-sm font-normal text-gray-500">(최대 3장)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map(index => (
              <PhotoUploadSlot
                key={`after-${index}`}
                type="after"
                index={index}
                photo={photos.after[index]}
                preview={photos.afterPreviews[index]}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onBack}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}