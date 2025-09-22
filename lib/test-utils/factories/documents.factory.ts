import type { 
  DocumentFile, 
  DocumentType, 
  DailyReport, 
  ApprovalDocument,
  MaterialManagementDocument,
  MarkupDocument
} from '@/types'

// Document type color mappings (from the UI implementation)
export const FILE_TYPE_COLORS = {
  'markup-document': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: '도면'
  },
  'pdf': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'PDF'
  },
  'word': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'DOC'
  },
  'excel': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'XLS'
  },
  'image': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'IMG'
  },
  'file': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    label: 'FILE'
  }
} as const

// Get file type info for card UI
export function getFileTypeInfo(mimeType: string | null | undefined, documentType?: string) {
  if (documentType === 'markup-document') return FILE_TYPE_COLORS['markup-document']
  if (mimeType?.includes('pdf')) return FILE_TYPE_COLORS['pdf']
  if (mimeType?.includes('word') || mimeType?.includes('wordprocessingml')) return FILE_TYPE_COLORS['word']
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheetml')) return FILE_TYPE_COLORS['excel']
  if (mimeType?.startsWith('image/')) return FILE_TYPE_COLORS['image']
  return FILE_TYPE_COLORS['file']
}

// Create mock document file with card UI fields
export function createMockDocumentFile(
  overrides?: Partial<DocumentFile>
): DocumentFile & { cardUI: ReturnType<typeof getFileTypeInfo> } {
  const mimeType = overrides?.mime_type || faker.helpers.arrayElement([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ])
  
  const fileName = overrides?.file_name || faker.system.fileName({ extensionCount: 1 })
  const fileSize = overrides?.file_size || faker.number.int({ min: 100000, max: 10000000 })
  
  const baseDocument: DocumentFile = {
    id: faker.string.uuid(),
    title: overrides?.title || faker.helpers.arrayElement([
      '2024년 8월 작업일지',
      '안전점검표_' + faker.date.recent().toLocaleDateString('ko-KR'),
      '시공계획서_최종',
      '현장사진_' + faker.lorem.words(2),
      '자재입고현황_' + faker.date.month()
    ]),
    description: faker.lorem.sentence(),
    file_url: `/documents/${faker.string.alphanumeric(12)}/${fileName}`,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    document_type: faker.helpers.arrayElement<DocumentType>(['personal', 'shared', 'blueprint', 'report', 'certificate', 'other']),
    folder_path: faker.helpers.arrayElement(['/작업일지', '/안전관리', '/시공도면', '/자재관리', '/']),
    owner_id: faker.string.uuid(),
    is_public: faker.datatype.boolean({ probability: 0.3 }),
    site_id: faker.string.uuid(),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: faker.date.recent({ days: 7 }).toISOString(),
    ...overrides
  }

  return {
    ...baseDocument,
    cardUI: getFileTypeInfo(baseDocument.mime_type, baseDocument.document_type || undefined)
  }
}

// Create mock daily report
export function createMockDailyReport(
  overrides?: Partial<DailyReport>
): DailyReport {
  const workDate = overrides?.work_date || faker.date.recent({ days: 7 }).toISOString().split('T')[0]
  
  return {
    id: faker.string.uuid(),
    site_id: faker.string.uuid(),
    work_date: workDate,
    member_name: faker.helpers.arrayElement(['슬라브', '거더', '기둥', '벽체', '기타']),
    process_type: faker.helpers.arrayElement(['균열보수', '면처리', '마감작업', '철근조립', '콘크리트타설']),
    total_workers: faker.number.int({ min: 5, max: 30 }),
    npc1000_incoming: faker.number.int({ min: 0, max: 1000 }),
    npc1000_used: faker.number.int({ min: 0, max: 500 }),
    npc1000_remaining: faker.number.int({ min: 0, max: 500 }),
    issues: faker.datatype.boolean({ probability: 0.3 }) 
      ? faker.lorem.sentence() 
      : null,
    request_from_hq: faker.datatype.boolean({ probability: 0.2 })
      ? faker.lorem.sentence()
      : null,
    notes: faker.datatype.boolean({ probability: 0.4 })
      ? faker.lorem.sentences(2)
      : null,
    receipt_total_amount: faker.number.int({ min: 0, max: 5000000 }),
    status: faker.helpers.arrayElement<'draft' | 'submitted'>(['draft', 'submitted']),
    submitted_at: faker.datatype.boolean({ probability: 0.7 })
      ? faker.date.recent({ days: 1 }).toISOString()
      : null,
    submitted_by: faker.string.uuid(),
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    created_by: faker.string.uuid(),
    updated_at: faker.date.recent({ days: 1 }).toISOString(),
    ...overrides
  }
}

