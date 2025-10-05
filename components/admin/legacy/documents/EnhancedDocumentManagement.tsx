'use client'

import { getSessionUser } from '@/lib/supabase/session'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

// Define document category types based on requirements
type DocumentCategoryType =
  | 'my-documents' // 내문서함
  | 'shared-documents' // 공유문서함
  | 'markup-documents' // 도면마킹
  | 'required-documents' // 필수 제출 서류
  | 'invoice-documents' // 기성청구함
  | 'photo-grid' // 사진대지

interface Document {
  id: string
  title: string
  description?: string
  category: DocumentCategoryType
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  site_id?: string
  site?: {
    id: string
    name: string
  }
  created_by: string
  creator?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  shared_with?: string[] // User IDs or role names
  version?: number
  parent_id?: string // For version management
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  updated_at: string
  metadata?: {
    contract_stage?: string // For invoice documents (진행전/진행중/완료)
    submitted_by?: string // For required documents
    linked_report_id?: string // For photo-grid
    partner_id?: string // For invoice documents
  }
}

interface CategoryStats {
  total: number
  recent: number
  size: string
  pending?: number // For required documents
  active?: number // For contracts in invoice documents
}

// Document category configuration based on requirements
const documentCategories = [
  {
    id: 'my-documents',
    label: '내문서함',
    icon: FolderOpen,
    description: '사용자 본인 용도의 문서함',
    color: 'blue',
    features: ['upload', 'download', 'preview', 'delete'],
    adminFeatures: ['viewAll', 'manageAll'],
  },
  {
    id: 'shared-documents',
    label: '공유문서함',
    icon: Share2,
    description: '현장과 맵핑된 공유 문서',
    color: 'green',
    features: ['upload', 'download', 'preview', 'share', 'siteMapping'],
    adminFeatures: ['viewAll', 'manageAll', 'changePermissions'],
  },
  {
    id: 'markup-documents',
    label: '도면마킹',
    icon: Edit3,
    description: '현장 정보와 연동된 도면 파일',
    color: 'purple',
    features: ['upload', 'download', 'preview', 'version', 'history'],
    adminFeatures: ['viewAll', 'manageAll', 'versionControl'],
  },
  {
    id: 'required-documents',
    label: '필수 제출 서류',
    icon: FileCheck,
    description: '사용자가 본사에 제출하는 서류',
    color: 'orange',
    features: ['upload', 'download', 'preview', 'status'],
    adminFeatures: ['viewAll', 'directUpload', 'statusManagement', 'userTracking'],
  },
  {
    id: 'invoice-documents',
    label: '기성청구함',
    icon: FileText,
    description: '현장 및 파트너사 계약 서류',
    color: 'red',
    features: ['upload', 'download', 'preview', 'contractStage'],
    adminFeatures: ['viewAll', 'manageAll', 'stageControl'],
    restrictedAccess: true, // Only partner and admin can access
  },
  {
    id: 'photo-grid',
    label: '사진대지',
    icon: Camera,
    description: '작업일지와 연동된 사진대지',
    color: 'indigo',
    features: ['upload', 'download', 'preview', 'reportLink'],
    adminFeatures: ['viewAll', 'manageAll', 'linkReports'],
  },
]

