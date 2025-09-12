'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, FileText, Calendar, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface DailyReportsWorklogViewProps {
  profile: Profile
  sites: any[]
}

interface DailyReport {
  id: string
  work_date: string
  site_id: string
  status: string
  created_at: string
  sites?: {
    id: string
    name: string
  }
  work_descriptions?: any[]
  materials?: any[]
  workers?: any[]
}

export function DailyReportsWorklogView({ profile, sites }: DailyReportsWorklogViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState({
    totalReports: 0,
    totalSites: 0,
    completedReports: 0
  })

  // Load daily reports
  useEffect(() => {
    loadReports()
  }, [currentMonth, selectedSite])

  const loadReports = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      let query = supabase
        .from('daily_reports')
        .select(`
          *,
          sites (
            id,
            name
          ),
          work_descriptions (*),
          materials (*),
          workers: worker_assignments (*)
        `)
        .gte('work_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('work_date', format(endOfMonth, 'yyyy-MM-dd'))
        .order('work_date', { ascending: false })

      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading reports:', error)
        setReports([])
      } else {
        setReports(data || [])
        
        // Calculate statistics
        const uniqueSites = [...new Set((data || []).map(r => r.site_id))].length
        const completedReports = (data || []).filter(r => r.status === 'completed').length
        
        setMonthlyStats({
          totalReports: data?.length || 0,
          totalSites: uniqueSites,
          completedReports
        })
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const handleReportClick = (reportId: string) => {
    router.push(`/dashboard/daily-reports/${reportId}`)
  }

  const handleNewReport = () => {
    router.push('/dashboard/daily-reports/new')
  }

  // Group reports by date
  const reportsByDate = reports.reduce((acc, report) => {
    const date = report.work_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(report)
    return acc
  }, {} as Record<string, DailyReport[]>)

  return (
    <>
      {/* 현장조회필터 */}
      <div className="mb-3.5 site-filter-section">
        <label className="select-shell" aria-label="현장 선택">
          <div 
            className="box text-gray-900 dark:text-white"
            style={{ fontFamily: "'Noto Sans KR', system-ui, sans-serif", fontWeight: 600 }}
          >
            {selectedSite === 'all' ? '전체 현장' : sites.find(s => s.id === selectedSite)?.name || '현장 선택'}
          </div>
          <span className="arrow" aria-hidden="true">
            <ChevronLeft className="w-4 h-4 rotate-90" />
          </span>
          <select 
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="absolute inset-0 opacity-0"
          >
            <option value="all">전체 현장</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 월간 네비게이션 */}
      <section className="mt-3 cal-wrap">
        <div className="cal-head">
          <button 
            className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
          <button className="cal-title text-[18px] font-bold hover:text-[color:var(--brand)]">
            {format(currentMonth, 'yyyy년 M월')}
          </button>
          <button 
            className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
        </div>
      </section>

      {/* 월간 통계 */}
      <section className="mt-3.5 monthly-stats-section">
        <div className="stat-head flex items-center gap-2">
          <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <span className="stat-title">월간 작업일지 통계</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="stat stat-workdays">
            <div className="num">{monthlyStats.totalReports}</div>
            <div className="label">전체 일지</div>
          </div>
          <div className="stat stat-sites">
            <div className="num">{monthlyStats.totalSites}</div>
            <div className="label">현장수</div>
          </div>
          <div className="stat stat-hours">
            <div className="num">{monthlyStats.completedReports}</div>
            <div className="label">완료 일지</div>
          </div>
        </div>
      </section>

      {/* 작업일지 리스트 */}
      <section className="mt-4 report-list-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            작업일지 목록
          </h3>
          <button
            onClick={handleNewReport}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>새 일지</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-center">
              이번 달 작업일지가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(reportsByDate).map(([date, dateReports]) => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {format(new Date(date), 'M월 d일 (E)', { locale: ko })}
                  </span>
                </div>
                <div className="space-y-2 mt-2">
                  {dateReports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="report-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {report.sites?.name || '현장 정보 없음'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            작업인원: {report.workers?.length || 0}명
                          </div>
                        </div>
                        <div className={cn(
                          "status-badge",
                          report.status === 'completed' ? 'status-completed' : 'status-pending'
                        )}>
                          {report.status === 'completed' ? '완료' : '진행중'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        /* 현장 필터 스타일 */
        .site-filter-section {
          width: 100%;
        }
        
        .select-shell {
          position: relative;
          display: block;
          width: 100%;
        }
        
        .select-shell .box {
          width: 100%;
          height: 48px;
          padding: 0 48px 0 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .select-shell .arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        :global([data-theme="dark"]) .select-shell .box {
          background: #1f2937;
          border-color: #374151;
        }
        
        /* 캘린더 랩 스타일 */
        .cal-wrap {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .cal-wrap {
          background: #1f2937;
        }
        
        .cal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .cal-title {
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        
        /* 월간 통계 스타일 */
        .monthly-stats-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .monthly-stats-section {
          background: #1f2937;
        }
        
        .stat-head {
          margin-bottom: 12px;
        }
        
        .stat-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        
        :global([data-theme="dark"]) .stat-title {
          color: #f3f4f6;
        }
        
        .stat {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s ease;
        }
        
        :global([data-theme="dark"]) .stat {
          background: #111827;
        }
        
        .stat .num {
          font-size: 24px;
          font-weight: 700;
          color: #1A254F;
          margin-bottom: 4px;
        }
        
        :global([data-theme="dark"]) .stat .num {
          color: #2F6BFF;
        }
        
        .stat .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        
        :global([data-theme="dark"]) .stat .label {
          color: #9ca3af;
        }
        
        .stat-workdays {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
        }
        
        .stat-sites {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        
        .stat-hours {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        }
        
        :global([data-theme="dark"]) .stat-workdays {
          background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
        }
        
        :global([data-theme="dark"]) .stat-sites {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        }
        
        :global([data-theme="dark"]) .stat-hours {
          background: linear-gradient(135deg, #14532d 0%, #166534 100%);
        }
        
        /* 작업일지 리스트 스타일 */
        .report-list-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .report-list-section {
          background: #1f2937;
        }
        
        .btn-primary {
          background: #1A254F;
          color: white;
          border: none;
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          background: #2d3e6e;
          transform: translateY(-1px);
        }
        
        :global([data-theme="dark"]) .btn-primary {
          background: #2F6BFF;
        }
        
        :global([data-theme="dark"]) .btn-primary:hover {
          background: #1d4ed8;
        }
        
        .empty-state {
          padding: 48px 16px;
          text-align: center;
        }
        
        .date-group {
          margin-bottom: 16px;
        }
        
        .date-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }
        
        .report-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .report-card:hover {
          border-color: #9ca3af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .report-card {
          background: #111827;
          border-color: #374151;
        }
        
        :global([data-theme="dark"]) .report-card:hover {
          border-color: #4b5563;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-completed {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        :global([data-theme="dark"]) .status-completed {
          background: #166534;
          color: #dcfce7;
        }
        
        :global([data-theme="dark"]) .status-pending {
          background: #92400e;
          color: #fef3c7;
        }
      `}</style>
    </>
  )
}