// Create mock approval document
export function createMockApprovalDocument(
  overrides?: Partial<ApprovalDocument>
): ApprovalDocument {
  return {
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement([
      '시공계획서 승인요청',
      '자재구매 승인요청',
      '설계변경 승인요청',
      '추가공사 승인요청'
    ]),
    description: faker.lorem.paragraph(),
    document_type: 'approval',
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'revision_requested']),
    approver_id: faker.string.uuid(),
    approver_name: faker.person.fullName(),
    requester_id: faker.string.uuid(),
    requester_name: faker.person.fullName(),
    requested_at: faker.date.recent({ days: 7 }).toISOString(),
    approved_at: faker.datatype.boolean({ probability: 0.5 })
      ? faker.date.recent({ days: 1 }).toISOString()
      : null,
    rejection_reason: null,
    attached_files: faker.helpers.multiple(
      () => createMockDocumentFile({ document_type: 'shared' }), 
      { count: faker.number.int({ min: 0, max: 3 }) }
    ),
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    updated_at: faker.date.recent({ days: 1 }).toISOString(),
    ...overrides
  }
}

// Create mock material management document
export function createMockMaterialDocument(
  overrides?: Partial<MaterialManagementDocument>
): MaterialManagementDocument {
  const materialType = faker.helpers.arrayElement(['NPC-1000', '철근', '시멘트', '골재', '기타자재'])
  
  return {
    id: faker.string.uuid(),
    title: `${materialType} 입출고 현황_${faker.date.recent().toLocaleDateString('ko-KR')}`,
    document_type: 'material',
    material_type: materialType,
    transaction_type: faker.helpers.arrayElement(['incoming', 'outgoing', 'inventory']),
    quantity: faker.number.int({ min: 10, max: 1000 }),
    unit: faker.helpers.arrayElement(['kg', 'ton', 'm³', 'ea']),
    supplier: faker.company.name() + ' 건설자재',
    price_per_unit: faker.number.int({ min: 1000, max: 100000 }),
    total_price: faker.number.int({ min: 100000, max: 10000000 }),
    transaction_date: faker.date.recent({ days: 30 }).toISOString(),
    warehouse_location: faker.helpers.arrayElement(['A동 창고', 'B동 창고', '야적장', '본사 창고']),
    notes: faker.datatype.boolean({ probability: 0.3 })
      ? faker.lorem.sentence()
      : null,
    created_by: faker.string.uuid(),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: faker.date.recent({ days: 1 }).toISOString(),
    ...overrides
  }
}

// Create mock markup document (도면 마킹)
export function createMockMarkupDocument(
  overrides?: Partial<MarkupDocument>
): MarkupDocument {
  return {
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement([
      '1층 평면도 마킹',
      '구조도면 검토사항',
      '전기배선도 수정사항',
      '배관도면 마킹'
    ]),
    description: faker.lorem.sentence(),
    original_blueprint_url: `/blueprints/${faker.string.alphanumeric(12)}.pdf`,
    original_blueprint_filename: `blueprint_${faker.string.alphanumeric(8)}.pdf`,
    markup_data: faker.helpers.multiple(
      () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['box', 'text', 'drawing']),
        x: faker.number.int({ min: 0, max: 1000 }),
        y: faker.number.int({ min: 0, max: 800 }),
        width: faker.number.int({ min: 50, max: 200 }),
        height: faker.number.int({ min: 30, max: 150 }),
        color: faker.helpers.arrayElement(['red', 'blue', 'green']),
        text: faker.datatype.boolean({ probability: 0.5 }) 
          ? faker.lorem.words(3)
          : undefined
      }),
      { count: faker.number.int({ min: 1, max: 10 }) }
    ),
    preview_image_url: `/previews/${faker.string.alphanumeric(12)}.png`,
    location: faker.helpers.arrayElement<'personal' | 'shared'>(['personal', 'shared']),
    created_by: faker.string.uuid(),
    created_at: faker.date.recent({ days: 14 }).toISOString(),
    updated_at: faker.date.recent({ days: 1 }).toISOString(),
    site_id: faker.string.uuid(),
    is_deleted: false,
    file_size: faker.number.int({ min: 500000, max: 5000000 }),
    markup_count: faker.number.int({ min: 1, max: 20 }),
    ...overrides
  }
}

