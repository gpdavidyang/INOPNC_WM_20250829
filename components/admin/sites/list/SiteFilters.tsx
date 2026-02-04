'use client'

import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/ui/strings'
import { Filter, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'planning', label: '준비 중' },
  { value: 'active', label: '진행 중' },
  { value: 'inactive', label: '중단' },
  { value: 'completed', label: '완료' },
]

interface SiteFiltersProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  onSearchSubmit: () => void
  statusFilter: string
  onStatusChange: (val: string) => void
  onReset: () => void
  loading: boolean
}

export const SiteFilters = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusChange,
  onReset,
  loading,
}: SiteFiltersProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full md:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder={t('sites.searchPlaceholder')}
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearchSubmit()}
            className="pl-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <CustomSelect value={statusFilter} onValueChange={onStatusChange}>
            <CustomSelectTrigger className="w-full md:w-[160px] h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <CustomSelectValue placeholder={t('sites.statusFilter')} />
              </div>
            </CustomSelectTrigger>
            <CustomSelectContent>
              {STATUS_OPTIONS.map(opt => (
                <CustomSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={loading}
            className="h-10 px-4 text-gray-600 bg-slate-50 hover:bg-slate-100 border-gray-200 dark:border-gray-700 whitespace-nowrap font-bold"
          >
            새로고침
          </Button>

          <Button
            onClick={onSearchSubmit}
            disabled={loading}
            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm whitespace-nowrap font-bold"
          >
            검색
          </Button>

          <Button
            asChild
            className="h-10 px-4 rounded-lg bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold text-xs shadow-sm whitespace-nowrap gap-1.5 shrink-0"
          >
            <Link href="/dashboard/admin/sites/new" className="flex items-center">
              <Plus className="w-3.5 h-3.5" />
              <span>현장 등록</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
