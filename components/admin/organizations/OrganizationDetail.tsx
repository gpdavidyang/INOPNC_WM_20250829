'use client'

import { 
  X, 
  Edit, 
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Organization {
  id: string
  name: string
  type: string
  description?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  // Extended fields (for future use)
  representative_name?: string
  business_number?: string
  email?: string
  fax?: string
  business_type?: string
  business_category?: string
  bank_name?: string
  bank_account?: string
  notes?: string
}

interface OrganizationDetailProps {
  organization: Organization
  onClose: () => void
  onEdit: () => void
}

export default function OrganizationDetail({ organization, onClose, onEdit }: OrganizationDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {organization.name}
              </h2>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                organization.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
              }`}>
                {organization.is_active ? '활성' : '비활성'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="수정"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">조직 타입</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        organization.type === 'head_office' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        organization.type === 'branch_office' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {organization.type === 'head_office' ? '본사' :
                         organization.type === 'branch_office' ? '지사/협력업체' :
                         organization.type === 'department' ? '부서' : organization.type}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">설명</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.description || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">연락처 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">전화번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">주소</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.address || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 향후 추가 예정 기능 안내 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">💡 향후 추가 예정 기능</h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                다음 정보들이 추가로 관리될 예정입니다:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>대표자명</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span>사업자등록번호</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>이메일 및 팩스</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>금융정보 (은행, 계좌)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>업종 및 업태</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>메모 및 특이사항</span>
                </div>
              </div>
            </div>

            {/* 시스템 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">시스템 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(organization.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>

                {organization.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(organization.updated_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}