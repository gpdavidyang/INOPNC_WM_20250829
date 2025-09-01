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
  ZoomIn,
  Plus,
  FileText,
  Receipt
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ReceiptFile {
  id: string
  filename: string
  file_path: string
  file_type: 'receipt'
  file_size: number
  mime_type: string
  category: string
  amount: string
  receipt_date: string
  description?: string
  created_at: string
  created_by: string
}

interface ReceiptsTabProps {
  reportId: string
  isEditing: boolean
  onSaveComplete?: () => void
}

export default function ReceiptsTab({ 
  reportId, 
  isEditing,
  onSaveComplete
}: ReceiptsTabProps) {
  const [receipts, setReceipts] = useState<ReceiptFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptFile | null>(null)
  const [receiptEntries, setReceiptEntries] = useState([{
    id: 'receipt-' + Date.now(),
    category: '',
    amount: '',
    receipt_date: new Date().toISOString().split('T')[0],
    files: [] as File[],
    filePreviews: [] as string[]
  }])

  useEffect(() => {
    fetchReceipts()
  }, [reportId])

  useEffect(() => {
    if (saveStatus.type) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_documents')
        .select('*')
        .eq('daily_report_id', reportId)
        .eq('file_type', 'receipt')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReceipts(data || [])
    } catch (error) {
      console.error('Error fetching receipts:', error)
      setError('영수증을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`${file.name}: 지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP, PDF만 지원됩니다.`)
    }

    if (file.size > maxSize) {
      throw new Error(`${file.name}: 파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.`)
    }
  }

  const addReceiptEntry = () => {
    setReceiptEntries(prev => [...prev, {
      id: 'receipt-' + Date.now(),
      category: '',
      amount: '',
      receipt_date: new Date().toISOString().split('T')[0],
      files: [] as File[],
      filePreviews: [] as string[]
    }])
  }

  const removeReceiptEntry = (index: number) => {
    if (receiptEntries.length === 1) return // Keep at least one entry
    setReceiptEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateReceiptEntry = (index: number, field: string, value: string) => {
    setReceiptEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ))
  }

  const handleEntryFileUpload = (e: React.ChangeEvent<HTMLInputElement>, entryIndex: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const newFiles: File[] = []
    const newPreviews: string[] = []

    fileArray.forEach(file => {
      newFiles.push(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const preview = e.target?.result as string
          setReceiptEntries(prev => prev.map((entry, i) => 
            i === entryIndex ? {
              ...entry,
              filePreviews: [...entry.filePreviews, preview]
            } : entry
          ))
        }
        reader.readAsDataURL(file)
      }
    })

    setReceiptEntries(prev => prev.map((entry, i) => 
      i === entryIndex ? {
        ...entry,
        files: [...entry.files, ...newFiles]
      } : entry
    ))

    // Reset file input
    e.target.value = ''
  }

  const removeFileFromEntry = (entryIndex: number, fileIndex: number) => {
    setReceiptEntries(prev => prev.map((entry, i) => 
      i === entryIndex ? {
        ...entry,
        files: entry.files.filter((_, fi) => fi !== fileIndex),
        filePreviews: entry.filePreviews.filter((_, fi) => fi !== fileIndex)
      } : entry
    ))
  }

  const hasValidEntries = () => {
    return receiptEntries.some(entry => 
      entry.category && entry.amount && entry.receipt_date && entry.files.length > 0
    )
  }

  const handleAllReceiptsUpload = async () => {
    const validEntries = receiptEntries.filter(entry => 
      entry.category && entry.amount && entry.receipt_date && entry.files.length > 0
    )

    if (validEntries.length === 0) {
      setSaveStatus({ 
        type: 'error', 
        message: '업로드할 유효한 영수증이 없습니다.' 
      })
      return
    }

    setUploading(true)
    setSaveStatus({ type: null, message: '' })
    let totalUploaded = 0

    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
      }

      // Process each valid entry
      for (const entry of validEntries) {
        // Validate files
        for (const file of entry.files) {
          validateFile(file)
        }

        // Upload files for this entry
        const uploadPromises = entry.files.map(async (file) => {
          const fileName = `${reportId}/receipts/${Date.now()}_${file.name}`

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, file)

          if (uploadError) {
            throw new Error(`파일 업로드 실패: ${uploadError.message} (${file.name})`)
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName)

          // Save metadata
          const { data: fileData, error: dbError } = await supabase
            .from('daily_documents')
            .insert({
              daily_report_id: reportId,
              document_type: 'receipt',
              file_url: urlData.publicUrl,
              filename: file.name,
              file_name: file.name,
              file_path: fileName,
              file_type: 'receipt',
              file_size: file.size,
              mime_type: file.type,
              category: entry.category,
              amount: entry.amount,
              receipt_date: entry.receipt_date,
              created_by: user.id,
              uploaded_by: user.id
            })
            .select()
            .single()

          if (dbError) {
            // Try to clean up uploaded file
            await supabase.storage.from('receipts').remove([fileName])
            throw new Error(`메타데이터 저장 실패: ${dbError.message} (${file.name})`)
          }

          totalUploaded++
          return fileData
        })

        await Promise.all(uploadPromises)
      }

      await fetchReceipts()
      
      // Reset form to single empty entry
      setReceiptEntries([{
        id: 'receipt-' + Date.now(),
        category: '',
        amount: '',
        receipt_date: new Date().toISOString().split('T')[0],
        files: [] as File[],
        filePreviews: [] as string[]
      }])
      
      setSaveStatus({ 
        type: 'success', 
        message: `영수증 ${totalUploaded}개가 업로드되었습니다.` 
      })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error: any) {
      console.error('Error uploading receipts:', error)
      setSaveStatus({ 
        type: 'error', 
        message: error.message || '영수증 업로드에 실패했습니다.' 
      })
    } finally {
      setUploading(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // This function is kept for backward compatibility but won't be used in new UI
    const currentEntry = receiptEntries[0]
    
    if (!currentEntry.category || !currentEntry.amount || !currentEntry.receipt_date) {
      setSaveStatus({ 
        type: 'error', 
        message: '카테고리, 금액, 날짜를 모두 입력해주세요.' 
      })
      return
    }

    setUploading(true)
    setSaveStatus({ type: null, message: '' })

    try {
      // Validate all files first
      const fileArray = Array.from(files)
      for (const file of fileArray) {
        validateFile(file)
      }

      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
      }

      const uploadPromises = fileArray.map(async (file) => {
        const fileName = `${reportId}/receipts/${Date.now()}_${file.name}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`파일 업로드 실패: ${uploadError.message} (${file.name})`)
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)

        // Save metadata
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            document_type: 'receipt',
            file_url: urlData.publicUrl,
            filename: file.name,
            file_name: file.name,
            file_path: fileName,
            file_type: 'receipt',
            file_size: file.size,
            mime_type: file.type,
            category: currentEntry.category,
            amount: currentEntry.amount,
            receipt_date: currentEntry.receipt_date,
            created_by: user.id,
            uploaded_by: user.id
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database insert error:', dbError)
          // Try to clean up uploaded file
          await supabase.storage
            .from('receipts')
            .remove([fileName])
          throw new Error(`메타데이터 저장 실패: ${dbError.message} (${file.name})`)
        }

        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchReceipts()
      
      // Reset form
      setReceiptEntries([{
        id: 'receipt-' + Date.now(),
        category: '',
        amount: '',
        receipt_date: new Date().toISOString().split('T')[0],
        files: [] as File[],
        filePreviews: [] as string[]
      }])
      
      setSaveStatus({ 
        type: 'success', 
        message: `영수증 ${fileArray.length}개가 업로드되었습니다.` 
      })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error: any) {
      console.error('Error uploading receipts:', error)
      setSaveStatus({ 
        type: 'error', 
        message: error.message || '영수증 업로드에 실패했습니다.' 
      })
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleDelete = async (receipt: ReceiptFile) => {
    if (!confirm(`이 영수증을 삭제하시겠습니까?`)) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receipt.file_path])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete metadata
      const { error: dbError } = await supabase
        .from('daily_documents')
        .delete()
        .eq('id', receipt.id)

      if (dbError) throw dbError

      await fetchReceipts()
      setSaveStatus({ type: 'success', message: '영수증이 삭제되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error deleting receipt:', error)
      setSaveStatus({ type: 'error', message: '영수증 삭제에 실패했습니다.' })
    }
  }

  const getReceiptUrl = (receipt: ReceiptFile) => {
    const supabase = createClient()
    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(receipt.file_path)
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
        <p className="ml-3 text-gray-600">영수증을 불러오는 중...</p>
      </div>
    )
  }

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
          <Receipt className="h-5 w-5 text-blue-600" />
          영수증 정보
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            총 {receipts.length}개
          </span>
        </h3>
      </div>

      {/* Receipt Form Section */}
      {isEditing && (
        <div className="space-y-4">
          {/* Multiple Receipt Entries */}
          <div className="space-y-4">
            {receiptEntries.map((entry, index) => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    영수증 정보 {receiptEntries.length > 1 ? `${index + 1}` : ''}
                  </h4>
                  {receiptEntries.length > 1 && (
                    <button
                      onClick={() => removeReceiptEntry(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="영수증 항목 삭제"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      구분 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={entry.category}
                      onChange={(e) => updateReceiptEntry(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">예: 자재비</option>
                      <option value="교통비">교통비</option>
                      <option value="식비">식비</option>
                      <option value="숙박비">숙박비</option>
                      <option value="재료비">재료비</option>
                      <option value="장비비">장비비</option>
                      <option value="자재비">자재비</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      금액 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateReceiptEntry(index, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      일자 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={entry.receipt_date}
                      onChange={(e) => updateReceiptEntry(index, 'receipt_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* File Upload for this entry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      파일 첨부
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        id={`receipt-upload-${entry.id}`}
                        className="hidden"
                        onChange={(e) => handleEntryFileUpload(e, index)}
                        accept="image/*,application/pdf"
                        multiple
                        disabled={uploading}
                      />
                      <label
                        htmlFor={`receipt-upload-${entry.id}`}
                        className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          uploading 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        {entry.files.length > 0 ? `${entry.files.length}개 선택됨` : '파일 선택'}
                      </label>
                    </div>
                    {/* File previews for this entry */}
                    {entry.filePreviews.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.filePreviews.map((preview, fileIndex) => (
                          <div key={fileIndex} className="relative">
                            <img 
                              src={preview} 
                              alt={`Preview ${fileIndex + 1}`}
                              className="h-12 w-12 object-cover rounded border"
                            />
                            <button
                              onClick={() => removeFileFromEntry(index, fileIndex)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
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
            ))}
            
            {/* Add Receipt Button */}
            <button
              onClick={addReceiptEntry}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 border-dashed rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
            >
              <Plus className="h-5 w-5" />
              영수증 추가
            </button>
          </div>

          {/* Upload All Button */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-center">
              <button
                onClick={handleAllReceiptsUpload}
                disabled={uploading || !hasValidEntries()}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  uploading || !hasValidEntries()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    모든 영수증 저장
                  </>
                )}
              </button>
              <p className="mt-2 text-sm text-gray-600">
                입력된 모든 영수증 정보를 저장합니다
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receipts List */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          영수증 목록
        </h4>
        {receipts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Receipt className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">영수증이 없습니다.</p>
            {!isEditing && <p className="text-xs text-gray-500">편집 모드에서 영수증을 추가할 수 있습니다.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onView={() => setSelectedReceipt(receipt)}
                onDelete={() => handleDelete(receipt)}
                isEditing={isEditing}
                getReceiptUrl={getReceiptUrl}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            {selectedReceipt.mime_type === 'application/pdf' ? (
              <iframe
                src={getReceiptUrl(selectedReceipt)}
                className="w-full h-[85vh] bg-white rounded"
                title={selectedReceipt.filename}
              />
            ) : (
              <img
                src={getReceiptUrl(selectedReceipt)}
                alt={selectedReceipt.filename}
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{selectedReceipt.filename}</p>
                  <p className="text-xs opacity-75">
                    {format(new Date(selectedReceipt.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p><span className="font-medium">카테고리:</span> {selectedReceipt.category}</p>
                  <p><span className="font-medium">금액:</span> {parseInt(selectedReceipt.amount).toLocaleString()}원</p>
                  <p><span className="font-medium">날짜:</span> {selectedReceipt.receipt_date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Receipt Card Component
interface ReceiptCardProps {
  receipt: ReceiptFile
  onView: () => void
  onDelete: () => void
  isEditing: boolean
  getReceiptUrl: (receipt: ReceiptFile) => string
  formatFileSize: (bytes: number) => string
}

function ReceiptCard({ receipt, onView, onDelete, isEditing, getReceiptUrl, formatFileSize }: ReceiptCardProps) {
  const isPDF = receipt.mime_type === 'application/pdf'
  
  return (
    <div className="relative group border border-gray-200 rounded-lg bg-white hover:shadow-lg transition-shadow p-4">
      <div className="flex items-start gap-4">
        {/* File Preview */}
        <div 
          className="flex-shrink-0 w-16 h-16 cursor-pointer rounded-lg overflow-hidden border border-gray-200"
          onClick={onView}
        >
          {isPDF ? (
            <div className="w-full h-full bg-red-50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <img
              src={getReceiptUrl(receipt)}
              alt={receipt.filename}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Receipt Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-gray-900 truncate" title={receipt.filename}>
                {receipt.filename}
              </h5>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {receipt.category}
                  </span>
                  <span className="font-medium text-green-600">
                    {parseInt(receipt.amount).toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{receipt.receipt_date}</span>
                  <span>{formatFileSize(receipt.file_size)}</span>
                  <span>{isPDF ? 'PDF' : '이미지'}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(receipt.created_at), 'yyyy-MM-dd HH:mm 업로드', { locale: ko })}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={onView}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="미리보기"
              >
                <Eye className="h-4 w-4" />
              </button>
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}