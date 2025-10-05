'use client'

import { useToast } from '@/components/ui/use-toast'

interface DocumentUploadModalProps {
  document?: SharedDocument | null
  onClose: () => void
  onSuccess: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  error?: string
  success?: boolean
}

export default function DocumentUploadModal({
  document,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [formData, setFormData] = useState({
    title: document?.title || '',
    description: document?.description || '',
    site_id: document?.site_id || '',
    organization_id: document?.organization_id || '',
    category: (document?.category as DocumentCategory) || ('' as DocumentCategory),
    tags: document?.tags?.join(', ') || '',
  })
  const [sites, setSites] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isEdit = !!document
  const { toast } = useToast()

  const categories: DocumentCategory[] = [
    '도면',
    '계약서',
    '보고서',
    '사진',
    'PTW 작업허가서',
    '기타',
  ]

  // Load options
  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      // Load sites
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      // Load organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      setSites(sitesData || [])
      setOrganizations(orgsData || [])
    } catch (error) {
      console.error('Failed to load options:', error)
    }
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles: UploadFile[] = []

    newFiles.forEach(file => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.warn(`File type not allowed: ${file.type}`)
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.size} bytes`)
        return
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substring(2),
        progress: 0,
      })
    })

    if (!isEdit) {
      // For new uploads, add to list
      setFiles(prev => [...prev, ...validFiles])
    } else {
      // For edits, replace the single file
      setFiles(validFiles.slice(0, 1))
    }

    // Auto-fill title if empty and single file
    if (!formData.title && validFiles.length === 1) {
      setFormData(prev => ({
        ...prev,
        title: validFiles[0].file.name.replace(/\.[^/.]+$/, ''),
      }))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ variant: 'warning', title: '입력 필요', description: '문서 제목을 입력해주세요.' })
      return false
    }

    if (!isEdit && files.length === 0) {
      toast({
        variant: 'warning',
        title: '입력 필요',
        description: '업로드할 파일을 선택해주세요.',
      })
      return false
    }

    return true
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', uploadFile.file)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('site_id', formData.site_id)
      formDataToSend.append('organization_id', formData.organization_id)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('tags', formData.tags)

      const response = await fetch('/api/shared-documents', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      // Update file progress
      setFiles(prev =>
        prev.map(f => (f.id === uploadFile.id ? { ...f, progress: 100, success: true } : f))
      )

      return true
    } catch (error) {
      console.error('Upload error:', error)

      // Update file error
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      )

      return false
    }
  }

  const updateDocument = async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/shared-documents/${document!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          site_id: formData.site_id || null,
          organization_id: formData.organization_id || null,
          category: formData.category || null,
          tags: formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Update failed')
      }

      return true
    } catch (error) {
      console.error('Update error:', error)
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '업데이트에 실패했습니다.',
      })
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (isEdit) {
        // Update existing document
        const success = await updateDocument()
        if (success) {
          onSuccess()
        }
      } else {
        // Upload new documents
        const uploadPromises = files.map(uploadFile)
        const results = await Promise.all(uploadPromises)

        if (results.some(success => success)) {
          onSuccess()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    return FILE_TYPE_ICONS[extension] || FILE_TYPE_ICONS.default
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? '문서 수정' : '문서 업로드'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          {!isEdit && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                파일 업로드
              </label>

              {/* Drag & Drop Area */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={!isEdit}
                  accept={ALLOWED_MIME_TYPES.join(',')}
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  파일을 드래그하거나 클릭하여 선택
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  PDF, Word, Excel, PowerPoint, 이미지 파일 지원 (최대{' '}
                  {formatFileSize(MAX_FILE_SIZE)})
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    선택된 파일 ({files.length})
                  </h4>
                  {files.map(uploadFile => (
                    <div
                      key={uploadFile.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-xl">{getFileIcon(uploadFile.file)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFileSize(uploadFile.file.size)}
                        </p>

                        {/* Progress/Status */}
                        {uploadFile.success && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">업로드 완료</span>
                          </div>
                        )}

                        {uploadFile.error && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">{uploadFile.error}</span>
                          </div>
                        )}

                        {uploadFile.progress > 0 && uploadFile.progress < 100 && (
                          <div className="mt-1">
                            <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  문서 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="문서 제목을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="문서에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  태그
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="태그를 쉼표로 구분하여 입력 (예: 도면, 1층, 설계)"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  현장
                </label>
                <select
                  value={formData.site_id}
                  onChange={e => setFormData(prev => ({ ...prev, site_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">현장 선택</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  조직
                </label>
                <select
                  value={formData.organization_id}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, organization_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">조직 선택</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, category: e.target.value as DocumentCategory }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? '수정' : '업로드'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
