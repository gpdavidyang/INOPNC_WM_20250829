'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  Trash2, 
  Camera,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  ZoomIn
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PhotoFile {
  id: string
  filename: string
  file_path: string
  file_type: 'photo_before' | 'photo_after'
  file_size: number
  mime_type: string
  description?: string
  created_at: string
  created_by: string
}

interface PhotosTabProps {
  reportId: string
  isEditing: boolean
  onSaveComplete?: () => void
}

export default function PhotosTab({ 
  reportId, 
  isEditing,
  onSaveComplete
}: PhotosTabProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null)
  const [photoType, setPhotoType] = useState<'photo_before' | 'photo_after'>('photo_after')

  useEffect(() => {
    fetchPhotos()
  }, [reportId])

  useEffect(() => {
    if (saveStatus.type) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_documents')
        .select('*')
        .eq('daily_report_id', reportId)
        .in('file_type', ['photo_before', 'photo_after'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
      setError('사진을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setSaveStatus({ type: null, message: '' })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate image file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}은(는) 이미지 파일이 아닙니다.`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${reportId}/photos/${Date.now()}_${file.name}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('daily-report-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Save metadata
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            filename: file.name,
            file_path: fileName,
            file_type: photoType,
            file_size: file.size,
            mime_type: file.type,
            created_by: user?.id
          })
          .select()
          .single()

        if (dbError) throw dbError
        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchPhotos()
      setSaveStatus({ type: 'success', message: '사진이 업로드되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      setSaveStatus({ type: 'error', message: error instanceof Error ? error.message : '사진 업로드에 실패했습니다.' })
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleDelete = async (photo: PhotoFile) => {
    if (!confirm(`이 사진을 삭제하시겠습니까?`)) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('daily-report-photos')
        .remove([photo.file_path])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete metadata
      const { error: dbError } = await supabase
        .from('daily_documents')
        .delete()
        .eq('id', photo.id)

      if (dbError) throw dbError

      await fetchPhotos()
      setSaveStatus({ type: 'success', message: '사진이 삭제되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      setSaveStatus({ type: 'error', message: '사진 삭제에 실패했습니다.' })
    }
  }

  const getPhotoUrl = (photo: PhotoFile) => {
    const supabase = createClient()
    const { data } = supabase.storage
      .from('daily-report-photos')
      .getPublicUrl(photo.file_path)
    return data.publicUrl
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">사진을 불러오는 중...</p>
      </div>
    )
  }

  const beforePhotos = photos.filter(p => p.file_type === 'photo_before')
  const afterPhotos = photos.filter(p => p.file_type === 'photo_after')

  return (
    <div className="space-y-6">
      {/* Save Status Alert */}
      {saveStatus.type && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          사진
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            총 {photos.length}개
          </span>
        </h3>
      </div>

      {/* Upload Section */}
      {isEditing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-center gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="photo_before"
                checked={photoType === 'photo_before'}
                onChange={(e) => setPhotoType(e.target.value as 'photo_before')}
                className="mr-2"
              />
              <span className="text-sm font-medium">작업 전</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="photo_after"
                checked={photoType === 'photo_after'}
                onChange={(e) => setPhotoType(e.target.value as 'photo_after')}
                className="mr-2"
              />
              <span className="text-sm font-medium">작업 후</span>
            </label>
          </div>
          
          <div className="text-center">
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              disabled={uploading}
            />
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 ${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  사진 선택
                </>
              )}
            </label>
            <p className="mt-2 text-sm text-gray-600">
              JPG, PNG, GIF 등 이미지 파일을 업로드할 수 있습니다.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              여러 사진을 동시에 선택할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* Photos Sections */}
      <div className="space-y-8">
        {/* Before Photos */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            작업 전 사진
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
              {beforePhotos.length}개
            </span>
          </h4>
          {beforePhotos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">작업 전 사진이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {beforePhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onView={() => setSelectedPhoto(photo)}
                  onDelete={() => handleDelete(photo)}
                  isEditing={isEditing}
                  getPhotoUrl={getPhotoUrl}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>

        {/* After Photos */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            작업 후 사진
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
              {afterPhotos.length}개
            </span>
          </h4>
          {afterPhotos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">작업 후 사진이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {afterPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onView={() => setSelectedPhoto(photo)}
                  onDelete={() => handleDelete(photo)}
                  isEditing={isEditing}
                  getPhotoUrl={getPhotoUrl}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={getPhotoUrl(selectedPhoto)}
              alt={selectedPhoto.filename}
              className="max-w-full max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <p className="text-sm">{selectedPhoto.filename}</p>
              <p className="text-xs opacity-75">
                {format(new Date(selectedPhoto.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Photo Card Component
interface PhotoCardProps {
  photo: PhotoFile
  onView: () => void
  onDelete: () => void
  isEditing: boolean
  getPhotoUrl: (photo: PhotoFile) => string
  formatFileSize: (bytes: number) => string
}

function PhotoCard({ photo, onView, onDelete, isEditing, getPhotoUrl, formatFileSize }: PhotoCardProps) {
  return (
    <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
      <div 
        className="aspect-square cursor-pointer"
        onClick={onView}
      >
        <img
          src={getPhotoUrl(photo)}
          alt={photo.filename}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs text-gray-900 truncate" title={photo.filename}>
          {photo.filename}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(photo.file_size)}
        </p>
      </div>
      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}