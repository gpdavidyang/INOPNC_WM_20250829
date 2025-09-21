import type { DocumentType } from '@/types/documents'
import type { ApprovalStatus } from '@/types'

export interface AdminSiteSummary {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'pending'
  address: string
  partnerCompanyId?: string
  managerName?: string
  startedAt?: string
}

export interface AdminPartnerCompany {
  id: string
  company_name: string
  company_type: 'npc' | 'subcontractor' | 'supplier'
  status: 'active' | 'inactive'
  contact_name: string
  contact_phone: string
  contact_email?: string
}

export interface AdminOrganizationSummary {
  id: string
  name: string
  type: 'general_contractor' | 'subcontractor' | 'supplier'
  address?: string
  contact_email?: string
  contact_phone?: string
  member_count?: number
  site_count?: number
  description?: string
}

export interface AdminOrganizationRelations {
  members: Array<{
    id: string
    name: string
    role: string
    email?: string
  }>
  sites: Array<{
    id: string
    name: string
    status: 'active' | 'inactive' | 'planning'
  }>
}

export interface AdminPartnerRelations {
  sites: Array<{
    id: string
    name: string
    status: 'active' | 'inactive' | 'planning'
  }>
  contacts: Array<{
    name: string
    phone?: string
    email?: string
    position?: string
  }>
}

export interface AdminDocumentSummary {
  id: string
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size?: number | null
  mime_type?: string | null
  document_type: DocumentType
  folder_path?: string | null
  owner_id?: string | null
  owner?: {
    full_name: string
    email?: string
  } | null
  site_id?: string | null
  site?: {
    name: string
  } | null
  is_public?: boolean | null
  created_at: string
  updated_at: string
  approval_status?: ApprovalStatus
  approval_requested_at?: string | null
  approval_comments?: string | null
  requested_by?: {
    full_name: string
    email: string
  } | null
}

export interface AdminAuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_name?: string
  user_name?: string
  status: 'success' | 'failed' | 'pending'
  created_at: string
}

export interface AdminAnalyticsOverview {
  totalWorkers: number
  activeSites: number
  totalDocuments: number
  monthlyExpense: number
  workersChange: number
  sitesChange: number
  documentsChange: number
  expenseChange: number
}

export interface AdminAnalyticsDataset {
  overview: AdminAnalyticsOverview
  attendanceTrend: Array<{ date: string; 출근: number; 결근: number; 지각: number }>
  sitePerformance: Array<{ name: string; 진행률: number; 작업자: number; 안전점수: number }>
  documentDistribution: Array<{ name: string; value: number; percentage: number }>
  materialUsageTrend: Array<{ date: string; 'NPC-1000': number; 기타자재: number }>
  salaryDistribution: Array<{ range: string; count: number }>
  safetyIncidents: Array<{ month: string; incidents: number; nearMiss: number }>
  productivityMetrics: Array<{ metric: string; current: number; target: number; unit: string }>
}

const buildAttendanceTrend = (): AdminAnalyticsDataset['attendanceTrend'] => {
  const today = new Date('2024-09-15T00:00:00Z')
  const result: AdminAnalyticsDataset['attendanceTrend'] = []

  for (let i = 89; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    result.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      출근: 210 + ((i % 7) - 3) * 4,
      결근: 8 + (i % 4),
      지각: 5 + (i % 3),
    })
  }

  return result
}

const buildMaterialUsageTrend = (): AdminAnalyticsDataset['materialUsageTrend'] => {
  const today = new Date('2024-09-15T00:00:00Z')
  const result: AdminAnalyticsDataset['materialUsageTrend'] = []

  for (let i = 59; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    result.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      'NPC-1000': 320 + ((i % 8) - 3) * 12,
      기타자재: 180 + ((i % 6) - 2) * 10,
    })
  }

  return result
}

