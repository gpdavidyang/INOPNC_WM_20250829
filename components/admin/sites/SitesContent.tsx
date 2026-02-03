'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import { t } from '@/lib/ui/strings'
import type { Site } from '@/types'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { StatusFilterOption, useSiteSearch } from './hooks/useSiteSearch'
import { SiteFilters } from './list/SiteFilters'
import { SiteStats } from './list/SiteStats'
import { SiteTable } from './list/SiteTable'

interface SitesContentProps {
  initialSites: Site[]
  initialTotal: number
  initialPages: number
  pageSize: number
  initialLoadErrored?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  all: '전체',
  planning: '준비 중',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

export function SitesContent({
  initialSites,
  initialTotal,
  initialPages,
  pageSize,
}: SitesContentProps) {
  const {
    sites,
    total,
    page,
    pages,
    loading,
    searchTerm,
    statusFilter,
    sortKey,
    sortDir,
    statsMap,
    managersMap,
    setSearchTerm,
    loadSites,
    deleteSite,
  } = useSiteSearch({
    sites: initialSites,
    total: initialTotal,
    pages: initialPages,
    pageSize,
  })

  const { confirm } = useConfirm()
  const { toast } = useToast()

  const activeCount = sites.filter(s => s.status === 'active').length

  const handleRefresh = () => {
    loadSites({ page })
  }

  const handleDeleteSite = async (site: Site) => {
    const ok = await confirm({
      title: '현장 삭제',
      description: `'${site.name}' 현장을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })

    if (!ok) return

    const result = await deleteSite(site.id)
    if (result.success) {
      toast({
        title: '삭제 완료',
        description: '현장이 성공적으로 삭제되었습니다.',
        variant: 'success',
      })
    } else {
      toast({
        title: '삭제 실패',
        description: result.error || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = (val: string) => {
    loadSites({ page: 1, status: val as StatusFilterOption })
  }

  const handleReset = () => {
    loadSites({ page: 1, search: '', status: 'all', sort: 'created_at', direction: 'desc' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {t('sites.title')}
          </h1>
          <p className="text-sm text-gray-500 font-medium">{t('sites.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-gray-100 dark:border-gray-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          <Link href="/dashboard/admin/sites/new">
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none transition-all">
              <Plus className="w-4 h-4 mr-2" />
              {t('sites.create')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <SiteStats
        total={total}
        activeCount={activeCount}
        statusFilterLabel={STATUS_LABELS[statusFilter]}
      />

      {/* Filters */}
      <SiteFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => loadSites({ page: 1 })}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        onReset={handleReset}
        loading={loading}
      />

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center rounded-2xl">
            <LoadingSpinner />
          </div>
        )}
        <SiteTable
          sites={sites}
          statsMap={statsMap}
          managersMap={managersMap}
          loading={loading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => loadSites({ page: 1, sort: key, direction: dir })}
          onDelete={handleDeleteSite}
        />
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-400">
          총{' '}
          <span className="text-gray-900 dark:text-gray-100 font-bold">
            {total.toLocaleString()}
          </span>
          개 현장
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Page{' '}
            <span className="text-gray-900 dark:text-gray-100 italic ml-1">
              {page} / {pages}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-gray-100 dark:border-gray-800"
              onClick={() => loadSites({ page: Math.max(page - 1, 1) })}
              disabled={loading || page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-gray-100 dark:border-gray-800"
              onClick={() => loadSites({ page: Math.min(page + 1, pages) })}
              disabled={loading || page >= pages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
