'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { X, Folder, Building2, FileText } from 'lucide-react'

interface CreateFolderModalProps {
  category: string
  sites: Array<{id: string, name: string}>
  profile: Profile
  onClose: () => void
  onSuccess: () => void
}

export default function CreateFolderModal({
  category,
  sites,
  profile,
  onClose,
  onSuccess
}: CreateFolderModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    site_id: '',
    parent_folder_id: null as string | null,
    is_shared: false
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('폴더명을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      // For now, show placeholder since document_folders table doesn't exist yet
      alert('폴더 생성 기능은 데이터베이스 마이그레이션 완료 후 사용 가능합니다.')
      
      // TODO: Implement when document_folders table is created
      // const folderData = {
      //   name: formData.name.trim(),
      //   description: formData.description.trim() || null,
      //   category: category,
      //   site_id: formData.site_id || null,
      //   parent_folder_id: formData.parent_folder_id,
      //   created_by: profile.id,
      //   is_shared: formData.is_shared,
      //   sort_order: 0
      // }

      // const { data, error } = await supabase
      //   .from('document_folders')
      //   .insert([folderData])
      //   .select()
      //   .single()

      // if (error) throw error

      // Success
      onSuccess()
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('폴더 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryDisplayName = (categoryName: string) => {
    const names: Record<string, string> = {
      personal: '개인문서',
      shared: '공유문서',
      blueprint: '도면마킹',
      required: '필수서류',
      progress_payment: '기성청구',
      report: '보고서',
      certificate: '인증서',
      other: '기타'
    }
    return names[categoryName] || '기타'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              새 폴더 생성
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">
                카테고리: {getCategoryDisplayName(category)}
              </span>
            </div>
          </div>

          {/* Folder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              폴더명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="폴더명을 입력하세요"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="폴더 설명을 입력하세요"
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              현장 선택
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">현장을 선택하세요</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              현장을 선택하지 않으면 모든 현장에서 접근 가능합니다.
            </p>
          </div>

          {/* Shared Folder Option */}
          {['shared', 'required', 'progress_payment'].includes(category) && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="is_shared"
                checked={formData.is_shared}
                onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label htmlFor="is_shared" className="text-sm font-medium text-gray-900 dark:text-white">
                  공유 폴더로 생성
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  체크하면 같은 현장의 다른 사용자도 이 폴더에 문서를 업로드할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  생성 중...
                </div>
              ) : (
                '폴더 생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}