'use client'

import { useState, useEffect } from 'react'
import { Building2, FileText, Users, BarChart3, Calendar, Package, Shield, Image } from 'lucide-react'
import UnifiedSiteListView from './UnifiedSiteListView'
import UnifiedDailyReportListView from './UnifiedDailyReportListView'
import UnifiedUserListView from './UnifiedUserListView'
import UnifiedDocumentListView from './UnifiedDocumentListView'

interface DashboardStats {
  total_sites: number
  total_daily_reports: number
  total_users: number
  total_documents: number
  shared_documents: number
  markup_documents: number
  required_documents: number
  invoice_documents: number
}

export default function IntegratedDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'sites' | 'reports' | 'users' | 'documents'>('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load overview stats
      const [sitesRes, reportsRes, usersRes, docsRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/admin/daily-reports'),
        fetch('/api/admin/users'),
        fetch('/api/admin/documents/integrated')
      ])

      const sitesData = await sitesRes.json()
      const reportsData = await reportsRes.json()
      const usersData = await usersRes.json()
      const docsData = await docsRes.json()

      // Handle API response structures
      const sites = sitesData.success ? sitesData.data || [] : []
      const reports = reportsData.success ? reportsData.data || [] : []
      const users = usersData.success ? usersData.data || [] : []
      
      setSites(sites.filter(site => site.id !== 'all')) // Remove 'all' option for display
      
      setStats({
        total_sites: sites.length || 0,
        total_daily_reports: reports.length || 0,
        total_users: users.length || 0,
        total_documents: docsData.statistics?.total_documents || 0,
        shared_documents: docsData.statistics?.shared_documents || 0,
        markup_documents: docsData.statistics?.markup_documents || 0,
        required_documents: docsData.statistics?.required_documents || 0,
        invoice_documents: docsData.statistics?.invoice_documents || 0,
      })
      
      // Debug logging
      console.log('Dashboard Data Loaded:', {
        sites: sites.length,
        reports: reports.length,
        users: users.length,
        docs: docsData
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow ${onClick ? 'hover:bg-gray-50 dark:hover:bg-gray-750' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '전체 개요', icon: BarChart3 },
            { id: 'sites', name: '현장 통합뷰', icon: Building2 },
            { id: 'reports', name: '작업일지 통합뷰', icon: Calendar },
            { id: 'users', name: '사용자 통합뷰', icon: Users },
            { id: 'documents', name: '문서 통합뷰', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="전체 현장"
              value={stats?.total_sites || 0}
              icon={Building2}
              color="blue"
              onClick={() => setActiveView('sites')}
            />
            <StatCard
              title="일일보고서"
              value={stats?.total_daily_reports || 0}
              icon={Calendar}
              color="green"
              onClick={() => setActiveView('reports')}
            />
            <StatCard
              title="사용자"
              value={stats?.total_users || 0}
              icon={Users}
              color="purple"
              onClick={() => setActiveView('users')}
            />
            <StatCard
              title="전체 문서"
              value={stats?.total_documents || 0}
              icon={FileText}
              color="orange"
              onClick={() => setActiveView('documents')}
            />
          </div>

          {/* Document Category Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">문서함별 현황</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">공유문서함</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats?.shared_documents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center">
                  <Image className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">도면마킹문서함</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats?.markup_documents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">필수제출서류함</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats?.required_documents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">기성청구문서함</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.invoice_documents || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sites Quick View */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">최근 현장</h3>
              <button 
                onClick={() => setActiveView('sites')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                모든 현장 보기 →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sites.slice(0, 3).map((site) => (
                <div key={site.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{site.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{site.address}</p>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      site.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {site.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              ))}
              {sites.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">등록된 현장이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sites View */}
      {activeView === 'sites' && (
        <UnifiedSiteListView />
      )}

      {/* Reports View */}
      {activeView === 'reports' && (
        <UnifiedDailyReportListView />
      )}

      {/* Users View */}
      {activeView === 'users' && (
        <UnifiedUserListView />
      )}

      {/* Documents View */}
      {activeView === 'documents' && (
        <UnifiedDocumentListView />
      )}
    </div>
  )
}