export const ADMIN_SITES_STUB: AdminSiteSummary[] = [
  {
    id: 'site-gangnam-a',
    name: '강남 A 현장',
    code: 'GN-A-001',
    status: 'active',
    address: '서울 강남구 테헤란로 201',
    partnerCompanyId: 'partner-npc',
    managerName: '김현우',
    startedAt: '2024-03-01',
  },
  {
    id: 'site-songpa-c',
    name: '송파 C 현장',
    code: 'SP-C-014',
    status: 'active',
    address: '서울 송파구 위례성대로 45',
    partnerCompanyId: 'partner-buildon',
    managerName: '박지민',
    startedAt: '2024-02-15',
  },
  {
    id: 'site-seocho-b',
    name: '서초 B 현장',
    code: 'SC-B-008',
    status: 'active',
    address: '서울 서초구 반포대로 138',
    partnerCompanyId: 'partner-buildon',
    managerName: '이상훈',
    startedAt: '2024-01-20',
  },
  {
    id: 'site-guro-e',
    name: '구로 E 현장',
    code: 'GR-E-019',
    status: 'pending',
    address: '서울 구로구 경인로 432',
    partnerCompanyId: 'partner-supplies',
    managerName: '정유진',
    startedAt: '2024-05-10',
  },
]

export const ADMIN_DOCUMENTS_STUB: AdminDocumentSummary[] = [
  {
    id: 'doc-blueprint-001',
    title: '강남 A 현장 구조 도면',
    description: '강남 A 현장의 최신 구조 도면입니다.',
    file_url: 'https://example.com/documents/blueprint-001.pdf',
    file_name: 'gangnam-a-structure-v3.pdf',
    file_size: 2_560_000,
    mime_type: 'application/pdf',
    document_type: 'blueprint',
    folder_path: '/sites/gangnam-a',
    owner_id: 'admin-001',
    owner: {
      full_name: '김현우',
      email: 'hyunwoo.kim@npc.co.kr',
    },
    site_id: 'site-gangnam-a',
    site: {
      name: '강남 A 현장',
    },
    is_public: true,
    created_at: '2024-08-12T09:15:00+09:00',
    updated_at: '2024-09-02T11:42:00+09:00',
    approval_status: 'approved',
    approval_requested_at: '2024-08-10T08:10:00+09:00',
    approval_comments: '현장 공유 완료',
    requested_by: {
      full_name: '박지민',
      email: 'jimin.park@npc.co.kr',
    },
  },
  {
    id: 'doc-report-002',
    title: '8월 품질 점검 보고서',
    description: '8월 현장 품질 점검 결과 보고서입니다.',
    file_url: 'https://example.com/documents/report-002.pdf',
    file_name: 'quality-inspection-2024-08.pdf',
    file_size: 1_150_000,
    mime_type: 'application/pdf',
    document_type: 'report',
    folder_path: '/reports/2024',
    owner_id: 'qa-001',
    owner: {
      full_name: '최은미',
      email: 'eunmi.choi@npc.co.kr',
    },
    site_id: 'site-songpa-c',
    site: {
      name: '송파 C 현장',
    },
    is_public: false,
    created_at: '2024-09-01T14:20:00+09:00',
    updated_at: '2024-09-03T09:35:00+09:00',
    approval_status: 'pending',
    approval_requested_at: '2024-09-03T09:30:00+09:00',
    approval_comments: null,
    requested_by: {
      full_name: '구교민',
      email: 'gyomin.koo@npc.co.kr',
    },
  },
  {
    id: 'doc-certificate-003',
    title: '작업자 안전 교육 수료증 - 이지훈',
    description: '2024년 2분기 안전 교육 수료증 사본',
    file_url: 'https://example.com/documents/certificate-003.pdf',
    file_name: 'safety-training-leejihun.pdf',
    file_size: 420_000,
    mime_type: 'application/pdf',
    document_type: 'certificate',
    folder_path: '/workers/safety',
    owner_id: 'worker-342',
    owner: {
      full_name: '이지훈',
      email: 'jihun.lee@npc.co.kr',
    },
    site_id: 'site-seocho-b',
    site: {
      name: '서초 B 현장',
    },
    is_public: false,
    created_at: '2024-07-18T10:05:00+09:00',
    updated_at: '2024-07-18T10:05:00+09:00',
    approval_status: 'approved',
    approval_requested_at: '2024-07-18T09:50:00+09:00',
    approval_comments: '인사팀 확인 완료',
    requested_by: {
      full_name: '변정호',
      email: 'jung-ho.byun@npc.co.kr',
    },
  },
  {
    id: 'doc-contract-004',
    title: '하반기 자재 공급 계약서',
    description: '서브플라이 자재와 체결한 2024년 하반기 공급 계약서',
    file_url: 'https://example.com/documents/contract-004.pdf',
    file_name: 'supply-contract-h2-2024.pdf',
    file_size: 3_450_000,
    mime_type: 'application/pdf',
    document_type: 'contract',
    folder_path: '/partners/contracts',
    owner_id: 'procure-007',
    owner: {
      full_name: '장민수',
      email: 'minsu.jang@npc.co.kr',
    },
    site_id: null,
    site: null,
    is_public: false,
    created_at: '2024-06-25T16:45:00+09:00',
    updated_at: '2024-08-01T13:20:00+09:00',
    approval_status: 'approved',
    approval_requested_at: '2024-06-26T09:10:00+09:00',
    approval_comments: '법무팀 검토 후 승인',
    requested_by: {
      full_name: '유석진',
      email: 'seokjin.yoo@npc.co.kr',
    },
  },
  {
    id: 'doc-manual-005',
    title: 'NPC-1000 장비 운영 매뉴얼 v2',
    description: '현장 작업자를 위한 NPC-1000 장비 운영 지침서',
    file_url: 'https://example.com/documents/manual-005.pdf',
    file_name: 'npc-1000-operation-manual-v2.pdf',
    file_size: 5_200_000,
    mime_type: 'application/pdf',
    document_type: 'manual',
    folder_path: '/shared/manuals',
    owner_id: 'training-001',
    owner: {
      full_name: '정은채',
      email: 'eunchae.jung@npc.co.kr',
    },
    site_id: null,
    site: null,
    is_public: true,
    created_at: '2024-05-30T08:30:00+09:00',
    updated_at: '2024-08-15T10:55:00+09:00',
    approval_status: 'approved',
    approval_requested_at: '2024-05-29T17:40:00+09:00',
    approval_comments: '교육팀 배포 완료',
    requested_by: {
      full_name: '김나연',
      email: 'nayeon.kim@npc.co.kr',
    },
  },
  {
    id: 'doc-other-006',
    title: '긴급 안전 점검 요청서',
    description: '9월 안전 점검을 위한 자료 요청 사항입니다.',
    file_url: 'https://example.com/documents/other-006.docx',
    file_name: 'emergency-safety-review.docx',
    file_size: 280_000,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    document_type: 'other',
    folder_path: '/safety/requests',
    owner_id: 'safety-002',
    owner: {
      full_name: '한지호',
      email: 'jiho.han@npc.co.kr',
    },
    site_id: 'site-guro-e',
    site: {
      name: '구로 E 현장',
    },
    is_public: false,
    created_at: '2024-09-05T11:05:00+09:00',
    updated_at: '2024-09-06T09:15:00+09:00',
    approval_status: 'pending',
    approval_requested_at: '2024-09-06T08:50:00+09:00',
    approval_comments: null,
    requested_by: {
      full_name: '오세린',
      email: 'serin.oh@npc.co.kr',
    },
  },
]

