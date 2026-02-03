'use client'

import type { DailyReport, Profile, Site } from '@/types'
import type { DailyReportFormData } from '@/types/daily-reports'
import { useState } from 'react'
import { DetailHeader } from './detail/DetailHeader'
import { DetailsSection } from './detail/DetailsSection'
import { DetailTabs } from './detail/DetailTabs'
import { MaterialsSection } from './detail/MaterialsSection'
import { OverviewSection } from './detail/OverviewSection'
import { PhotosSection } from './detail/PhotosSection'
import { SafetySection } from './detail/SafetySection'

interface DailyReportDetailViewProps {
  report: DailyReport & {
    site?: Site
    created_by_profile?: Profile
    approved_by_profile?: Profile
    formData?: DailyReportFormData
  }
  currentUser: Profile
  onEdit?: () => void
  onDelete?: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function DailyReportDetailView({
  report,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: DailyReportDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const canEdit = currentUser?.id === report.created_by && report.status === 'draft'
  const canDelete = currentUser?.id === report.created_by && report.status === 'draft'

  const formData = report.formData || {}

  const tabs = [
    { key: 'overview', label: '개요' },
    { key: 'details', label: '상세 작업' },
    { key: 'materials', label: '자재/장비' },
    { key: 'safety', label: '안전/품질' },
    { key: 'photos', label: '사진/첨부' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection report={report} formData={formData} />
      case 'details':
        return <DetailsSection formData={formData} />
      case 'materials':
        return <MaterialsSection formData={formData} />
      case 'safety':
        return <SafetySection formData={formData} />
      case 'photos':
        return <PhotosSection formData={formData} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DetailHeader
          report={report}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <DetailTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

          <div className="p-6">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Status specific actions (Admin Approval) */}
        {report.status === 'submitted' && (onApprove || onReject) && (
          <div className="mt-8 flex justify-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <button
              onClick={onReject}
              className="px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100"
            >
              반려하기
            </button>
            <button
              onClick={onApprove}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none transition-all"
            >
              승인하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
