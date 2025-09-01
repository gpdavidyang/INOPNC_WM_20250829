'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  Trash2, 
  Receipt,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ReceiptFile {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  description?: string
  amount?: number
  receipt_date?: string
  vendor_name?: string
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
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [receiptDetails, setReceiptDetails] = useState({
    vendor_name: '',
    amount: '',
    receipt_date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  })

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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Show detail modal for first file
    setSelectedReceipt(null)
    setShowDetailModal(true)
    
    // Store files for upload after details are entered
    const fileList = Array.from(files)
    ;(window as any).__pendingReceiptFiles = fileList
  }

  const handleUploadWithDetails = async () => {
    const files = (window as any).__pendingReceiptFiles as File[]
    if (!files || files.length === 0) return

    setUploading(true)
    setSaveStatus({ type: null, message: '' })
    setShowDetailModal(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${reportId}/receipts/${Date.now()}_${file.name}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Save metadata with receipt details
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            filename: file.name,
            file_path: fileName,
            file_type: 'receipt',
            file_size: file.size,
            mime_type: file.type,
            description: receiptDetails.description,
            amount: receiptDetails.amount ? parseFloat(receiptDetails.amount) : null,
            receipt_date: receiptDetails.receipt_date,
            vendor_name: receiptDetails.vendor_name,
            created_by: user?.id
          })
          .select()
          .single()

        if (dbError) throw dbError
        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchReceipts()
      setSaveStatus({ type: 'success', message: '영수증이 업로드되었습니다.' })
      
      // Reset form
      setReceiptDetails({
        vendor_name: '',
        amount: '',
        receipt_date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      })
      delete (window as any).__pendingReceiptFiles
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error uploading receipts:', error)
      setSaveStatus({ type: 'error', message: '영수증 업로드에 실패했습니다.' })
    } finally {
      setUploading(false)
      // Reset file input
      const input = document.getElementById('receipt-upload') as HTMLInputElement
      if (input) input.value = ''
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

  const handleDownload = async (receipt: ReceiptFile) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(receipt.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = receipt.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading receipt:', error)
      setSaveStatus({ type: 'error', message: '영수증 다운로드에 실패했습니다.' })
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

  const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)

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
          영수증정보
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {receipts.length}개
          </span>
        </h3>
        {receipts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">
              총 {totalAmount.toLocaleString()}원
            </span>
          </div>
        )}
      </div>

      {/* Upload Section */}
      {isEditing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <input
            type="file"
            id="receipt-upload"
            className="hidden"
            onChange={handleReceiptUpload}
            accept="image/*,.pdf"
            multiple
            disabled={uploading}
          />
          <label
            htmlFor="receipt-upload"
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
                영수증 선택
              </>
            )}
          </label>
          <p className="mt-2 text-sm text-gray-600">
            이미지 파일 또는 PDF 파일을 업로드할 수 있습니다.
          </p>
        </div>
      )}

      {/* Receipts List */}
      {receipts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">등록된 영수증이 없습니다.</p>
          {isEditing && (
            <p className="text-sm text-gray-500">위의 "영수증 선택" 버튼을 클릭하여 영수증을 업로드하세요.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업체명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs" title={receipt.filename}>
                          {receipt.filename}
                        </p>
                        {receipt.description && (
                          <p className="text-xs text-gray-500">{receipt.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {receipt.vendor_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {receipt.amount ? `${receipt.amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {receipt.receipt_date 
                      ? format(new Date(receipt.receipt_date), 'yyyy-MM-dd', { locale: ko })
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(receipt)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                        title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => handleDelete(receipt)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Detail Modal for Upload */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">영수증 정보 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체명
                </label>
                <input
                  type="text"
                  value={receiptDetails.vendor_name}
                  onChange={(e) => setReceiptDetails(prev => ({ ...prev, vendor_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="업체명 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  금액
                </label>
                <input
                  type="number"
                  value={receiptDetails.amount}
                  onChange={(e) => setReceiptDetails(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="금액 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜
                </label>
                <input
                  type="date"
                  value={receiptDetails.receipt_date}
                  onChange={(e) => setReceiptDetails(prev => ({ ...prev, receipt_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={receiptDetails.description}
                  onChange={(e) => setReceiptDetails(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="설명 입력 (선택사항)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUploadWithDetails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                업로드
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  delete (window as any).__pendingReceiptFiles
                  const input = document.getElementById('receipt-upload') as HTMLInputElement
                  if (input) input.value = ''
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            
            {selectedReceipt.mime_type.startsWith('image/') ? (
              <img
                src={getReceiptUrl(selectedReceipt)}
                alt={selectedReceipt.filename}
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <iframe
                src={getReceiptUrl(selectedReceipt)}
                className="w-full h-[80vh]"
                title={selectedReceipt.filename}
              />
            )}
            
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">파일명</p>
                  <p className="font-medium">{selectedReceipt.filename}</p>
                </div>
                <div>
                  <p className="text-gray-500">업체명</p>
                  <p className="font-medium">{selectedReceipt.vendor_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">금액</p>
                  <p className="font-medium">
                    {selectedReceipt.amount ? `${selectedReceipt.amount.toLocaleString()}원` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">날짜</p>
                  <p className="font-medium">
                    {selectedReceipt.receipt_date 
                      ? format(new Date(selectedReceipt.receipt_date), 'yyyy-MM-dd', { locale: ko })
                      : '-'}
                  </p>
                </div>
              </div>
              {selectedReceipt.description && (
                <div className="mt-4 text-sm">
                  <p className="text-gray-500">설명</p>
                  <p className="font-medium">{selectedReceipt.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}