export default function EnhancedDocumentManagement() {
  const [activeTab, setActiveTab] = useState<DocumentCategoryType>('my-documents')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, CategoryStats>>({})
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [currentUser, setCurrentUser] = useState<unknown>(null)

  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    loadCurrentUser()
    loadSites()
    loadUsers()
    loadPartners()
    loadAllStats()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [activeTab, selectedSite, searchQuery, filterStatus, filterUser])

  const loadCurrentUser = async () => {
    try {
      const user = await getSessionUser(supabase)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error('Error retrieving session for current user:', error)
    }
  }

  const loadSites = async () => {
    const { data } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .order('name')

    if (data) setSites(data)
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')

    if (data) setUsers(data)
  }

  const loadPartners = async () => {
    // Load partner companies
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, organization_id')
      .eq('role', 'partner')
      .order('full_name')

    if (data) setPartners(data)
  }

  const loadAllStats = async () => {
    // Load statistics for all categories
    const categoryStats: Record<string, CategoryStats> = {}

    for (const category of documentCategories) {
      categoryStats[category.id] = await loadCategoryStats(category.id as DocumentCategoryType)
    }

    setStats(categoryStats)
  }

  const loadCategoryStats = async (category: DocumentCategoryType): Promise<CategoryStats> => {
    // Mock stats - replace with actual database queries
    const mockStats: Record<DocumentCategoryType, CategoryStats> = {
      'my-documents': { total: 45, recent: 5, size: '256 MB' },
      'shared-documents': { total: 128, recent: 12, size: '1.2 GB' },
      'markup-documents': { total: 32, recent: 3, size: '450 MB' },
      'required-documents': { total: 89, recent: 8, size: '320 MB', pending: 15 },
      'invoice-documents': { total: 56, recent: 6, size: '180 MB', active: 8 },
      'photo-grid': { total: 234, recent: 24, size: '2.8 GB' },
    }

    return mockStats[category] || { total: 0, recent: 0, size: '0 MB' }
  }

  const loadDocuments = async () => {
    setLoading(true)

    // Mock data for demonstration
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: '강남현장 설계도면_v2.pdf',
        description: '강남 A현장 최종 설계도면',
        category: activeTab,
        file_url: '/documents/blueprint1.pdf',
        file_name: 'blueprint1.pdf',
        file_size: 2548576,
        file_type: 'application/pdf',
        site_id: '1',
        site: { id: '1', name: '강남 A현장' },
        created_by: 'user1',
        creator: {
          id: 'user1',
          full_name: '김관리',
          email: 'manager@inopnc.com',
          role: 'site_manager',
        },
        shared_with: ['worker', 'site_manager'],
        version: 2,
        status: 'active',
        created_at: '2025-08-20T10:00:00Z',
        updated_at: '2025-08-22T14:30:00Z',
      },
      {
        id: '2',
        title: '안전관리계획서.docx',
        description: '2025년 안전관리 계획서',
        category: activeTab,
        file_url: '/documents/safety.docx',
        file_name: 'safety.docx',
        file_size: 1024000,
        file_type: 'application/docx',
        site_id: '2',
        site: { id: '2', name: '서초 B현장' },
        created_by: 'user2',
        creator: {
          id: 'user2',
          full_name: '박안전',
          email: 'safety@inopnc.com',
          role: 'admin',
        },
        status: 'active',
        created_at: '2025-08-19T09:00:00Z',
        updated_at: '2025-08-19T09:00:00Z',
      },
      {
        id: '3',
        title: '사업자등록증_홍길동.pdf',
        description: '홍길동 작업자 사업자등록증',
        category: activeTab,
        file_url: '/documents/business_reg.pdf',
        file_name: 'business_reg.pdf',
        file_size: 512000,
        file_type: 'application/pdf',
        created_by: 'user3',
        creator: {
          id: 'user3',
          full_name: '홍길동',
          email: 'hong@example.com',
          role: 'worker',
        },
        status: 'active',
        created_at: '2025-08-18T11:00:00Z',
        updated_at: '2025-08-18T11:00:00Z',
        metadata: {
          submitted_by: 'user3',
        },
      },
    ]

    // Filter documents based on search and filters
    let filteredDocs = mockDocuments

    if (searchQuery) {
      filteredDocs = filteredDocs.filter(
        doc =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedSite !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.site_id === selectedSite)
    }

    if (filterUser !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.created_by === filterUser)
    }

    setDocuments(filteredDocs)
    setLoading(false)
  }

  const handleFileUpload = async (files: FileList) => {
    // Handle file upload logic
    console.log('Uploading files:', files)
    setShowUploadModal(false)
    loadDocuments()
  }

  const handleDelete = async (docId: string) => {
    const ok = await confirm({
      title: '문서 삭제',
      description: '정말로 이 문서를 삭제하시겠습니까?',
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (ok) {
      console.log('Deleting document:', docId)
      loadDocuments()
      toast({ variant: 'success', title: '삭제 완료' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return
    const ok = await confirm({
      title: '일괄 삭제',
      description: `선택한 ${selectedDocuments.length}개 문서를 삭제하시겠습니까?`,
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (ok) {
      console.log('Bulk deleting:', selectedDocuments)
      setSelectedDocuments([])
      loadDocuments()
      toast({ variant: 'success', title: '삭제 완료', description: '선택 문서가 삭제되었습니다.' })
    }
  }

  const handleShare = (doc: Document) => {
    setSelectedDocument(doc)
    setShowShareModal(true)
  }

  const handleViewHistory = (doc: Document) => {
    setSelectedDocument(doc)
    setShowHistoryModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return FileImage
    if (fileType.includes('pdf')) return FileText
    return File
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const activeTabConfig = documentCategories.find(tab => tab.id === activeTab)!
  const ActiveIcon = activeTabConfig.icon

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">문서함 관리</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              전체 문서 관리 및 권한 설정
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedDocuments.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                삭제 ({selectedDocuments.length})
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              문서 업로드
            </button>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">전체 문서</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Object.values(stats).reduce((sum, s) => sum + s.total, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">최근 7일</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Object.values(stats).reduce((sum, s) => sum + s.recent, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">대기중 서류</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats['required-documents']?.pending || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">진행중 계약</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats['invoice-documents']?.active || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-2 md:gap-0 md:space-x-8" aria-label="Tabs">
            {documentCategories.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const tabStats = stats[tab.id]

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DocumentCategoryType)}
                  className={`
                    flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tabStats && (
                    <span
                      className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                        isActive
                          ? `bg-${tab.color}-100 text-${tab.color}-700 dark:bg-${tab.color}-900 dark:text-${tab.color}-300`
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {tabStats.total}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Description and Features */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ActiveIcon className={`h-6 w-6 text-${activeTabConfig.color}-500`} />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {activeTabConfig.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTabConfig.description}
                </p>
              </div>
            </div>
            {activeTabConfig.restrictedAccess && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full dark:bg-red-900 dark:text-red-300">
                제한된 접근
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="문서명, 설명, 등록자로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">모든 현장</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>

          {activeTab === 'required-documents' && (
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">모든 제출자</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'invoice-documents' && (
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">모든 상태</option>
              <option value="pending">진행 전</option>
              <option value="active">진행 중</option>
              <option value="completed">완료</option>
            </select>
          )}

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
            <Filter className="h-4 w-4" />
            고급 필터
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">문서를 불러오는 중...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <ActiveIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTabConfig.description}에 문서가 없습니다.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              문서 추가
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedDocuments(documents.map(d => d.id))
                        } else {
                          setSelectedDocuments([])
                        }
                      }}
                      checked={
                        selectedDocuments.length === documents.length && documents.length > 0
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    문서명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    현장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    등록자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    크기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    수정일
                  </th>
                  {activeTab === 'shared-documents' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      공유
                    </th>
                  )}
                  {activeTab === 'markup-documents' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      버전
                    </th>
                  )}
                  {activeTab === 'invoice-documents' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      계약단계
                    </th>
                  )}
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map(doc => {
                  const FileIcon = getFileIcon(doc.file_type)
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileIcon className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </div>
                            {doc.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {doc.site?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {doc.creator?.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {doc.creator?.role === 'admin'
                            ? '관리자'
                            : doc.creator?.role === 'site_manager'
                              ? '현장관리자'
                              : doc.creator?.role === 'worker'
                                ? '작업자'
                                : doc.creator?.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(doc.updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </td>
                      {activeTab === 'shared-documents' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.shared_with && doc.shared_with.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {doc.shared_with.length}명
                              </span>
                            </div>
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </td>
                      )}
                      {activeTab === 'markup-documents' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            v{doc.version || 1}
                          </span>
                        </td>
                      )}
                      {activeTab === 'invoice-documents' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              doc.metadata?.contract_stage === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : doc.metadata?.contract_stage === 'active'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                            }`}
                          >
                            {doc.metadata?.contract_stage === 'completed'
                              ? '완료'
                              : doc.metadata?.contract_stage === 'active'
                                ? '진행중'
                                : '진행전'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDocument(doc)
                              setShowPreviewModal(true)
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {activeTab === 'shared-documents' && (
                            <button
                              onClick={() => handleShare(doc)}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="공유"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          )}
                          {activeTab === 'markup-documents' && (
                            <button
                              onClick={() => handleViewHistory(doc)}
                              className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                              title="이력"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">문서 업로드</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  문서 종류
                </label>
                <select
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value as DocumentCategoryType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {documentCategories.map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  현장 선택
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">현장 선택...</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'invoice-documents' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    파트너사 선택
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">파트너사 선택...</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'required-documents' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제출자 선택
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">제출자 선택...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  파일 선택
                </label>
                <input
                  type="file"
                  multiple
                  onChange={e => e.target.files && handleFileUpload(e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                업로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">문서 미리보기</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedDocument.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDocument.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">현장</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDocument.site?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">등록자</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDocument.creator?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">파일 크기</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatFileSize(selectedDocument.file_size)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">수정일</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(selectedDocument.updated_at), 'yyyy-MM-dd HH:mm', {
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>

              {/* File preview area */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">파일 미리보기 영역</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => window.open(selectedDocument.file_url, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="inline-block h-4 w-4 mr-2" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">문서 공유</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  공유 대상 선택
                </label>
                <select
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <optgroup label="역할">
                    <option value="worker">작업자 전체</option>
                    <option value="site_manager">현장관리자 전체</option>
                    <option value="partner">파트너사 전체</option>
                  </optgroup>
                  <optgroup label="개별 사용자">
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  권한 설정
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">보기</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">다운로드</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">수정</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                공유
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">문서 이력</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedDocument.title}
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        버전 2.0 업로드
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2025-08-22 14:30</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      김관리 - 최종 도면 수정본 업로드
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        공유 설정 변경
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2025-08-21 10:15</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      박안전 - 현장관리자 그룹에 공유
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        최초 업로드
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2025-08-20 10:00</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      김관리 - 초기 도면 업로드
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const { confirm } = useConfirm()
const { toast } = useToast()
