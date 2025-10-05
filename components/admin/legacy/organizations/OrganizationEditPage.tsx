'use client'

import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'
import StickyActionBar from '@/components/ui/sticky-action-bar'

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

interface OrganizationEditPageProps {
  organization: Organization
}

export default function OrganizationEditPage({
  organization: initialOrg,
}: OrganizationEditPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialOrg.name || '',
    description: initialOrg.description || '',
    address: initialOrg.address || '',
    phone: initialOrg.phone || '',
    representative_name: initialOrg.representative_name || '',
    business_number: initialOrg.business_number || '',
    email: initialOrg.email || '',
    fax: initialOrg.fax || '',
    business_type: initialOrg.business_type || '',
    business_category: initialOrg.business_category || '',
    bank_name: initialOrg.bank_name || '',
    bank_account: initialOrg.bank_account || '',
    notes: initialOrg.notes || '',
    is_active: initialOrg.is_active !== false,
  })
  const supabase = createClient()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({ variant: 'warning', title: '입력 필요', description: '거래처명을 입력해주세요.' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initialOrg.id)

      if (error) throw error

      toast({
        variant: 'success',
        title: '수정 완료',
        description: '거래처 정보가 수정되었습니다.',
      })
      router.push(`/dashboard/admin/organizations/${initialOrg.id}`)
    } catch (error) {
      console.error('Error updating organization:', error)
      toast({
        variant: 'destructive',
        title: '오류',
        description: '거래처 수정 중 오류가 발생했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    ;(async () => {
      const ok = await confirm({
        title: '수정 취소',
        description: '수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.',
        confirmText: '확인',
        cancelText: '계속 수정',
      })
      if (ok) router.push(`/dashboard/admin/organizations/${initialOrg.id}`)
    })()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/dashboard/admin/organizations/${initialOrg.id}`)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">거래처 수정</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{initialOrg.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      거래처명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업자등록번호
                    </label>
                    <input
                      type="text"
                      value={formData.business_number}
                      onChange={e => setFormData({ ...formData, business_number: e.target.value })}
                      placeholder="000-00-00000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      대표자명
                    </label>
                    <input
                      type="text"
                      value={formData.representative_name}
                      onChange={e =>
                        setFormData({ ...formData, representative_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  연락처 정보
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="02-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      팩스
                    </label>
                    <input
                      type="tel"
                      value={formData.fax}
                      onChange={e => setFormData({ ...formData, fax: e.target.value })}
                      placeholder="02-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@company.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  사업 정보
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      업태
                    </label>
                    <input
                      type="text"
                      value={formData.business_type}
                      onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                      placeholder="건설업"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종목
                    </label>
                    <input
                      type="text"
                      value={formData.business_category}
                      onChange={e =>
                        setFormData({ ...formData, business_category: e.target.value })
                      }
                      placeholder="토목공사"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      은행명
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="○○은행"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      value={formData.bank_account}
                      onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                      placeholder="000-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  추가 정보
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      메모
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="거래처에 대한 추가 정보나 메모를 입력하세요..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      활성 상태
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <StickyActionBar>
              <div className="px-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </StickyActionBar>
          </div>
        </form>
      </div>
    </div>
  )
}
