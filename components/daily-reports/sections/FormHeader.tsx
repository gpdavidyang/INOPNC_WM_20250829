'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface FormHeaderProps {
  mode: 'create' | 'edit'
  reportData?: any
  getBreadcrumb: () => string
  getPageTitle: () => string
  getRoleIcon: () => React.ReactNode
  STATUS_LABEL: Record<string, string>
  allExpanded: boolean
  toggleAllSections: () => void
  hideHeader?: boolean
}

export const FormHeader = ({
  mode,
  reportData,
  getBreadcrumb,
  getPageTitle,
  getRoleIcon,
  STATUS_LABEL,
  allExpanded,
  toggleAllSections,
  hideHeader,
}: FormHeaderProps) => {
  const router = useRouter()

  if (hideHeader) return null

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(getBreadcrumb())}
              className="flex items-center gap-2 text-gray-600 hover:text-[#15347C] hover:bg-[#F3F7FA]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>돌아가기</span>
            </Button>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-3">
                {getRoleIcon()}
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              </div>
              {mode === 'edit' && reportData?.status && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="px-2 py-0.5 text-xs font-bold">
                    상태: {(STATUS_LABEL as any)[reportData.status] || reportData.status}
                  </Badge>
                  {reportData.status === 'rejected' && reportData.rejection_reason && (
                    <span className="text-[11px] text-rose-600 font-medium">
                      (반려 사유: {reportData.rejection_reason})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={toggleAllSections} className="text-sm">
              {allExpanded ? '모두 접기' : '모두 펼치기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
