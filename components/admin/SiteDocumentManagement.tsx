'use client'

import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types'
import DocumentUploadZone from './DocumentUploadZone'
import { FileText, Download, Eye, Trash2, Upload, Settings, ExternalLink, Search, Filter, CheckSquare, Square, X, AlertCircle, Share2, FileImage, Receipt, Building2, Users, Calendar, RefreshCw, Edit3, PenTool, DollarSign, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 공유문서함 문서
interface SharedDocument {
  id: string
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  location: 'personal' | 'shared'
  created_at: string
  updated_at: string
  created_by: string
  site_id?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  sites?: {
    id: string
    name: string
    address: string
  }
}

// 도면마킹문서함 문서
interface MarkupDocument {
  id: string
  title: string
  description?: string
  original_blueprint_url: string
  original_blueprint_filename: string
  markup_data: unknown[]
  preview_image_url?: string
  location: 'personal' | 'shared'
  markup_count: number
  created_at: string
  updated_at: string
  created_by: string
  site_id?: string
  version_number?: number
  is_latest_version?: boolean
  change_summary?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  sites?: {
    id: string
    name: string
    address: string
  }
}

// 기성청구함 문서
interface InvoiceDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  contract_phase: 'pre_contract' | 'in_progress' | 'completed'
  amount?: number
  created_at: string
  updated_at: string
  created_by: string
  site_id?: string
  partner_company_id?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  sites?: {
    id: string
    name: string
    address: string
  }
  organizations?: {
    id: string
    name: string
    business_registration_number: string
  }
}

type SiteDocument = SharedDocument | MarkupDocument | InvoiceDocument

interface Site {
  id: string
  name: string
  address: string
  status: string
}

interface SiteDocumentManagementProps {
  siteId: string  // Required site ID since we're on site detail page
  siteName?: string  // Optional site name for display
}