export const ADMIN_PARTNER_COMPANIES_STUB: AdminPartnerCompany[] = [
  {
    id: 'partner-npc',
    company_name: 'NPC 건설',
    company_type: 'npc',
    status: 'active',
    contact_name: '최재훈',
    contact_phone: '010-1234-5678',
    contact_email: 'choi.jh@npc.co.kr',
  },
  {
    id: 'partner-buildon',
    company_name: '빌드온 파트너스',
    company_type: 'subcontractor',
    status: 'active',
    contact_name: '박정민',
    contact_phone: '010-7654-3210',
    contact_email: 'jm.park@buildon.kr',
  },
  {
    id: 'partner-supplies',
    company_name: '서브플라이 자재',
    company_type: 'supplier',
    status: 'active',
    contact_name: '홍지수',
    contact_phone: '010-9876-5432',
    contact_email: 'hong@supplies.co.kr',
  },
]

export const ADMIN_ORGANIZATIONS_STUB: AdminOrganizationSummary[] = [
  {
    id: 'org-npc-main',
    name: 'NPC 메인 법인',
    type: 'general_contractor',
    address: '서울특별시 강남구 테헤란로 201',
    contact_email: 'hq@npc.co.kr',
    contact_phone: '02-1234-5678',
    member_count: 48,
    site_count: 12,
    description: 'NPC 본사로 주요 대형 현장을 총괄합니다.',
  },
  {
    id: 'org-buildon',
    name: '빌드온 파트너스',
    type: 'subcontractor',
    address: '경기도 성남시 분당구 불정로 45',
    contact_email: 'contact@buildon.kr',
    contact_phone: '031-555-1212',
    member_count: 26,
    site_count: 5,
    description: '건축 마감공 전문 협력사',
  },
  {
    id: 'org-supplies',
    name: '서브플라이 자재',
    type: 'supplier',
    address: '경기도 안양시 동안구 시민대로 120',
    contact_email: 'sales@supplies.co.kr',
    contact_phone: '031-888-7777',
    member_count: 12,
    site_count: 7,
    description: '철근/거푸집 자재 공급 특화',
  },
]

