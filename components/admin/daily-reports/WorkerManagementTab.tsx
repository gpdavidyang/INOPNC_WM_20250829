'use client'


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
  onSaveComplete?: () => void
}

export default function WorkerManagementTab({ 
  reportId, 
  siteId, 
  isEditing, 
  onWorkersUpdate,
  onSaveComplete
}: WorkerManagementTabProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [newWorker, setNewWorker] = useState<{ name: string; hours: number } | null>(null)
  const [availableWorkers, setAvailableWorkers] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const workHourOptions = [
    { value: 0.5, label: '0.5' },
    { value: 1, label: '1.0' },
    { value: 1.5, label: '1.5' },
    { value: 2, label: '2.0' },
    { value: 2.5, label: '2.5' },
    { value: 3, label: '3.0' },
    { value: 3.5, label: '3.5' },
    { value: 4, label: '4.0' },
    { value: 4.5, label: '4.5' },
    { value: 5, label: '5.0' },
    { value: 5.5, label: '5.5' },
    { value: 6, label: '6.0' },
    { value: 6.5, label: '6.5' },
    { value: 7, label: '7.0' },
    { value: 7.5, label: '7.5' },
    { value: 8, label: '8.0' }
  ]

  useEffect(() => {
    fetchWorkers()
    fetchAvailableWorkers()
  }, [reportId])

  // Auto-hide save status after 3 seconds
  useEffect(() => {
    if (saveStatus.type) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/daily-reports/workers?reportId=${reportId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '작업자 정보를 불러오는데 실패했습니다')
      }

      const workersData = result.data || []
      setWorkers(workersData)
      
      if (onWorkersUpdate) {
        onWorkersUpdate(workersData.length)
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
      setError(error instanceof Error ? error.message : '작업자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWorkers = async () => {
    try {
      // Fetch available workers from profiles via API
      const response = await fetch('/api/admin/workers/available' + (siteId ? `?siteId=${siteId}` : ''), {
        method: 'GET',
        cache: 'no-store'
      })
      
      if (response.ok) {
        const result = await response.json()
        setAvailableWorkers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching available workers:', error)
      setAvailableWorkers([])
    }
  }

  const handleSaveWorker = async (workerId: string, name: string, hours: number) => {
    if (!name.trim() || hours <= 0) {
      setSaveStatus({ type: 'error', message: '작업자명과 공수를 올바르게 입력해주세요.' })
      return
    }

    try {
      setSaving(true)
      setSaveStatus({ type: null, message: '' })
      
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
      setSaveStatus({ type: 'success', message: '작업자 정보가 수정되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error saving worker:', error)
      setSaveStatus({ type: 'error', message: error instanceof Error ? error.message : '작업자 정보 수정에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddWorker = async () => {
    if (!newWorker || !newWorker.name.trim() || newWorker.hours <= 0) {
      setSaveStatus({ type: 'error', message: '작업자명과 공수를 올바르게 입력해주세요.' })
      return
    }

    try {
      setSaving(true)
      setSaveStatus({ type: null, message: '' })
      
      const payload = {
        daily_report_id: reportId,
        worker_name: newWorker.name.trim(),
        work_hours: newWorker.hours
      }

      const response = await fetch('/api/admin/daily-reports/workers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '작업자 추가에 실패했습니다')
      }

      setNewWorker(null)
      await fetchWorkers()
      setSaveStatus({ type: 'success', message: '작업자가 추가되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error adding worker:', error)
      setSaveStatus({ type: 'error', message: error instanceof Error ? error.message : '작업자 추가에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm('이 작업자를 삭제하시겠습니까?')) return

    try {
      setSaving(true)
      setSaveStatus({ type: null, message: '' })

      const response = await fetch(`/api/admin/daily-reports/workers?id=${workerId}&reportId=${reportId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '작업자 삭제에 실패했습니다')
      }

      await fetchWorkers()
      setSaveStatus({ type: 'success', message: '작업자가 삭제되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error deleting worker:', error)
      setSaveStatus({ type: 'error', message: error instanceof Error ? error.message : '작업자 삭제에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const calculateStats = () => {
    const totalWorkers = workers.length
    const totalManDays = workers.reduce((sum, w) => sum + Number(w.work_hours), 0)
    const averageManDays = totalWorkers > 0 ? totalManDays / totalWorkers : 0
    const totalHours = totalManDays * 8

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

  if (error && !isEditing) {
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
      {/* Save Status Alert */}
      {saveStatus.type && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
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
        {isEditing && !newWorker && (
          <button
            onClick={() => setNewWorker({ name: '', hours: 1 })}
            disabled={saving || editingWorkerId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                onEdit={() => {
                  setEditingWorkerId(worker.id)
                  setNewWorker(null)
                }}
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
                  {availableWorkers.length > 0 ? (
                    <CustomSelect
                      value={newWorker.name}
                      onValueChange={(value) => setNewWorker(prev => prev ? { ...prev, name: value } : null)}
                      disabled={saving}
                    >
                      <CustomSelectTrigger className="w-full h-10 bg-white border border-gray-300 text-gray-900">
                        <CustomSelectValue placeholder="작업자 선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white border border-gray-300">
                        {availableWorkers.map(worker => (
                          <CustomSelectItem key={worker.id} value={worker.full_name}>
                            {worker.full_name} ({worker.role === 'site_manager' ? '현장소장' : '작업자'})
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  ) : (
                    <input
                      type="text"
                      value={newWorker.name}
                      onChange={(e) => setNewWorker(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="작업자명 입력"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={newWorker.hours.toString()}
                    onValueChange={(value) => setNewWorker(prev => prev ? { ...prev, hours: parseFloat(value) } : null)}
                    disabled={saving}
                  >
                    <CustomSelectTrigger className="w-full h-10 bg-white border border-gray-300 text-gray-900">
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
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleAddWorker}
                      disabled={saving}
                      className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                      title="저장"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setNewWorker(null)}
                      disabled={saving}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
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
                      <p className="text-sm text-gray-500">위의 "작업자 추가" 버튼을 클릭하여 작업자를 등록하세요.</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {workers.length > 0 && (
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
          availableWorkers.length > 0 ? (
            <CustomSelect
              value={editName}
              onValueChange={(value) => setEditName(value)}
              disabled={saving}
            >
              <CustomSelectTrigger className="w-full h-10 bg-white border border-gray-300 text-gray-900">
                <CustomSelectValue placeholder="작업자 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent className="bg-white border border-gray-300">
                {availableWorkers.map(worker => (
                  <CustomSelectItem key={worker.id} value={worker.full_name}>
                    {worker.full_name} ({worker.role === 'site_manager' ? '현장소장' : '작업자'})
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          ) : (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="작업자명 입력"
              disabled={saving}
            />
          )
        ) : (
          <div className="text-sm font-medium text-gray-900">{worker.worker_name}</div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <CustomSelect
            value={editHours.toString()}
            onValueChange={(value) => setEditHours(parseFloat(value))}
            disabled={saving}
          >
            <CustomSelectTrigger className="w-full h-10 bg-white border border-gray-300 text-gray-900">
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
          <div className="text-sm text-gray-900">{Number(worker.work_hours).toFixed(1)}</div>
        )}
      </td>
      {isPageEditing && (
        <td className="px-4 py-3">
          <div className="flex gap-2 justify-center">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                  title="저장"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
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
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                  title="수정"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  disabled={saving}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
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