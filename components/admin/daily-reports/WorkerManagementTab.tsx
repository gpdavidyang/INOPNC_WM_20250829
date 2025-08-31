'use client'

import { useState, useEffect, useCallback } from 'react'
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
  AlertTriangle,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import WorkerDebugPanel from './WorkerDebugPanel'

interface Worker {
  id: string
  worker_name: string
  work_hours: number
  created_at: string
}

interface Site {
  id: string
  name: string
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
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const workHourOptions = [
    { value: 0.5, label: '0.5' },
    { value: 1, label: '1.0' },
    { value: 1.5, label: '1.5' },
    { value: 2, label: '2.0' },
    { value: 2.5, label: '2.5' },
    { value: 3, label: '3.0' }
  ]

  // Initialize Supabase client and check session
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = createClient()
        setSupabaseClient(client)
        
        // Check authentication status
        const { data: { session }, error } = await client.auth.getSession()
        if (error) {
          console.error('[WorkerManagementTab] Auth error:', error)
          setSessionError('Authentication error: ' + error.message)
        } else if (!session) {
          console.warn('[WorkerManagementTab] No active session found')
          setSessionError('No active session. Please refresh the page or log in again.')
        } else {
          console.log('[WorkerManagementTab] Session valid for:', session.user?.email)
          setSessionError(null)
        }
      } catch (err) {
        console.error('[WorkerManagementTab] Failed to initialize client:', err)
        setSessionError('Failed to initialize. Please refresh the page.')
      }
    }
    
    initializeClient()
  }, [])

  useEffect(() => {
    if (supabaseClient) {
      fetchWorkers()
      fetchAvailableWorkers() // Always fetch available workers
    }
  }, [reportId, siteId, supabaseClient])

  const fetchWorkers = async () => {
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('[WorkerManagementTab] Fetching workers for report:', reportId)
      
      const { data, error } = await supabaseClient
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', reportId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[WorkerManagementTab] Fetch error:', error)
        throw error
      }

      console.log('[WorkerManagementTab] Workers fetched:', data?.length || 0)
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
      setError('작업자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWorkers = async () => {
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      return
    }
    
    try {
      // If siteId is provided, first try to get site-specific workers
      if (siteId) {
        const { data: siteWorkers, error: siteError } = await supabaseClient
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
      
      // If no site-specific workers or no siteId, get all workers and site_managers
      const { data: allWorkers, error: workersError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager'])
        .order('full_name')
      
      if (workersError) throw workersError
      setAvailableWorkers(allWorkers || [])
    } catch (error) {
      console.error('Error fetching available workers:', error)
      // Still provide manual input option if fetching fails
      setAvailableWorkers([])
    }
  }

  const handleSaveWorker = async (workerId: string, name: string, hours: number) => {
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      alert('세션이 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }
    
    if (!name.trim() || hours <= 0) {
      alert('작업자명과 공수를 올바르게 입력해주세요.')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabaseClient
        .from('daily_report_workers')
        .update({
          worker_name: name.trim(),
          work_hours: hours
        })
        .eq('id', workerId)

      if (error) throw error

      await fetchWorkers()
      setEditingWorkerId(null)
      
      // 총 작업자 수 업데이트 알림
      const updatedWorkers = await supabaseClient
        .from('daily_report_workers')
        .select('id')
        .eq('daily_report_id', reportId)
      
      if (onWorkersUpdate && updatedWorkers.data) {
        onWorkersUpdate(updatedWorkers.data.length)
      }

      alert('작업자 정보가 수정되었습니다.')
    } catch (error) {
      console.error('Error saving worker:', error)
      alert('작업자 정보 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddWorker = useCallback(async () => {
    console.log('[WorkerManagementTab] handleAddWorker called with:', newWorker)
    
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      alert('세션이 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }
    
    if (!newWorker || !newWorker.name.trim() || newWorker.hours <= 0) {
      alert('작업자명과 공수를 올바르게 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Check session before insert
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
      if (sessionError || !session) {
        console.error('[WorkerManagementTab] Session check failed:', sessionError)
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.')
      }
      
      console.log('[WorkerManagementTab] Session valid, adding worker:', {
        daily_report_id: reportId,
        worker_name: newWorker.name.trim(),
        work_hours: newWorker.hours,
        user: session.user?.email
      })

      const { data: insertedData, error } = await supabaseClient
        .from('daily_report_workers')
        .insert({
          daily_report_id: reportId,
          worker_name: newWorker.name.trim(),
          work_hours: newWorker.hours
        })
        .select()
        .single()

      if (error) {
        console.error('[WorkerManagementTab] Insert error:', error)
        // Provide more detailed error information
        if (error.code === 'PGRST301') {
          throw new Error('인증 오류: 다시 로그인해주세요.')
        } else if (error.code === '23503') {
          throw new Error('일일보고서를 찾을 수 없습니다.')
        } else {
          throw error
        }
      }

      console.log('[WorkerManagementTab] Worker inserted successfully:', insertedData)

      // Clear the new worker form first
      setNewWorker(null)

      // Then fetch all workers again to ensure consistency
      await fetchWorkers()
      
      // Update total workers count
      if (onWorkersUpdate) {
        const { data: workersList } = await supabaseClient
          .from('daily_report_workers')
          .select('*')
          .eq('daily_report_id', reportId)
        
        onWorkersUpdate(workersList?.length || 0)
      }

      alert('작업자가 추가되었습니다.')
    } catch (error) {
      console.error('[WorkerManagementTab] Error adding worker:', error)
      const errorMessage = error instanceof Error ? error.message : '작업자 추가에 실패했습니다.'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [newWorker, reportId, supabaseClient, onWorkersUpdate])

  const handleDeleteWorker = async (workerId: string) => {
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      alert('세션이 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }
    
    if (!confirm('이 작업자를 삭제하시겠습니까?')) return

    try {
      setSaving(true)

      const { error } = await supabaseClient
        .from('daily_report_workers')
        .delete()
        .eq('id', workerId)

      if (error) throw error

      // Fetch all workers again to ensure consistency
      await fetchWorkers()
      
      // Update total workers count
      if (onWorkersUpdate) {
        const { data: workersList } = await supabaseClient
          .from('daily_report_workers')
          .select('*')
          .eq('daily_report_id', reportId)
        
        onWorkersUpdate(workersList?.length || 0)
      }

      alert('작업자가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting worker:', error)
      alert('작업자 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const updateTotalWorkers = async () => {
    if (!supabaseClient) {
      console.error('[WorkerManagementTab] Supabase client not initialized')
      return
    }
    
    try {
      const { data: workersList, error } = await supabaseClient
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', reportId)

      if (error) {
        console.error('Error counting workers:', error)
        return
      }

      const count = workersList?.length || 0

      // daily_reports 테이블의 total_workers 업데이트
      await supabaseClient
        .from('daily_reports')
        .update({ total_workers: count })
        .eq('id', reportId)

      if (onWorkersUpdate) {
        onWorkersUpdate(count)
      }
    } catch (error) {
      console.error('Error updating total workers:', error)
    }
  }

  const calculateStats = () => {
    const totalWorkers = workers.length
    const totalHours = workers.reduce((sum, w) => sum + w.work_hours, 0)
    const averageHours = totalWorkers > 0 ? totalHours / totalWorkers : 0
    const totalDays = totalHours / 8 // 8시간을 1일로 계산

    return {
      totalWorkers,
      totalHours,
      averageHours,
      totalDays
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
      {/* Session Error Alert */}
      {sessionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">인증 오류</h3>
              <p className="text-sm text-red-700 mt-1">{sessionError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
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
            disabled={saving || newWorker}
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
                        console.log('Worker name changed:', value)
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
                        onChange={(e) => {
                          console.log('Worker name input changed:', e.target.value)
                          setNewWorker(prev => prev ? { ...prev, name: e.target.value } : null)
                        }}
                        placeholder="작업자명 입력"
                        className="ml-2 w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={newWorker.hours.toString()}
                    onValueChange={(value) => {
                      console.log('Worker hours changed:', value)
                      setNewWorker(prev => prev ? { ...prev, hours: parseFloat(value) } : null)
                    }}
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
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('[WorkerManagementTab] Save button clicked, newWorker:', newWorker)
                        handleAddWorker()
                      }}
                      disabled={saving || !supabaseClient || !!sessionError}
                      className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={sessionError ? '인증 오류' : '저장'}
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        console.log('Cancel button clicked')
                        setNewWorker(null)
                      }}
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
          📊 요약 정보
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
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}시간</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.averageHours.toFixed(1)}시간</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">총 작업일</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays.toFixed(1)}일</p>
              </div>
            </div>
          </div>
        </div>
        
        {stats.totalWorkers > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>급여 계산 기준:</strong> 8시간을 1일로 환산하여 총 {stats.totalDays.toFixed(1)}일의 작업이 수행되었습니다.
              {stats.totalHours > stats.totalWorkers * 8 && (
                <span className="block mt-1">
                  ⚠️ 일부 작업자가 연장근무를 수행했습니다.
                </span>
              )}
            </p>
          </div>
        )}
      </div>
      
      {/* Debug Panel - Remove this after fixing the issue */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
          </button>
        </div>
      )}
      {showDebugPanel && (
        <WorkerDebugPanel 
          reportId={reportId} 
          onClose={() => setShowDebugPanel(false)}
        />
      )}
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
            {worker.work_hours}시간
            {worker.work_hours > 8 && (
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