export const ADMIN_ORGANIZATION_RELATIONS: Record<string, AdminOrganizationRelations> = {
  'org-npc-main': {
    members: [
      { id: 'user-admin-1', name: '김관리', role: 'system_admin', email: 'admin@inopnc.com' },
      { id: 'user-site-1', name: '박현장', role: 'site_manager', email: 'site.manager@inopnc.com' },
      { id: 'user-worker-1', name: '이작업', role: 'worker', email: 'worker@inopnc.com' },
    ],
    sites: [
      { id: 'site-gangnam-a', name: '강남 A 현장', status: 'active' },
      { id: 'site-seocho-b', name: '서초 B 현장', status: 'active' },
      { id: 'site-guro-e', name: '구로 E 현장', status: 'planning' },
    ],
  },
  'org-buildon': {
    members: [
      { id: 'user-buildon-1', name: '조현우', role: 'customer_manager', email: 'jo@buildon.kr' },
      { id: 'user-buildon-2', name: '우지혜', role: 'worker', email: 'woo@buildon.kr' },
    ],
    sites: [
      { id: 'site-songpa-c', name: '송파 C 현장', status: 'active' },
      { id: 'site-guro-e', name: '구로 E 현장', status: 'planning' },
    ],
  },
  'org-supplies': {
    members: [
      {
        id: 'user-supply-1',
        name: '정세영',
        role: 'customer_manager',
        email: 'jung@supplies.co.kr',
      },
    ],
    sites: [
      { id: 'site-gangnam-a', name: '강남 A 현장', status: 'active' },
      { id: 'site-seocho-b', name: '서초 B 현장', status: 'active' },
    ],
  },
}

export const ADMIN_PARTNER_RELATIONS: Record<string, AdminPartnerRelations> = {
  'partner-npc': {
    sites: [
      { id: 'site-gangnam-a', name: '강남 A 현장', status: 'active' },
      { id: 'site-seocho-b', name: '서초 B 현장', status: 'active' },
    ],
    contacts: [
      {
        name: '최재훈',
        phone: '010-1234-5678',
        email: 'choi.jh@npc.co.kr',
        position: '프로젝트 총괄',
      },
    ],
  },
  'partner-buildon': {
    sites: [{ id: 'site-songpa-c', name: '송파 C 현장', status: 'active' }],
    contacts: [
      {
        name: '박정민',
        phone: '010-7654-3210',
        email: 'jm.park@buildon.kr',
        position: '현장 담당',
      },
      { name: '이소윤', phone: '010-2222-7777', email: 'lee@buildon.kr', position: '안전 관리자' },
    ],
  },
  'partner-supplies': {
    sites: [
      { id: 'site-guro-e', name: '구로 E 현장', status: 'planning' },
      { id: 'site-gangnam-a', name: '강남 A 현장', status: 'active' },
    ],
    contacts: [
      {
        name: '홍지수',
        phone: '010-9876-5432',
        email: 'hong@supplies.co.kr',
        position: '영업 대표',
      },
    ],
  },
}

export const ADMIN_AUDIT_LOG_STUB: AdminAuditLogEntry[] = [
  {
    id: 'log-1',
    action: 'LOGIN',
    entity_type: 'auth',
    user_name: 'system_admin',
    status: 'success',
    created_at: '2024-09-19T09:12:00+09:00',
  },
  {
    id: 'log-2',
    action: 'UPDATE',
    entity_type: 'site',
    entity_name: '강남 A 현장',
    user_name: 'admin@inopnc.com',
    status: 'success',
    created_at: '2024-09-19T08:55:00+09:00',
  },
  {
    id: 'log-3',
    action: 'UPLOAD',
    entity_type: 'document',
    entity_name: '안전점검 보고서.pdf',
    user_name: 'park.manager@inopnc.com',
    status: 'pending',
    created_at: '2024-09-19T08:40:00+09:00',
  },
  {
    id: 'log-4',
    action: 'DELETE',
    entity_type: 'document',
    entity_name: '구 현장 보고서.xlsx',
    user_name: 'system_admin',
    status: 'failed',
    created_at: '2024-09-18T17:20:00+09:00',
  },
]

