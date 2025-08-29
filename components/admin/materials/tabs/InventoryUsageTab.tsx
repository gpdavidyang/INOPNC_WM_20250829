'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Building2, Search, Download, TrendingUp, 
  TrendingDown, Package, AlertTriangle, FileText,
  ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react'

interface InventoryUsageTabProps {
  profile: Profile
}

interface InventoryData {
  id: string
  site_id: string
  site_name: string
  work_date: string
  incoming: number
  used: number
  remaining: number
  efficiency_rate: number
  status: 'normal' | 'low' | 'critical'
  created_by: string
  created_at: string
}

export default function InventoryUsageTab({ profile }: InventoryUsageTabProps) {
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'work_date' | 'site_name' | 'incoming' | 'used' | 'remaining' | 'efficiency_rate' | 'status'>('work_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const supabase = createClient()

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    loadInventoryData()
  }, [selectedSite, selectedMonth])

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (!error && data) {
        setSites(data)
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const loadInventoryData = async () => {
    setLoading(true)
    try {
      // Get daily reports with NPC-1000 data
      let query = supabase
        .from('daily_reports')
        .select(`
          id,
          site_id,
          work_date,
          npc1000_incoming,
          npc1000_used,
          npc1000_remaining,
          created_by,
          created_at,
          sites!site_id(name)
        `)
        .not('npc1000_incoming', 'is', null)
        .gte('work_date', `${selectedMonth}-01`)
        .lte('work_date', `${selectedMonth}-31`)
        .order('work_date', { ascending: false })

      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      const { data, error } = await query

      if (!error && data) {
        const formattedData: InventoryData[] = data.map(item => {
          const incoming = item.npc1000_incoming || 0
          const used = item.npc1000_used || 0
          const remaining = item.npc1000_remaining || 0
          const efficiency = incoming > 0 ? (used / incoming) * 100 : 0
          
          let status: 'normal' | 'low' | 'critical' = 'normal'
          if (remaining < 100) status = 'critical'
          else if (remaining < 500) status = 'low'

          return {
            id: item.id,
            site_id: item.site_id || '',
            site_name: (item as any).sites?.name || '알 수 없음',
            work_date: item.work_date,
            incoming: incoming,
            used: used,
            remaining: remaining,
            efficiency_rate: efficiency,
            status: status,
            created_by: item.created_by || '',
            created_at: item.created_at
          }
        })

        setInventoryData(formattedData)
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      normal: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: '정상' },
      low: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: '부족' },
      critical: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '긴급' }
    }
    const badge = badges[status as keyof typeof badges] || badges.normal
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const calculateTotals = () => {
    return inventoryData.reduce((acc, item) => ({
      totalIncoming: acc.totalIncoming + item.incoming,
      totalUsed: acc.totalUsed + item.used,
      totalRemaining: acc.totalRemaining + item.remaining,
      avgEfficiency: 0
    }), { totalIncoming: 0, totalUsed: 0, totalRemaining: 0, avgEfficiency: 0 })
  }

  const totals = calculateTotals()
  totals.avgEfficiency = totals.totalIncoming > 0 ? (totals.totalUsed / totals.totalIncoming) * 100 : 0

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (field !== sortField) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />
  }

  const sortedData = [...inventoryData].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    if (sortField === 'status') {
      const statusOrder = { critical: 0, low: 1, normal: 2 }
      aValue = statusOrder[aValue as keyof typeof statusOrder]
      bValue = statusOrder[bValue as keyof typeof statusOrder]
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredData = sortedData.filter(item => 
    searchTerm === '' || 
    item.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.work_date.includes(searchTerm)
  )

  const exportToCSV = () => {
    const headers = ['날짜', '현장명', '입고량', '사용량', '재고량', '효율(%)', '상태']
    const rows = filteredData.map(item => [
      item.work_date,
      item.site_name,
      item.incoming,
      item.used,
      item.remaining,
      item.efficiency_rate.toFixed(1),
      item.status === 'normal' ? '정상' : item.status === 'low' ? '부족' : '긴급'
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `NPC1000_재고현황_${selectedMonth}.csv`
    link.click()
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            현장 선택
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 현장</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            조회 월
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            검색
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="현장명, 날짜 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={exportToCSV}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV 다운로드
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">총 입고량</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totals.totalIncoming.toLocaleString()}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">총 사용량</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {totals.totalUsed.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">총 재고량</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {totals.totalRemaining.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">평균 효율</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {totals.avgEfficiency.toFixed(1)}%
              </p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('work_date')}
              >
                <div className="flex items-center gap-1">
                  날짜
                  {getSortIcon('work_date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('site_name')}
              >
                <div className="flex items-center gap-1">
                  현장명
                  {getSortIcon('site_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('incoming')}
              >
                <div className="flex items-center justify-end gap-1">
                  입고량
                  {getSortIcon('incoming')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('used')}
              >
                <div className="flex items-center justify-end gap-1">
                  사용량
                  {getSortIcon('used')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('remaining')}
              >
                <div className="flex items-center justify-end gap-1">
                  재고량
                  {getSortIcon('remaining')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('efficiency_rate')}
              >
                <div className="flex items-center justify-end gap-1">
                  효율(%)
                  {getSortIcon('efficiency_rate')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  상태
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.work_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {item.site_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {item.incoming.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {item.used.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {item.remaining.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {item.efficiency_rate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}