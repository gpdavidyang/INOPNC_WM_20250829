'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Upload, CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserDocumentsTabProps {
  userId: string
  userName: string
}

interface RequiredDocument {
  id: string
  document_name: string
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  file_url?: string
  file_name?: string
  submitted_at?: string
  reviewed_at?: string
  rejection_reason?: string
  is_required: boolean
}

export default function UserDocumentsTab({ userId, userName }: UserDocumentsTabProps) {
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'rejected'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchRequiredDocuments()
  }, [userId])

  const fetchRequiredDocuments = async () => {
    try {
      setLoading(true)
      
      // 필수 서류 목록과 사용자가 제출한 서류를 함께 조회
      const { data: documentsData, error: documentsError } = await supabase
        .from('unified_documents')
        .select(`
          id,
          document_name,
          file_name,
          file_url,
          status,
          uploaded_at,
          approved_at,
          rejection_reason
        `)
        .eq('uploaded_by', userId)
        .eq('document_type', 'required')
        .order('uploaded_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        // Mock data for demonstration
        setDocuments([
          {
            id: '1',
            document_name: '신분증 사본',
            status: 'approved',
            file_url: 'example.pdf',
            file_name: '신분증_김작업자.pdf',
            submitted_at: '2025-08-25T10:00:00Z',
            reviewed_at: '2025-08-26T14:30:00Z',
            is_required: true
          },
          {
            id: '2',
            document_name: '건강진단서',
            status: 'submitted',
            file_url: 'health_check.pdf',
            file_name: '건강진단서_김작업자.pdf',
            submitted_at: '2025-08-28T09:15:00Z',
            is_required: true
          },
          {
            id: '3',
            document_name: '안전교육 이수증',
            status: 'rejected',
            file_url: 'safety_cert.pdf',
            file_name: '안전교육증_김작업자.pdf',
            submitted_at: '2025-08-20T16:45:00Z',
            reviewed_at: '2025-08-21T11:20:00Z',
            rejection_reason: '만료된 증명서입니다. 최신 증명서를 제출해주세요.',
            is_required: true
          },
          {
            id: '4',
            document_name: '기본안전보건교육 수료증',
            status: 'pending',
            is_required: true
          },
          {
            id: '5',
            document_name: '자격증 사본',
            status: 'pending',
            is_required: false
          },
          {
            id: '6',
            document_name: '경력증명서',
            status: 'approved',
            file_url: 'career_cert.pdf',
            file_name: '경력증명서_김작업자.pdf',
            submitted_at: '2025-08-15T14:20:00Z',
            reviewed_at: '2025-08-16T10:00:00Z',
            is_required: false
          }
        ])
        return
      }

      const formattedDocuments = documentsData?.map(doc => ({
        id: doc.id,
        document_name: doc.document_name,
        status: doc.status as 'pending' | 'submitted' | 'approved' | 'rejected',
        file_url: doc.file_url,
        file_name: doc.file_name,
        submitted_at: doc.uploaded_at,
        reviewed_at: doc.approved_at,
        rejection_reason: doc.rejection_reason,
        is_required: true
      })) || []

      setDocuments(formattedDocuments)
    } catch (error) {
      console.error('Error fetching required documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: '미제출', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
      submitted: { text: '검토중', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      approved: { text: '승인', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      rejected: { text: '반려', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const requiredDocs = filteredDocuments.filter(doc => doc.is_required)
  const optionalDocs = filteredDocuments.filter(doc => !doc.is_required)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 서류</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">승인</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">검토중</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">미제출/반려</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'pending' || d.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="서류명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">전체 상태</option>
              <option value="pending">미제출</option>
              <option value="submitted">검토중</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            필수 제출 서류 ({requiredDocs.length}건)
          </h3>
        </div>

        {requiredDocs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              필수 제출 서류가 없습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    서류명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    파일명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    검토일
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {requiredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.file_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {doc.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.submitted_at 
                          ? format(new Date(doc.submitted_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.reviewed_at 
                          ? format(new Date(doc.reviewed_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.file_url && (
                          <>
                            <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30">
                              <Download className="h-3 w-3 mr-1" />
                              다운로드
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              선택 제출 서류 ({optionalDocs.length}건)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    서류명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    파일명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    검토일
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {optionalDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.file_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {doc.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.submitted_at 
                          ? format(new Date(doc.submitted_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.reviewed_at 
                          ? format(new Date(doc.reviewed_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.file_url && (
                          <>
                            <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30">
                              <Download className="h-3 w-3 mr-1" />
                              다운로드
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}