export const ADMIN_ANALYTICS_STUB: AdminAnalyticsDataset = {
  overview: {
    totalWorkers: 248,
    activeSites: 12,
    totalDocuments: 1864,
    monthlyExpense: 492_300_000,
    workersChange: 9,
    sitesChange: 1,
    documentsChange: 132,
    expenseChange: -4.6,
  },
  attendanceTrend: buildAttendanceTrend(),
  sitePerformance: [
    { name: '강남 A현장', 진행률: 78, 작업자: 45, 안전점수: 92 },
    { name: '송파 C현장', 진행률: 65, 작업자: 38, 안전점수: 88 },
    { name: '서초 B현장', 진행률: 92, 작업자: 52, 안전점수: 95 },
    { name: '강동 D현장', 진행률: 45, 작업자: 32, 안전점수: 90 },
    { name: '구로 E현장', 진행률: 88, 작업자: 41, 안전점수: 87 },
  ],
  documentDistribution: [
    { name: '작업지시서', value: 450, percentage: 24.3 },
    { name: '안전서류', value: 380, percentage: 20.6 },
    { name: '도면', value: 320, percentage: 17.3 },
    { name: '계약서', value: 290, percentage: 15.7 },
    { name: '보고서', value: 424, percentage: 22.1 },
  ],
  materialUsageTrend: buildMaterialUsageTrend(),
  salaryDistribution: [
    { range: '200-250만', count: 42 },
    { range: '250-300만', count: 76 },
    { range: '300-350만', count: 68 },
    { range: '350-400만', count: 38 },
    { range: '400만+', count: 24 },
  ],
  safetyIncidents: [
    { month: '4월', incidents: 2, nearMiss: 5 },
    { month: '5월', incidents: 1, nearMiss: 3 },
    { month: '6월', incidents: 0, nearMiss: 2 },
    { month: '7월', incidents: 1, nearMiss: 1 },
    { month: '8월', incidents: 0, nearMiss: 2 },
    { month: '9월', incidents: 0, nearMiss: 1 },
  ],
  productivityMetrics: [
    { metric: '작업효율', current: 85, target: 90, unit: '%' },
    { metric: '품질점수', current: 92, target: 95, unit: '점' },
    { metric: '안전준수', current: 96, target: 98, unit: '%' },
    { metric: '일정준수', current: 88, target: 90, unit: '%' },
    { metric: '비용효율', current: 82, target: 85, unit: '%' },
  ],
}

export const ADMIN_USERS_STUB = [
  {
    id: 'user-admin-1',
    full_name: '김관리',
    email: 'admin@inopnc.com',
    role: 'admin',
    phone: '010-5555-0101',
  },
  {
    id: 'user-site-1',
    full_name: '박현장',
    email: 'site.manager@inopnc.com',
    role: 'site_manager',
    phone: '010-7777-0202',
  },
  {
    id: 'user-worker-1',
    full_name: '이작업',
    email: 'worker@inopnc.com',
    role: 'worker',
    partner_company: {
      id: 'partner-buildon',
      company_name: '빌드온 파트너스',
    },
  },
]

export const ADMIN_ASSIGNMENT_STATS_STUB = {
  totalUsers: 142,
  assignedUsers: 118,
  unassignedUsers: 24,
  totalSites: 16,
  activeSites: 12,
  totalPartners: 9,
  partnerSiteMappings: 21,
  recentAssignments: 7,
}

export const ADMIN_ASSIGNMENT_ACTIVITY_STUB = [
  {
    id: 'assignment-stub-1',
    type: 'assignment',
    description: '박현장님이 강남 A 현장에 배정되었습니다',
    timestamp: '2024-09-18T09:15:00+09:00',
    user_name: '박현장',
    site_name: '강남 A 현장',
  },
  {
    id: 'mapping-stub-1',
    type: 'mapping',
    description: '빌드온 파트너스와 송파 C 현장이 매핑되었습니다',
    timestamp: '2024-09-17T16:40:00+09:00',
    partner_name: '빌드온 파트너스',
    site_name: '송파 C 현장',
  },
]