// Create a unified document card representation
export function createMockDocumentCard(options?: {
  type?: 'daily_report' | 'approval' | 'material' | 'markup' | 'file'
  location?: 'personal' | 'shared'
}) {
  const { 
    type = faker.helpers.arrayElement(['daily_report', 'approval', 'material', 'markup', 'file']), 
    location = faker.helpers.arrayElement(['personal', 'shared'])
  } = options || {}
  
  let document: unknown
  let cardData: {
    id: string
    title: string
    description?: string
    category: string
    fileType: string
    fileTypeColor: typeof FILE_TYPE_COLORS[keyof typeof FILE_TYPE_COLORS]
    size: number
    createdAt: string
    updatedAt: string
    createdBy: string
    location: 'personal' | 'shared'
    icon?: string
    statusBadge?: {
      label: string
      color: string
    }
    previewUrl?: string
    url?: string
  }

  switch (type) {
    case 'daily_report':
      const report = createMockDailyReport()
      cardData = {
        id: report.id,
        title: `작업일지_${report.work_date}`,
        description: `${report.member_name} - ${report.process_type}`,
        category: 'work-reports',
        fileType: 'report',
        fileTypeColor: FILE_TYPE_COLORS['pdf'],
        size: faker.number.int({ min: 1000000, max: 3000000 }),
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        createdBy: '작업자',
        location,
        statusBadge: report.status === 'submitted' 
          ? { label: '제출완료', color: 'bg-green-100 text-green-700' }
          : { label: '작성중', color: 'bg-yellow-100 text-yellow-700' }
      }
      break

    case 'approval':
      const approval = createMockApprovalDocument()
      cardData = {
        id: approval.id,
        title: approval.title,
        description: approval.description,
        category: 'approval-docs',
        fileType: 'approval',
        fileTypeColor: FILE_TYPE_COLORS['word'],
        size: faker.number.int({ min: 500000, max: 2000000 }),
        createdAt: approval.created_at,
        updatedAt: approval.updated_at,
        createdBy: approval.requester_name,
        location,
        statusBadge: {
          label: approval.status === 'approved' ? '승인' : 
                 approval.status === 'rejected' ? '반려' :
                 approval.status === 'revision_requested' ? '수정요청' : '대기중',
          color: approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                 approval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                 approval.status === 'revision_requested' ? 'bg-orange-100 text-orange-700' :
                 'bg-gray-100 text-gray-700'
        }
      }
      break

    case 'material':
      const material = createMockMaterialDocument()
      cardData = {
        id: material.id,
        title: material.title,
        description: `${material.quantity}${material.unit} - ${material.supplier}`,
        category: 'material-docs',
        fileType: 'material',
        fileTypeColor: FILE_TYPE_COLORS['excel'],
        size: faker.number.int({ min: 300000, max: 1500000 }),
        createdAt: material.created_at,
        updatedAt: material.updated_at,
        createdBy: '자재관리자',
        location,
        icon: material.transaction_type === 'incoming' ? '📥' :
              material.transaction_type === 'outgoing' ? '📤' : '📊'
      }
      break

    case 'markup':
      const markup = createMockMarkupDocument({ location })
      cardData = {
        id: markup.id,
        title: markup.title,
        description: markup.description || undefined,
        category: 'construction-docs',
        fileType: 'markup',
        fileTypeColor: FILE_TYPE_COLORS['markup-document'],
        size: markup.file_size,
        createdAt: markup.created_at,
        updatedAt: markup.updated_at,
        createdBy: '도면관리자',
        location,
        previewUrl: markup.preview_image_url || undefined,
        url: `/dashboard/markup?open=${markup.id}`,
        statusBadge: {
          label: `마킹 ${markup.markup_count}개`,
          color: 'bg-purple-100 text-purple-700'
        }
      }
      break

    case 'file':
    default:
      const file = createMockDocumentFile({ document_type: location })
      cardData = {
        id: file.id,
        title: file.title,
        description: file.description || undefined,
        category: 'general-docs',
        fileType: file.cardUI.label.toLowerCase(),
        fileTypeColor: file.cardUI,
        size: file.file_size || 1000000,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        createdBy: '업로더',
        location,
        url: file.file_url
      }
      break
  }

  return cardData
}

// Create a list of mixed document cards for unified view
export function createMockDocumentCardList(options?: {
  count?: number
  location?: 'personal' | 'shared'
  types?: Array<'daily_report' | 'approval' | 'material' | 'markup' | 'file'>
}) {
  const { 
    count = faker.number.int({ min: 10, max: 30 }), 
    location = 'personal',
    types = ['daily_report', 'approval', 'material', 'markup', 'file']
  } = options || {}

  return faker.helpers.multiple(
    () => createMockDocumentCard({ 
      type: faker.helpers.arrayElement(types),
      location 
    }),
    { count }
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Type guards for document types
export function isDailyReport(doc: unknown): doc is DailyReport {
  return doc !== null && doc !== undefined && 'work_date' in doc && 'member_name' in doc && 'process_type' in doc
}

export function isApprovalDocument(doc: unknown): doc is ApprovalDocument {
  return doc && doc.document_type === 'approval' && 'approver_id' in doc
}

export function isMaterialDocument(doc: unknown): doc is MaterialManagementDocument {
  return doc && doc.document_type === 'material' && 'material_type' in doc
}

export function isMarkupDocument(doc: unknown): doc is MarkupDocument {
  return doc && 'original_blueprint_url' in doc && 'markup_data' in doc
}