export default function SiteDocumentManagement({ siteId, siteName }: SiteDocumentManagementProps) {
  const [activeTab, setActiveTab] = useState<'shared' | 'markup' | 'invoice'>('shared')
  const [documents, setDocuments] = useState<SiteDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [previewDocument, setPreviewDocument] = useState<SiteDocument | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const supabase = createClient()

  // Load documents for the site from different tables based on tab
  const loadDocuments = useCallback(async () => {
    if (!siteId) return

    setLoading(true)
    setError(null)
    // Clear selections when loading new data
    setSelectedDocuments(new Set())
    setShowBulkActions(false)

    try {
      let data: SiteDocument[] = []

      switch (activeTab) {
        case 'shared':
          // 공유문서함에서 현장별 공유 문서 조회
          const { data: sharedDocs, error: sharedError } = await supabase
            .from('documents')
            .select(`
              *,
              profiles!documents_created_by_fkey(id, full_name, email),
              sites(id, name, address)
            `)
            .eq('location', 'shared')
            .eq('site_id', siteId)
            .order('created_at', { ascending: false })

          if (sharedError) throw sharedError
          data = sharedDocs || []
          break

        case 'markup':
          // 도면마킹문서함에서 현장별 마킹 문서 조회
          const { data: markupDocs, error: markupError } = await supabase
            .from('markup_documents')
            .select(`
              *,
              profiles!markup_documents_created_by_fkey(id, full_name, email),
              sites(id, name, address)
            `)
            .eq('is_deleted', false)
            .eq('site_id', siteId)
            .order('updated_at', { ascending: false })

          if (markupError) throw markupError
          data = markupDocs || []
          break

        case 'invoice':
          // 기성청구함에서 현장별 기성청구 문서 조회
          const { data: invoiceDocs, error: invoiceError } = await supabase
            .from('documents')
            .select(`
              *,
              profiles!documents_created_by_fkey(id, full_name, email),
              sites(id, name, address),
              organizations!documents_partner_company_id_fkey(id, name, business_registration_number)
            `)
            .eq('document_category', 'invoice')
            .eq('site_id', siteId)
            .order('created_at', { ascending: false })

          if (invoiceError) throw invoiceError
          data = invoiceDocs || []
          break
      }

      setDocuments(data)
    } catch (err) {
      setError(`${activeTab === 'shared' ? '공유' : activeTab === 'markup' ? '도면마킹' : '기성청구'} 문서 목록을 불러오는데 실패했습니다.`)
      console.error('Document loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [siteId, activeTab, supabase])

  useEffect(() => {
    if (siteId) {
      loadDocuments()
    }
  }, [siteId, activeTab, loadDocuments])

  // Handle document activation toggle
  const handleToggleActive = async (documentId: string, currentActive: boolean) => {
    try {
      let error = null
      
      // Update based on document type from current tab
      if (activeTab === 'shared' || activeTab === 'invoice') {
        // For documents table
        const { error: docError } = await supabase
          .from('documents')
          .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
          .eq('id', documentId)
        error = docError
      } else if (activeTab === 'markup') {
        // For markup_documents table
        const { error: markupError } = await supabase
          .from('markup_documents')
          .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
          .eq('id', documentId)
        error = markupError
      }

      if (error) throw error

      await loadDocuments() // Refresh the list
    } catch (err) {
      alert('문서 상태 변경에 실패했습니다.')
      console.error('Document toggle error:', err)
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      let error = null
      
      // Delete based on document type from current tab
      if (activeTab === 'shared' || activeTab === 'invoice') {
        // For documents table
        const { error: docError } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId)
        error = docError
      } else if (activeTab === 'markup') {
        // For markup_documents table - soft delete
        const { error: markupError } = await supabase
          .from('markup_documents')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', documentId)
        error = markupError
      }

      if (error) throw error

      await loadDocuments() // Refresh the list
      alert('문서가 삭제되었습니다.')
    } catch (err) {
      alert('문서 삭제에 실패했습니다.')
      console.error('Document deletion error:', err)
    }
  }

  // Handle document preview
  const handlePreviewDocument = (document: SiteDocument) => {
    setPreviewDocument(document)
  }

  // Helper functions to safely access document properties
  const getDocumentDisplayName = (document: SiteDocument): string => {
    return document.title || 'Unknown Document'
  }

  const getDocumentFileName = (document: SiteDocument): string => {
    if ('file_name' in document) {
      return document.file_name
    } else if ('original_blueprint_filename' in document) {
      return document.original_blueprint_filename
    }
    return 'Unknown File'
  }

  const getDocumentFileSize = (document: SiteDocument): number => {
    if ('file_size' in document) {
      return document.file_size
    }
    return 0
  }

  const getDocumentFileUrl = (document: SiteDocument): string => {
    if ('file_path' in document) {
      return document.file_path
    } else if ('original_blueprint_url' in document) {
      return document.original_blueprint_url
    }
    return '#'
  }

  const getDocumentMimeType = (document: SiteDocument): string => {
    if ('mime_type' in document) {
      return document.mime_type
    }
    return 'application/octet-stream'
  }

  const getDocumentAuthor = (document: SiteDocument): string => {
    if ('profiles' in document && document.profiles) {
      return document.profiles.full_name
    }
    return 'Unknown Author'
  }

  const getDocumentNotes = (document: SiteDocument): string => {
    if ('description' in document && document.description) {
      return document.description
    }
    return ''
  }

  const isDocumentActive = (document: SiteDocument): boolean => {
    if ('is_public' in document) {
      return Boolean(document.is_public)
    } else if ('location' in document) {
      return document.location === 'shared'
    }
    return true // Default to active for invoice documents
  }

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewDocument(null)
  }

  // Handle document download
  const handleDownloadDocument = (document: SiteDocument) => {
    const link = window.document.createElement('a')
    
    // Get correct file URL based on document type
    let fileUrl: string
    let fileName: string
    
    if ('file_path' in document) {
      // SharedDocument or InvoiceDocument
      fileUrl = document.file_path
      fileName = document.file_name
    } else if ('original_blueprint_url' in document) {
      // MarkupDocument
      fileUrl = document.original_blueprint_url
      fileName = document.original_blueprint_filename
    } else {
      console.error('Unknown document type for download')
      return
    }
    
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  // Handle bulk selection
  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  // Handle select all
  const handleSelectAll = () => {
    const filteredDocs = getFilteredDocuments()
    const allIds = new Set(filteredDocs.map(doc => doc.id))
    const isAllSelected = filteredDocs.every(doc => selectedDocuments.has(doc.id))
    
    if (isAllSelected) {
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedDocuments(allIds)
      setShowBulkActions(true)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return
    
    const confirmMessage = `선택된 ${selectedDocuments.size}개 문서를 삭제하시겠습니까?`
    if (!confirm(confirmMessage)) return

    try {
      let error = null

      // Delete based on document type from current tab
      if (activeTab === 'shared' || activeTab === 'invoice') {
        // For documents table - hard delete
        const { error: docError } = await supabase
          .from('documents')
          .delete()
          .in('id', Array.from(selectedDocuments))
        error = docError
      } else if (activeTab === 'markup') {
        // For markup_documents table - soft delete
        const { error: markupError } = await supabase
          .from('markup_documents')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedDocuments))
        error = markupError
      }

      if (error) throw error

      await loadDocuments()
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
      alert(`${selectedDocuments.size}개 문서가 삭제되었습니다.`)
    } catch (err) {
      alert('문서 삭제에 실패했습니다.')
      console.error('Bulk delete error:', err)
    }
  }

  // Handle bulk activate/deactivate
  const handleBulkToggleActive = async (activate: boolean) => {
    if (selectedDocuments.size === 0) return

    try {
      let error = null

      // Update based on document type from current tab
      if (activeTab === 'shared' || activeTab === 'invoice') {
        // For documents table - toggle is_public status
        const { error: docError } = await supabase
          .from('documents')
          .update({ is_public: activate, updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedDocuments))
        error = docError
      } else if (activeTab === 'markup') {
        // For markup_documents table - toggle location between 'personal' and 'shared'
        const newLocation = activate ? 'shared' : 'personal'
        const { error: markupError } = await supabase
          .from('markup_documents')
          .update({ location: newLocation, updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedDocuments))
        error = markupError
      }

      if (error) throw error

      await loadDocuments()
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
      alert(`${selectedDocuments.size}개 문서가 ${activate ? '활성화' : '비활성화'}되었습니다.`)
    } catch (err) {
      alert('문서 상태 변경에 실패했습니다.')
      console.error('Bulk toggle error:', err)
    }
  }

  // Filter and search documents
  const getFilteredDocuments = () => {
    let filtered = documents

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploader?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  // Group documents by type for better display
  const groupedDocuments = getFilteredDocuments().reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = []
    }
    acc[doc.document_type].push(doc)
    return acc
  }, {} as Record<string, SiteDocument[]>)

  const documentTypeLabels = {
    ptw: 'PTW (작업허가서)',
    blueprint: '공사도면',
    other: '기타 문서',
    shared: '공유 문서',
    markup: '도면마킹 문서',
    invoice: '기성청구 문서'
  }

  const tabLabels = {
    shared: '공유문서함',
    markup: '도면마킹문서함',
    invoice: '기성청구함'
  }

  const tabIcons = {
    shared: <Share2 className="h-4 w-4" />,
    markup: <FileImage className="h-4 w-4" />,
    invoice: <Receipt className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {siteName ? `${siteName} 문서 관리` : '현장 문서 관리'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            현장의 공유문서, 도면마킹문서, 기성청구 문서를 관리합니다
          </p>
        </div>
        
        <button
          onClick={() => setUploadMode(!uploadMode)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMode ? '업로드 취소' : '문서 업로드'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {(['shared', 'markup', 'invoice'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tabIcons[tab]}
                {tabLabels[tab]}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Upload Zone */}
      {uploadMode && siteId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <DocumentUploadZone
            siteId={siteId}
            onUploadComplete={() => {
              loadDocuments()
              setUploadMode(false)
            }}
          />
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="문서명, 업로더, 메모로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedDocuments.size}개 문서 선택됨
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                일괄 활성화
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
              >
                일괄 비활성화
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                일괄 삭제
              </button>
              <button
                onClick={() => {
                  setSelectedDocuments(new Set())
                  setShowBulkActions(false)
                }}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      {siteId && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {/* Skeleton for each document type */}
              {['ptw', 'blueprint', 'other'].map((docType) => (
                <div key={docType} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-2 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                              <div className="space-y-1 mt-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-4">
                            {[1, 2, 3, 4].map((btn) => (
                              <div key={btn} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-red-200 dark:border-red-700 p-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : Object.keys(groupedDocuments).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  이 현장에 등록된 문서가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  상단의 &quot;문서 업로드&quot; 버튼을 클릭하여 문서를 추가하세요.
                </p>
              </div>
            </div>
          ) : (
            Object.entries(groupedDocuments).map(([docType, docs]) => (
              <div key={docType} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {documentTypeLabels[docType as keyof typeof documentTypeLabels] || docType}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {docs.length}개 문서 | 활성: {docs.filter(d => isDocumentActive(d)).length}개
                      </p>
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {getFilteredDocuments().every(doc => selectedDocuments.has(doc.id)) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      전체 선택
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {docs.map((document) => (
                    <div key={document.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSelectDocument(document.id)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {selectedDocuments.has(document.id) ? (
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <FileText className={`h-8 w-8 flex-shrink-0 mt-1 ${
                              isDocumentActive(document) ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium truncate ${
                                isDocumentActive(document)
                                  ? 'text-gray-900 dark:text-gray-100' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {getDocumentDisplayName(document)}
                              </p>
                              {isDocumentActive(document) && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full">
                                  활성
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <p>파일명: {getDocumentFileName(document)}</p>
                              {getDocumentFileSize(document) && (
                                <p>크기: {Math.round(getDocumentFileSize(document)! / 1024)} KB</p>
                              )}
                              <p>생성일: {new Date(document.created_at).toLocaleDateString('ko-KR')}</p>
                              <p>작성자: {getDocumentAuthor(document)}</p>
                              {document.description && (
                                <p className="text-gray-600 dark:text-gray-300">설명: {document.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handlePreviewDocument(document)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(document.id, isDocumentActive(document))}
                            className={`p-2 rounded transition-colors ${
                              isDocumentActive(document)
                                ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={isDocumentActive(document) ? '비활성화' : '활성화'}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteDocument(document.id, document.file_name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closePreviewModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {previewDocument.file_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {documentTypeLabels[previewDocument.document_type as keyof typeof documentTypeLabels]}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                  title="다운로드"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => window.open(previewDocument.file_url, '_blank')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="새 창에서 열기"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
                <button
                  onClick={closePreviewModal}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              {previewDocument.mime_type?.startsWith('image/') ? (
                <div className="p-4 flex items-center justify-center h-full">
                  <img
                    src={previewDocument.file_url}
                    alt={previewDocument.file_name}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'flex items-center justify-center h-64 text-gray-500'
                      errorDiv.innerHTML = '<div class="text-center"><p>이미지를 불러올 수 없습니다</p><p class="text-sm mt-2">파일이 손상되었거나 접근할 수 없습니다</p></div>'
                      target.parentNode?.appendChild(errorDiv)
                    }}
                  />
                </div>
              ) : previewDocument.mime_type === 'application/pdf' ? (
                <iframe
                  src={previewDocument.file_url}
                  className="w-full h-full border-0"
                  title={previewDocument.file_name}
                />
              ) : (
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      이 파일 형식은 미리보기를 지원하지 않습니다.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      다운로드 버튼을 클릭하여 파일을 다운로드하세요.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                {previewDocument.file_size && (
                  <p>파일 크기: {Math.round(previewDocument.file_size / 1024)} KB</p>
                )}
                <p>업로드 날짜: {new Date(previewDocument.created_at).toLocaleDateString('ko-KR')}</p>
                {previewDocument.uploader && (
                  <p>업로더: {previewDocument.uploader.full_name}</p>
                )}
                {previewDocument.notes && (
                  <p className="text-gray-600 dark:text-gray-300">메모: {previewDocument.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}