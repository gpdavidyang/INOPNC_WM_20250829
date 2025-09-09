'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createSite, CreateSiteData } from '@/app/actions/admin/sites'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import { useWorkOptions } from '@/hooks/use-work-options'

interface CreateSiteModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateSiteModal({ onClose, onSuccess }: CreateSiteModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Load work options from database
  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()
  
  const [formData, setFormData] = useState<CreateSiteData>({
    name: '',
    address: '',
    description: '',
    construction_manager_phone: '',
    safety_manager_phone: '',
    accommodation_name: '',
    accommodation_address: '',
    work_process: '',
    work_section: '',
    component_name: '',
    manager_name: '',
    safety_manager_name: '',
    status: 'active',
    start_date: '',
    end_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createSite(formData)
      if (result.success) {
        onSuccess()
      } else {
        alert(result.error || '현장 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to create site:', error)
      alert('현장 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                새 현장 추가
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                기본 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    현장명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: 강남 A현장"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="completed">완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  주소 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="예: 서울특별시 강남구 테헤란로 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="현장에 대한 설명을 입력하세요"
                />
              </div>
            </div>

            {/* 일정 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                일정 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                담당자 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    현장관리자
                  </label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    현장관리자 연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.construction_manager_phone}
                    onChange={(e) => setFormData({ ...formData, construction_manager_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="010-0000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    안전관리자
                  </label>
                  <input
                    type="text"
                    value={formData.safety_manager_name}
                    onChange={(e) => setFormData({ ...formData, safety_manager_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    안전관리자 연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.safety_manager_phone}
                    onChange={(e) => setFormData({ ...formData, safety_manager_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 숙소 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                숙소 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    숙소명
                  </label>
                  <input
                    type="text"
                    value={formData.accommodation_name}
                    onChange={(e) => setFormData({ ...formData, accommodation_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: 현장 숙소"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    숙소 주소
                  </label>
                  <input
                    type="text"
                    value={formData.accommodation_address}
                    onChange={(e) => setFormData({ ...formData, accommodation_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="숙소 주소"
                  />
                </div>
              </div>
            </div>

            {/* 작업 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                작업 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    부재명
                  </label>
                  <div>
                    <CustomSelect
                      value={formData.component_name?.startsWith('기타:') ? '기타' : formData.component_name || ''}
                      onValueChange={(value) => {
                        if (value === '기타') {
                          setFormData({ ...formData, component_name: '기타:' })
                        } else {
                          setFormData({ ...formData, component_name: value })
                        }
                      }}
                    >
                      <CustomSelectTrigger className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <CustomSelectValue placeholder="선택하세요" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                        {componentTypes.map((type) => (
                          <CustomSelectItem key={type.id} value={type.option_label}>
                            {type.option_label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                    {formData.component_name?.startsWith('기타') && (
                      <input
                        type="text"
                        value={formData.component_name.replace('기타:', '')}
                        onChange={(e) => setFormData({ ...formData, component_name: '기타:' + e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="기타 부재명 입력"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    작업공정
                  </label>
                  <div>
                    <CustomSelect
                      value={formData.work_process?.startsWith('기타:') ? '기타' : formData.work_process || ''}
                      onValueChange={(value) => {
                        if (value === '기타') {
                          setFormData({ ...formData, work_process: '기타:' })
                        } else {
                          setFormData({ ...formData, work_process: value })
                        }
                      }}
                    >
                      <CustomSelectTrigger className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <CustomSelectValue placeholder="선택하세요" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                        {processTypes.map((type) => (
                          <CustomSelectItem key={type.id} value={type.option_label}>
                            {type.option_label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                    {formData.work_process?.startsWith('기타') && (
                      <input
                        type="text"
                        value={formData.work_process.replace('기타:', '')}
                        onChange={(e) => setFormData({ ...formData, work_process: '기타:' + e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="기타 작업공정 입력"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    작업구간
                  </label>
                  <input
                    type="text"
                    value={formData.work_section}
                    onChange={(e) => setFormData({ ...formData, work_section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: A동"
                  />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '생성 중...' : '현장 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}