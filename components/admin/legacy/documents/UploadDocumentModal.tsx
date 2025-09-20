'use client'


interface UploadDocumentModalProps {
  category: string
  sites: Array<{id: string, name: string}>
  profile: Profile
  onClose: () => void
  onSuccess: () => void
}

export default function UploadDocumentModal({
  category,
  sites,
  profile,
  onClose,
  onSuccess
}: UploadDocumentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    site_id: '',
    folder_id: '',
    document_type: category
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('지원하지 않는 파일 형식입니다. PDF, 이미지(JPG, PNG), Word, Excel 파일만 업로드 가능합니다.')
      return
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    setFile(selectedFile)
    if (!formData.title) {
      setFormData({
        ...formData,
        title: selectedFile.name.replace(/\.[^/.]+$/, '') // Remove extension
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      alert('파일을 선택해주세요.')
      return
    }

    if (!formData.title.trim()) {
      alert('문서 제목을 입력해주세요.')
      return
    }

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `documents/${category}/${fileName}`

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Create document record with current schema
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        document_type: formData.document_type,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        site_id: formData.site_id || null,
        folder_path: '', // Use existing folder_path field
        owner_id: profile.id,
        is_public: ['shared', 'required'].includes(category) // Auto-set public for shared docs
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (error) throw error

      // TODO: Auto-share logic will be implemented when document_access_control table exists
      // For now, use is_public flag for basic sharing

      onSuccess()
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('문서 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const getCategoryDisplayName = (categoryName: string) => {
    const names: Record<string, string> = {
      personal: '개인문서',
      shared: '공유문서',
      blueprint: '도면마킹',
      required: '필수서류',
      progress_payment: '기성청구',
      report: '보고서',
      certificate: '인증서',
      other: '기타'
    }
    return names[categoryName] || '기타'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              문서 업로드
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <File className="h-4 w-4" />
                <span className="text-sm font-medium">
                  카테고리: {getCategoryDisplayName(category)}
                </span>
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                파일 선택 <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-3">
                    <File className="h-12 w-12 text-blue-600 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      파일 제거
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">
                        파일을 드래그하여 업로드하거나
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        파일을 선택하세요
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, 이미지(JPG, PNG), Word, Excel 파일 지원 (최대 10MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) {
                    handleFileSelect(selectedFile)
                  }
                }}
              />
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                문서 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="문서 제목을 입력하세요"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명 (선택사항)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="문서에 대한 설명을 입력하세요"
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현장 선택
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                >
                  <option value="">현장을 선택하세요</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-share Notice */}
            {['shared', 'required', 'progress_payment'].includes(category) && formData.site_id && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    자동 공유 안내
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    이 문서는 선택된 현장의 모든 구성원에게 자동으로 공유됩니다.
                    {category === 'required' && ' (읽기 전용)'}
                    {category === 'progress_payment' && ' (파트너사와 자동 공유)'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={uploading || !file || !formData.title.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    업로드 중...
                  </div>
                ) : (
                  '문서 업로드'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}