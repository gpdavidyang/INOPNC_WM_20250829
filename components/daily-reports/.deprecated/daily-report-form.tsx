'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createDailyReport } from '@/lib/supabase/daily-reports'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface Site {
  id: string
  name: string
  organization_id: string
}

interface DailyReportFormProps {
  sites: Site[]
}

export default function DailyReportForm({ sites }: DailyReportFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    site_id: '',
    work_date: new Date().toISOString().split('T')[0],
    work_content: '',
    weather: '',
    temperature: '',
    special_notes: '',
    member_name: '',
    process_type: '',
    total_workers: 0,
    issues: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const report = await createDailyReport({
        site_id: formData.site_id,
        work_date: formData.work_date,
        member_name: formData.member_name || 'Unknown',
        process_type: formData.process_type || 'General',
        total_workers: formData.total_workers || 1,
        issues: formData.issues || formData.special_notes || ''
        // TODO: Add temperature when schema supports it
        // temperature: formData.temperature ? parseFloat(formData.temperature) : null
      })
      
      router.push(`/dashboard/daily-reports/${report.id}`)
    } catch (error) {
      console.error('Error creating report:', error)
      alert('작업일지 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Site selection */}
            <div>
              <label htmlFor="site_id" className="block text-sm font-medium text-gray-700">
                현장 선택 *
              </label>
              <CustomSelect
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                required
              >
                <CustomSelectTrigger id="site_id" className="w-full">
                  <CustomSelectValue placeholder="현장을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {sites.map((site: any) => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            {/* Work date */}
            <div>
              <label htmlFor="work_date" className="block text-sm font-medium text-gray-700">
                작업일자 *
              </label>
              <input
                type="date"
                id="work_date"
                name="work_date"
                required
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Work content */}
            <div>
              <label htmlFor="work_content" className="block text-sm font-medium text-gray-700">
                작업 내용 *
              </label>
              <textarea
                id="work_content"
                name="work_content"
                rows={6}
                required
                value={formData.work_content}
                onChange={(e) => setFormData({ ...formData, work_content: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="오늘 수행한 작업 내용을 상세히 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Weather */}
              <div>
                <label htmlFor="weather" className="block text-sm font-medium text-gray-700">
                  날씨
                </label>
                <CustomSelect
                  value={formData.weather}
                  onValueChange={(value) => setFormData({ ...formData, weather: value })}
                >
                  <CustomSelectTrigger id="weather" className="w-full">
                    <CustomSelectValue placeholder="선택하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="맑음">맑음</CustomSelectItem>
                    <CustomSelectItem value="흐림">흐림</CustomSelectItem>
                    <CustomSelectItem value="비">비</CustomSelectItem>
                    <CustomSelectItem value="눈">눈</CustomSelectItem>
                    <CustomSelectItem value="안개">안개</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              {/* Temperature */}
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  온도 (°C)
                </label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="예: 25.5"
                />
              </div>
            </div>

            {/* Special notes */}
            <div>
              <label htmlFor="special_notes" className="block text-sm font-medium text-gray-700">
                특이사항
              </label>
              <textarea
                id="special_notes"
                name="special_notes"
                rows={3}
                value={formData.special_notes}
                onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="특별한 사항이나 주의사항을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Link
          href="/dashboard"
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}