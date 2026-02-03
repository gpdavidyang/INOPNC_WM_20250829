'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DailyReport, Profile, Site } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle, Clock, Download, Edit, Eye, FileText, Printer, XCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { DetailTabs } from './detail/DetailTabs'
import { MaterialsSection } from './detail/MaterialsSection'
import { OverviewSection } from './detail/OverviewSection'
import { PhotosSection } from './detail/PhotosSection'

interface DailyReportDetailDialogProps {
  report: DailyReport | null
  site?: Site
  currentUser: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyReportDetailDialog({
  report,
  site,
  currentUser,
  open,
  onOpenChange,
}: DailyReportDetailDialogProps) {
  const [activeTab, setActiveTab] = React.useState('overview')

  if (!report) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            임시
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            제출됨
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            승인됨
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            반려됨
          </Badge>
        )
      default:
        return null
    }
  }

  const canEdit = currentUser.id === report.created_by && report.status === 'draft'

  // Dialog version might have limited formData, we fallback to report fields
  const formData = (report as any).formData || {
    material_usage: [],
    workers: [],
    work_section: (report as any).work_section || '',
    issues: report.issues || '',
  }

  const tabs = [
    { key: 'overview', label: '개요' },
    { key: 'materials', label: '자재/장비' },
    { key: 'photos', label: '사진' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection report={report} formData={formData} />
      case 'materials':
        return <MaterialsSection formData={formData} />
      case 'photos':
        return <PhotosSection formData={formData} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  작업일지 상세
                </span>
                {getStatusBadge(report.status || 'draft')}
              </DialogTitle>
              <p className="text-xs text-gray-500 font-medium">
                {format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })} •{' '}
                {site?.name || '현장 미지정'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                인쇄
              </Button>
              {canEdit && (
                <Link
                  href={`/dashboard/daily-reports/${report.id}/edit`}
                  onClick={() => onOpenChange(false)}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    수정
                  </Button>
                </Link>
              )}
              <Link
                href={`/dashboard/daily-reports/${report.id}`}
                onClick={() => onOpenChange(false)}
              >
                <Button variant="primary" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  전체 보기
                </Button>
              </Link>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <DetailTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderTabContent()}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
