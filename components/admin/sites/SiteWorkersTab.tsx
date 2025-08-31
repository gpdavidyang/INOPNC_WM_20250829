'use client'

import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserMinus, Search, Filter, 
  CheckCircle, XCircle, AlertCircle, Building2,
  Phone, Mail, Calendar, Shield, HardHat, User
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Worker {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
  trade?: string // 공종
  position?: string // 직위
  company?: string // 소속회사
  assigned_at?: string
  is_assigned?: boolean
}

interface SiteWorkersTabProps {
  siteId: string
  siteName: string
}

export default function SiteWorkersTab({ siteId, siteName }: SiteWorkersTabProps) {
  const [assignedWorkers, setAssignedWorkers] = useState<Worker[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterTrade, setFilterTrade] = useState<string>('all')
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set())
  const [showAvailable, setShowAvailable] = useState(false)

  // console.log('SiteWorkersTab rendered with siteId:', siteId, 'siteName:', siteName)

  useEffect(() => {
    fetchWorkers()
  }, [siteId])

  const fetchWorkers = async () => {
    // console.log('Fetching workers for site:', siteId)
    try {
      setLoading(true)
      
      // Fetch assigned workers
      const assignedRes = await fetch(`/api/admin/sites/${siteId}/workers`)
      // console.log('Assigned workers response status:', assignedRes.status)
      if (assignedRes.ok) {
        const assignedData = await assignedRes.json()
        // console.log('Assigned workers data:', assignedData)
        setAssignedWorkers(assignedData.data || [])
      } else {
        console.error('Failed to fetch assigned workers:', assignedRes.status, assignedRes.statusText)
      }

      // Fetch all available workers
      const availableRes = await fetch(`/api/admin/sites/${siteId}/workers/available`)
      // console.log('Available workers response status:', availableRes.status)
      if (availableRes.ok) {
        const availableData = await availableRes.json()
        // console.log('Available workers data:', availableData)
        // console.log('Available workers count:', availableData.data?.length || 0)
        // console.log('First available worker:', availableData.data?.[0])
        setAvailableWorkers(availableData.data || [])
      } else {
        console.error('Failed to fetch available workers:', availableRes.status, availableRes.statusText)
        const errorText = await availableRes.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignWorkers = async () => {
    if (selectedWorkers.size === 0) return

    try {
      const response = await fetch(`/api/admin/sites/${siteId}/workers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_ids: Array.from(selectedWorkers)
        })
      })

      if (response.ok) {
        await fetchWorkers()
        setSelectedWorkers(new Set())
        setShowAvailable(false)
        alert('작업자가 성공적으로 배정되었습니다.')
      } else {
        alert('작업자 배정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error assigning workers:', error)
      alert('작업자 배정 중 오류가 발생했습니다.')
    }
  }

  const handleUnassignWorker = async (workerId: string) => {
    if (!confirm('이 작업자를 현장에서 제외하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/sites/${siteId}/workers/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId })
      })

      if (response.ok) {
        await fetchWorkers()
        alert('작업자가 현장에서 제외되었습니다.')
      } else {
        alert('작업자 제외에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error unassigning worker:', error)
      alert('작업자 제외 중 오류가 발생했습니다.')
    }
  }

  const toggleWorkerSelection = (workerId: string) => {
    const newSelection = new Set(selectedWorkers)
    if (newSelection.has(workerId)) {
      newSelection.delete(workerId)
    } else {
      newSelection.add(workerId)
    }
    setSelectedWorkers(newSelection)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: Shield },
      supervisor: { text: '감독관', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: User },
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: HardHat },
      safety_officer: { text: '안전관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: Shield },
      '작업자': { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: HardHat },
      '감독자': { text: '감독자', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: User },
      '안전관리자': { text: '안전관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: Shield },
      '현장관리자': { text: '현장관리자', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300', icon: Building2 }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.worker
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const filteredAssignedWorkers = assignedWorkers.filter(worker => {
    const matchesSearch = searchTerm === '' || 
      worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || worker.role === filterRole
    const matchesTrade = filterTrade === 'all' || worker.trade === filterTrade
    return matchesSearch && matchesRole && matchesTrade
  })

  const filteredAvailableWorkers = availableWorkers.filter(worker => {
    const matchesSearch = searchTerm === '' || 
      worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // More lenient role matching - include if no filter or if role contains the filter term
    const matchesRole = filterRole === 'all' || 
      !filterRole || 
      worker.role === filterRole ||
      worker.role?.toLowerCase().includes('worker') ||
      worker.role?.toLowerCase().includes('작업') ||
      worker.role?.toLowerCase().includes('현장')
    
    const matchesTrade = filterTrade === 'all' || !filterTrade || worker.trade === filterTrade
    
    return matchesSearch && matchesRole && matchesTrade
  })
  
  // console.log('Filtered available workers:', filteredAvailableWorkers.length, 'out of', availableWorkers.length)

  // Get unique trades for filter
  const allTrades = [...new Set([
    ...assignedWorkers.map(w => w.trade).filter(Boolean),
    ...availableWorkers.map(w => w.trade).filter(Boolean)
  ])]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">배정된 인원</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assignedWorkers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">작업자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {assignedWorkers.filter(w => w.role === 'worker').length}
              </p>
            </div>
            <HardHat className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">감독관</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {assignedWorkers.filter(w => w.role === 'supervisor').length}
              </p>
            </div>
            <User className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">공종 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {[...new Set(assignedWorkers.map(w => w.trade).filter(Boolean))].length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Header with search and filters - matching UserManagement layout */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="이름, 이메일, 소속 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex flex-row gap-2 flex-shrink-0">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="min-w-[120px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">모든 역할</option>
            <option value="worker">작업자</option>
            <option value="supervisor">감독관</option>
            <option value="safety_officer">안전관리자</option>
            <option value="admin">관리자</option>
          </select>

          {allTrades.length > 0 && (
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">모든 공종</option>
              {allTrades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setShowAvailable(!showAvailable)}
            className={`inline-flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showAvailable
                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showAvailable ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                취소
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                작업자 배정
              </>
            )}
          </button>
        </div>
      </div>

      {/* Available Workers Panel */}
      {showAvailable && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg border-2 border-blue-200 dark:border-blue-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            배정 가능한 작업자 선택
          </h3>
          
          {filteredAvailableWorkers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              배정 가능한 작업자가 없습니다.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {filteredAvailableWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedWorkers.has(worker.id)
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                    onClick={() => toggleWorkerSelection(worker.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          selectedWorkers.has(worker.id)
                            ? 'bg-blue-200 dark:bg-blue-800'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {worker.full_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {worker.email}
                          </p>
                          {worker.company && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {worker.company}
                            </p>
                          )}
                        </div>
                      </div>
                      {getRoleBadge(worker.role)}
                    </div>
                    {worker.trade && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        공종: {worker.trade}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedWorkers(new Set())}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  선택 초기화
                </button>
                <button
                  onClick={handleAssignWorkers}
                  disabled={selectedWorkers.size === 0}
                  className={`px-4 py-2 rounded-md font-medium ${
                    selectedWorkers.size > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {selectedWorkers.size}명 배정하기
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Assigned Workers Table - matching UserManagement layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredAssignedWorkers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterRole !== 'all' || filterTrade !== 'all'
                ? '검색 결과가 없습니다'
                : '배정된 작업자가 없습니다'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterRole !== 'all' || filterTrade !== 'all'
                ? '다른 조건으로 검색해 보세요'
                : '작업자 배정 버튼을 눌러 작업자를 현장에 배정하세요'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    공종/직위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    소속
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    배정일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssignedWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {worker.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {worker.email}
                          </div>
                          {worker.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {worker.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(worker.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {worker.trade || '-'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {worker.position || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {worker.company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {worker.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {worker.assigned_at 
                          ? format(new Date(worker.assigned_at), 'yyyy.MM.dd', { locale: ko })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUnassignWorker(worker.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="현장에서 제외"
                      >
                        <UserMinus className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}