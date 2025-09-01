'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import { createClient } from '@/lib/supabase/client'

interface Worker {
  id: string
  worker_name: string
  work_hours: number
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  role: string
}

interface WorkerManagementTabProps {
  reportId: string
  siteId?: string
  isEditing: boolean
  onWorkersUpdate?: (totalWorkers: number) => void
}

export default function WorkerManagementTab({ 
  reportId, 
  siteId, 
  isEditing, 
  onWorkersUpdate 
}: WorkerManagementTabProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [newWorker, setNewWorker] = useState<{ name: string; hours: number } | null>(null)
  const [availableWorkers, setAvailableWorkers] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const workHourOptions = [
    { value: 0.5, label: '0.5' },
    { value: 1, label: '1.0' },
    { value: 1.5, label: '1.5' },
    { value: 2, label: '2.0' },
    { value: 2.5, label: '2.5' },
    { value: 3, label: '3.0' }
  ]

  useEffect(() => {
    console.log('=== WorkerManagementTab mounted/updated ===')
    console.log('reportId:', reportId)
    console.log('siteId:', siteId)
    fetchWorkers()
    fetchAvailableWorkers()
  }, [reportId, siteId])

  const runDebugCheck = async () => {
    console.log('=== RUNNING DEBUG CHECK ===')
    try {
      const response = await fetch(`/api/debug/workers?reportId=${reportId}`)
      const data = await response.json()
      console.log('Debug info:', data)
      setDebugInfo(data)
      
      // Show alert with key info
      alert(`Debug Info:
- Auth: ${data.auth?.hasUser ? 'Yes' : 'No'} (${data.auth?.userEmail})
- Reports Access: ${data.reports?.canAccess ? 'Yes' : 'No'} (${data.reports?.count} reports)
- Workers Read: ${data.workers?.canRead ? 'Yes' : 'No'} (${data.workers?.count} workers)
- Insert Test: ${data.insertTest?.success ? 'Success' : 'Failed'}
${data.insertTest?.error ? `- Insert Error: ${data.insertTest.error}` : ''}`)
    } catch (error) {
      console.error('Debug check failed:', error)
      alert('Debug check failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('=== FETCH WORKERS START ===')
      console.log('Report ID:', reportId)
      console.log('Timestamp:', new Date().toISOString())
      
      const url = `/api/admin/daily-reports/workers?reportId=${reportId}&t=${Date.now()}`
      console.log('Fetching from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('Response body:', result)
      
      if (!response.ok) {
        console.error('Response not OK:', {
          status: response.status,
          error: result.error,
          details: result.details
        })
        throw new Error(result.error || '작업자 정보를 불러오는데 실패했습니다')
      }

      const workersData = result.data || []
      console.log(`Found ${workersData.length} workers:`, workersData)
      setWorkers(workersData)
      
      // Call onWorkersUpdate if we have workers
      if (onWorkersUpdate && workersData.length > 0) {
        console.log('Calling onWorkersUpdate with count:', workersData.length)
        onWorkersUpdate(workersData.length)
      }
      
      console.log('=== FETCH WORKERS COMPLETE ===')
    } catch (error) {
      console.error('=== FETCH WORKERS ERROR ===')
      console.error('Error object:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      setError(error instanceof Error ? error.message : '작업자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWorkers = async () => {
    try {
      const supabase = createClient()
      
      if (siteId) {
        const { data: siteWorkers, error: siteError } = await supabase
          .from('site_workers')
          .select(`
            profiles:user_id (
              id,
              full_name,
              role
            )
          `)
          .eq('site_id', siteId)
          .eq('is_active', true)

        if (!siteError && siteWorkers && siteWorkers.length > 0) {
          const profiles = siteWorkers
            ?.map(sw => sw.profiles)
            .filter(p => p) as Profile[]
          setAvailableWorkers(profiles || [])
          return
        }
      }
      
      const { data: allWorkers, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager'])
        .order('full_name')
      
      if (workersError) throw workersError
      setAvailableWorkers(allWorkers || [])
    } catch (error) {
      console.error('Error fetching available workers:', error)
      setAvailableWorkers([])
    }
  }

  const handleSaveWorker = async (workerId: string, name: string, hours: number) => {
    if (!name.trim() || hours <= 0) {
      alert('작업자명과 공수를 올바르게 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/daily-reports/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workerId,
          worker_name: name.trim(),
          work_hours: hours
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '작업자 정보 수정에 실패했습니다')
      }

      await fetchWorkers()
      setEditingWorkerId(null)
      
      if (onWorkersUpdate) {
        onWorkersUpdate(workers.length)
      }

      alert('작업자 정보가 수정되었습니다.')
    } catch (error) {
      console.error('Error saving worker:', error)
      alert(error instanceof Error ? error.message : '작업자 정보 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddWorker = async () => {
    console.log('=== ADD WORKER START ===')
    console.log('New worker data:', newWorker)
    
    if (!newWorker || !newWorker.name.trim() || newWorker.hours <= 0) {
      console.error('Invalid worker data:', {
        hasNewWorker: !!newWorker,
        name: newWorker?.name,
        hours: newWorker?.hours
      })
      alert('작업자명과 공수를 올바르게 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        daily_report_id: reportId,
        worker_name: newWorker.name.trim(),
        work_hours: newWorker.hours
      }
      
      console.log('=== SENDING POST REQUEST ===')
      console.log('URL: /api/admin/daily-reports/workers')
      console.log('Method: POST')
      console.log('Payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/admin/daily-reports/workers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      console.log('Response received:')
      console.log('- Status:', response.status)
      console.log('- Status Text:', response.statusText)
      console.log('- OK:', response.ok)
      console.log('- Headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('Response body:', JSON.stringify(result, null, 2))
      
      if (!response.ok) {
        console.error('=== ADD WORKER FAILED ===')
        console.error('Error details:', {
          status: response.status,
          error: result.error,
          details: result.details
        })
        
        // Use debug endpoint for more info
        console.log('Running debug check...')
        const debugResponse = await fetch('/api/debug/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const debugData = await debugResponse.json()
        console.log('Debug response:', debugData)
        
        throw new Error(result.error || '작업자 추가에 실패했습니다')
      }

      console.log('=== ADD WORKER SUCCESS ===')
      console.log('Worker added:', result.data)
      
      setNewWorker(null)
      
      // Force refresh workers list
      console.log('Refreshing workers list after addition...')
      await fetchWorkers()
      
      // Double-check the data
      console.log('Current workers state after refresh:', workers)

      alert('작업자가 추가되었습니다.')
    } catch (error) {
      console.error('=== ADD WORKER ERROR ===')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      alert(error instanceof Error ? error.message : '작업자 추가에 실패했습니다.')
    } finally {
      setSaving(false)
      console.log('=== ADD WORKER END ===')
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm('이 작업자를 삭제하시겠습니까?')) return

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/daily-reports/workers?id=${workerId}&reportId=${reportId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '작업자 삭제에 실패했습니다')
      }

      await fetchWorkers()
      
      if (onWorkersUpdate) {
        onWorkersUpdate(Math.max(0, workers.length - 1))
      }

      alert('작업자가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting worker:', error)
      alert(error instanceof Error ? error.message : '작업자 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const calculateStats = () => {
    const totalWorkers = workers.length
    const totalManDays = workers.reduce((sum, w) => sum + Number(w.work_hours), 0)
    const averageManDays = totalWorkers > 0 ? totalManDays / totalWorkers : 0
    const totalHours = totalManDays * 8  // 공수를 시간으로 환산

    return {
      totalWorkers,
      totalManDays,
      averageManDays,
      totalHours
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">작업자 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchWorkers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={runDebugCheck}
          className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
        >
          🔍 Debug Check
        </button>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
        >
          {debugMode ? '🔒 Hide Debug' : '🔓 Show Debug'}
        </button>
      </div>

      {/* Debug Info Panel */}
      {debugMode && debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            작업자 관리
          </h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            총 {stats.totalWorkers}명
          </span>
        </div>
        {isEditing && (
          <button
            onClick={() => setNewWorker({ name: '', hours: 1 })}
            disabled={saving || newWorker !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            작업자 추가
          </button>
        )}
      </div>

      {/* Workers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업자명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                공수
              </th>
              {isEditing && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  작업
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {workers.map((worker, index) => (
              <WorkerRow
                key={worker.id}
                worker={worker}
                index={index + 1}
                isEditing={editingWorkerId === worker.id}
                isPageEditing={isEditing}
                availableWorkers={availableWorkers}
                workHourOptions={workHourOptions}
                onEdit={() => setEditingWorkerId(worker.id)}
                onSave={(name, hours) => handleSaveWorker(worker.id, name, hours)}
                onCancel={() => setEditingWorkerId(null)}
                onDelete={() => handleDeleteWorker(worker.id)}
                saving={saving}
              />
            ))}

            {/* Add New Worker Row */}
            {newWorker && isEditing && (
              <tr className="bg-blue-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {workers.length + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CustomSelect
                      value={newWorker.name}
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setNewWorker(prev => prev ? { ...prev, name: '' } : null)
                        } else {
                          setNewWorker(prev => prev ? { ...prev, name: value } : null)
                        }
                      }}
                    >
                      <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
                        <CustomSelectValue placeholder="작업자 선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white border border-gray-300">
                        {availableWorkers.length > 0 ? (
                          <>
                            {availableWorkers.map(worker => (
                              <CustomSelectItem key={worker.id} value={worker.full_name}>
                                {worker.full_name} ({worker.role === 'worker' ? '작업자' : worker.role === 'site_manager' ? '현장관리자' : worker.role})
                              </CustomSelectItem>
                            ))}
                            <CustomSelectItem value="custom">직접 입력</CustomSelectItem>
                          </>
                        ) : (
                          <>
                            <div className="px-2 py-1.5 text-sm text-gray-500">등록된 작업자가 없습니다</div>
                            <CustomSelectItem value="custom">직접 입력</CustomSelectItem>
                          </>
                        )}
                      </CustomSelectContent>
                    </CustomSelect>
                    {(newWorker.name === '' || !availableWorkers.some(w => w.full_name === newWorker.name)) && (
                      <input
                        type="text"
                        value={newWorker.name}
                        onChange={(e) => setNewWorker(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="작업자명 입력"
                        className="ml-2 w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={newWorker.hours.toString()}
                    onValueChange={(value) => setNewWorker(prev => prev ? { ...prev, hours: parseFloat(value) } : null)}
                  >
                    <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="bg-white border border-gray-300">
                      {workHourOptions.map(option => (
                        <CustomSelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddWorker}
                      disabled={saving}
                      className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      title="저장"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setNewWorker(null)}
                      disabled={saving}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                      title="취소"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {workers.length === 0 && !newWorker && (
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">등록된 작업자가 없습니다.</p>
                    {isEditing && (
                      <p className="text-sm text-gray-500">작업자를 추가하여 공수 정보를 관리해보세요.</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          요약 정보
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">총 작업자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkers}명</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">총 공수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalManDays.toFixed(1)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">평균 공수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageManDays.toFixed(1)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">총 작업시간</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}시간</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual Worker Row Component
interface WorkerRowProps {
  worker: Worker
  index: number
  isEditing: boolean
  isPageEditing: boolean
  availableWorkers: Profile[]
  workHourOptions: { value: number; label: string }[]
  onEdit: () => void
  onSave: (name: string, hours: number) => void
  onCancel: () => void
  onDelete: () => void
  saving: boolean
}

function WorkerRow({
  worker,
  index,
  isEditing,
  isPageEditing,
  availableWorkers,
  workHourOptions,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  saving
}: WorkerRowProps) {
  const [editName, setEditName] = useState(worker.worker_name)
  const [editHours, setEditHours] = useState(worker.work_hours)

  const handleSave = () => {
    if (editName.trim() && editHours > 0) {
      onSave(editName, editHours)
    }
  }

  return (
    <tr className={isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
      <td className="px-4 py-3 text-sm text-gray-900">
        {index}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <CustomSelect
              value={editName}
              onValueChange={(value) => {
                if (value === 'custom') {
                  setEditName('')
                } else {
                  setEditName(value)
                }
              }}
            >
              <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
                <CustomSelectValue />
              </CustomSelectTrigger>
              <CustomSelectContent className="bg-white border border-gray-300">
                {availableWorkers.map(w => (
                  <CustomSelectItem key={w.id} value={w.full_name}>
                    {w.full_name} ({w.role === 'worker' ? '작업자' : w.role})
                  </CustomSelectItem>
                ))}
                <CustomSelectItem value="custom">직접 입력</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
            {(editName === '' || !availableWorkers.some(w => w.full_name === editName)) && (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="ml-2 w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="작업자명 입력"
              />
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-900">{worker.worker_name}</div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <CustomSelect
            value={editHours.toString()}
            onValueChange={(value) => setEditHours(parseFloat(value))}
          >
            <CustomSelectTrigger className="w-full h-8 bg-white border border-gray-300 text-gray-900">
              <CustomSelectValue />
            </CustomSelectTrigger>
            <CustomSelectContent className="bg-white border border-gray-300">
              {workHourOptions.map(option => (
                <CustomSelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        ) : (
          <div className="text-sm text-gray-900">
            {Number(worker.work_hours).toFixed(1)}
            {Number(worker.work_hours) > 8 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                연장
              </span>
            )}
          </div>
        )}
      </td>
      {isPageEditing && (
        <td className="px-4 py-3">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                  title="저장"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                  title="취소"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  disabled={saving}
                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="수정"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  disabled={saving}
                  className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}