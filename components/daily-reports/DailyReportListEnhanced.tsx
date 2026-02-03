'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import type { DailyReport, Profile, Site } from '@/types'
import { Download, Filter, Plus, RefreshCw, Search, X } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import { DailyReportDetailDialog } from './DailyReportDetailDialog'
import { useDailyReportSearch } from './hooks/useDailyReportSearch'
import { DailyReportStats } from './list/DailyReportStats'
import { DailyReportTable } from './list/DailyReportTable'

interface DailyReportListEnhancedProps {
  currentUser: Profile
  sites: Site[]
}

export function DailyReportListEnhanced({ currentUser, sites = [] }: DailyReportListEnhancedProps) {
  const { reports, loading, isSearchMode, stats, loadReports, handleSearch, setIsSearchMode } =
    useDailyReportSearch()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Initialization
  useEffect(() => {
    loadReports()
  }, [loadReports])

  const onRefresh = () => {
    const filters: any = {}
    if (selectedSite !== 'all') filters.site_id = selectedSite
    if (selectedStatus !== 'all') filters.status = selectedStatus
    loadReports(filters)
  }

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm && selectedSite === 'all' && selectedStatus === 'all') {
      loadReports()
      return
    }

    // In actual implementation, this would call handleSearch with SearchOptions
    // For now, let's just refresh with basic filters
    onRefresh()
  }

  const handleViewDetail = useCallback((report: DailyReport) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
  }, [])

  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(currentUser.role)

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            작업일지 관리
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            현장의 일일 작업 내역과 자재 사용 현황을 확인하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none transition-all">
                <Plus className="w-4 h-4 mr-2" />새 작업일지 작성
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <DailyReportStats stats={stats} />

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/10">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
          >
            <Filter className={`w-4 h-4 ${showFilters ? 'text-blue-500' : ''}`} />
            필터 및 검색
            {!showFilters && (selectedSite !== 'all' || selectedStatus !== 'all') && (
              <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5">Active</Badge>
            )}
          </button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg border-gray-200 dark:border-gray-700"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              엑셀 내보내기
            </Button>
          </div>
        </div>

        {showFilters && (
          <form onSubmit={handleQuickSearch} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">
                현장 선택
              </label>
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className="h-11 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500/20">
                  <CustomSelectValue placeholder="전체 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {sites.map(s => (
                    <CustomSelectItem key={s.id} value={s.id}>
                      {s.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">
                보고서 상태
              </label>
              <CustomSelect value={selectedStatus} onValueChange={setSelectedStatus}>
                <CustomSelectTrigger className="h-11 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500/20">
                  <CustomSelectValue placeholder="전체 상태" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                  <CustomSelectItem value="draft">임시</CustomSelectItem>
                  <CustomSelectItem value="submitted">제출됨</CustomSelectItem>
                  <CustomSelectItem value="approved">승인됨</CustomSelectItem>
                  <CustomSelectItem value="rejected">반려됨</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">
                검색 키워드
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="부재명, 공정, 특이사항 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Main Table Content */}
      <DailyReportTable
        reports={reports}
        sites={sites}
        currentUser={currentUser}
        onViewDetail={handleViewDetail}
      />

      {/* Detail Dialog */}
      <DailyReportDetailDialog
        report={selectedReport}
        site={sites.find(s => s.id === selectedReport?.site_id)}
        currentUser={currentUser}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  )
}
