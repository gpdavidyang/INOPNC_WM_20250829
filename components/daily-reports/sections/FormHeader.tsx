'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
    <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(getBreadcrumb())}
              className="group h-9 rounded-xl px-4 flex items-center gap-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#1A254F] transition-all whitespace-nowrap font-bold"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>뒤로가기</span>
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              {getRoleIcon()}
              <h1 className="text-xl md:text-2xl font-black text-[#1A254F] tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
            {mode === 'edit' && reportData?.status && (
              <div className="flex items-center gap-2 mt-1 px-3 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                  상태:
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    reportData.status === 'approved'
                      ? 'text-emerald-600'
                      : reportData.status === 'rejected'
                        ? 'text-rose-600'
                        : 'text-blue-600'
                  )}
                >
                  {(STATUS_LABEL as any)[reportData.status] || reportData.status}
                </span>
                {reportData.status === 'rejected' && reportData.rejection_reason && (
                  <span className="text-[10px] text-rose-500 opacity-60 font-medium ml-1 truncate max-w-[150px]">
                    / {reportData.rejection_reason}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAllSections}
              className="h-9 rounded-xl text-slate-500 hover:text-[#1A254F] hover:bg-slate-50 font-black text-[11px] uppercase tracking-tighter whitespace-nowrap border-slate-200"
            >
              {allExpanded ? '전체 접기' : '전체 펼치기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
