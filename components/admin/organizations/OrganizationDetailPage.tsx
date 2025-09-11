'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
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

interface OrganizationDetailPageProps {
  organization: Organization
}

export default function OrganizationDetailPage({ organization: initialOrg }: OrganizationDetailPageProps) {
  const router = useRouter()
  const [organization, setOrganization] = useState(initialOrg)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('정말로 이 거래처를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      if (error) throw error
      
      alert('거래처가 삭제되었습니다.')
      router.push('/dashboard/admin/organizations')
    } catch (error: any) {
      console.error('Error deleting organization:', error)
      
      if (error.code === '23503') {
        alert('이 거래처는 삭제할 수 없습니다.\n\n해당 거래처에 소속된 사용자나 연결된 데이터가 있습니다.\n먼저 관련 데이터를 삭제하거나 다른 거래처로 이전한 후 다시 시도해주세요.')
      } else {
        alert('거래처 삭제 중 오류가 발생했습니다.')
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !organization.is_active })
        .eq('id', organization.id)

      if (error) throw error
      
      setOrganization({ ...organization, is_active: !organization.is_active })
      alert(`거래처가 ${!organization.is_active ? '활성화' : '비활성화'}되었습니다.`)
    } catch (error) {
      console.error('Error toggling organization status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/admin/organizations')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {organization.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    거래처 상세 정보
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/admin/organizations/${organization.id}/edit`)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  기본 정보
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      거래처명
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {organization.name}
                    </p>
                  </div>
                  {organization.business_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        사업자등록번호
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {organization.business_number}
                      </p>
                    </div>
                  )}
                  {organization.representative_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        대표자명
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {organization.representative_name}
                      </p>
                    </div>
                  )}
                </div>
                {organization.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      설명
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {organization.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  연락처 정보
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organization.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          전화번호
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {organization.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {organization.fax && (
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          팩스
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {organization.fax}
                        </p>
                      </div>
                    </div>
                  )}
                  {organization.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          이메일
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {organization.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {organization.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          주소
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {organization.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information */}
            {(organization.business_type || organization.business_category || organization.bank_name || organization.bank_account) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    사업 정보
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {organization.business_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          업태
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {organization.business_type}
                        </p>
                      </div>
                    )}
                    {organization.business_category && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          종목
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {organization.business_category}
                        </p>
                      </div>
                    )}
                    {organization.bank_name && (
                      <div className="flex items-start space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            은행명
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {organization.bank_name}
                          </p>
                        </div>
                      </div>
                    )}
                    {organization.bank_account && (
                      <div className="flex items-start space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            계좌번호
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {organization.bank_account}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  상태
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    활성 상태
                  </span>
                  <button
                    onClick={handleToggleActive}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      organization.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {organization.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        활성
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        비활성
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>등록일: {new Date(organization.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  {organization.updated_at && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>수정일: {new Date(organization.updated_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {organization.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    메모
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {organization.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}