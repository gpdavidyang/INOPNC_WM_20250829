'use client'


export function WorkOptionsManagement() {
  const [componentTypes, setComponentTypes] = useState<WorkOptionSetting[]>([])
  const [processTypes, setProcessTypes] = useState<WorkOptionSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [newComponentLabel, setNewComponentLabel] = useState('')
  const [newProcessLabel, setNewProcessLabel] = useState('')

  // Fetch options from API
  const fetchOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/work-options')
      if (!response.ok) throw new Error('Failed to fetch options')
      
      const data: WorkOptionSetting[] = await response.json()
      
      setComponentTypes(
        data
          .filter(opt => opt.option_type === 'component_type' && opt.is_active)
          .sort((a, b) => a.display_order - b.display_order)
      )
      
      setProcessTypes(
        data
          .filter(opt => opt.option_type === 'process_type' && opt.is_active)
          .sort((a, b) => a.display_order - b.display_order)
      )
    } catch (error) {
      console.error('Error fetching options:', error)
      toast.error('옵션을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    
    const loadData = async () => {
      if (!isCancelled) {
        await fetchOptions()
      }
    }
    
    loadData()
    
    return () => {
      isCancelled = true
    }
  }, [])

  // Add new option
  const handleAdd = async (type: 'component_type' | 'process_type', label: string) => {
    if (!label.trim()) {
      toast.error('라벨을 입력해주세요')
      return
    }

    try {
      const response = await fetch('/api/admin/work-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option_type: type,
          option_value: label.toLowerCase().replace(/\s+/g, '_'),
          option_label: label,
          display_order: type === 'component_type' 
            ? componentTypes.length + 1 
            : processTypes.length + 1
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add option')
      }

      toast.success('옵션이 추가되었습니다')
      
      // Clear input
      if (type === 'component_type') {
        setNewComponentLabel('')
      } else {
        setNewProcessLabel('')
      }
      
      // Refresh data
      await fetchOptions()
    } catch (error) {
      console.error('Error adding option:', error)
      toast.error(error instanceof Error ? error.message : '옵션 추가에 실패했습니다')
    }
  }

  // Update option
  const handleUpdate = async (id: string) => {
    if (!editingValue.trim()) {
      toast.error('라벨을 입력해주세요')
      return
    }

    try {
      const response = await fetch('/api/admin/work-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          option_label: editingValue
        })
      })

      if (!response.ok) throw new Error('Failed to update option')

      toast.success('옵션이 수정되었습니다')
      setEditingId(null)
      setEditingValue('')
      await fetchOptions()
    } catch (error) {
      console.error('Error updating option:', error)
      toast.error('옵션 수정에 실패했습니다')
    }
  }


  // Delete option (soft delete by setting is_active to false)
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 옵션을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/work-options?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete option')
      }

      toast.success('옵션이 삭제되었습니다')
      await fetchOptions()
    } catch (error) {
      console.error('Error deleting option:', error)
      toast.error(error instanceof Error ? error.message : '옵션 삭제에 실패했습니다')
    }
  }

  // Update display order
  const handleOrderChange = async (id: string, direction: 'up' | 'down', options: WorkOptionSetting[]) => {
    const index = options.findIndex(opt => opt.id === id)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === options.length - 1)) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const currentOption = options[index]
    const swapOption = options[newIndex]

    try {
      // Swap display orders
      await Promise.all([
        fetch('/api/admin/work-options', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentOption.id,
            display_order: swapOption.display_order
          })
        }),
        fetch('/api/admin/work-options', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: swapOption.id,
            display_order: currentOption.display_order
          })
        })
      ])

      toast.success('순서가 변경되었습니다')
      await fetchOptions()
    } catch (error) {
      console.error('Error changing order:', error)
      toast.error('순서 변경에 실패했습니다')
    }
  }

  // Render option list
  const renderOptionList = (options: WorkOptionSetting[], type: 'component_type' | 'process_type') => (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div
          key={option.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleOrderChange(option.id, 'up', options)}
                disabled={index === 0}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleOrderChange(option.id, 'down', options)}
                disabled={index === options.length - 1}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
            
            {editingId === option.id ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="max-w-xs"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleUpdate(option.id)
                }}
              />
            ) : (
              <div>
                <span className="font-medium">{option.option_label}</span>
                {option.option_value === 'other' && (
                  <span className="ml-2 text-xs text-gray-500">(기타 항목)</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {editingId === option.id ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdate(option.id)}
                  className="text-xs min-w-[40px] h-8 px-2 py-1 text-green-600 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  확인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setEditingValue('')
                  }}
                  className="text-xs min-w-[40px] h-8 px-2 py-1"
                >
                  취소
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(option.id)
                    setEditingValue(option.option_label)
                  }}
                  disabled={option.option_value === 'other'}
                  className="text-xs min-w-[40px] h-8 px-2 py-1 text-blue-600 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(option.id)}
                  disabled={option.option_value === 'other'}
                  className="text-xs min-w-[40px] h-8 px-2 py-1 text-red-600 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
      
      {/* Add new option */}
      <div className="flex items-center gap-2 mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <Input
          placeholder="새 옵션 라벨 입력"
          value={type === 'component_type' ? newComponentLabel : newProcessLabel}
          onChange={(e) => 
            type === 'component_type' 
              ? setNewComponentLabel(e.target.value)
              : setNewProcessLabel(e.target.value)
          }
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAdd(type, type === 'component_type' ? newComponentLabel : newProcessLabel)
            }
          }}
        />
        <Button
          onClick={() => handleAdd(type, type === 'component_type' ? newComponentLabel : newProcessLabel)}
          className="text-sm"
        >
          추가
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">옵션을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          작업 옵션 관리
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="component" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">
              <List className="h-4 w-4 mr-2" />
              부재명 관리
            </TabsTrigger>
            <TabsTrigger value="process">
              <List className="h-4 w-4 mr-2" />
              작업공정 관리
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="component" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">부재명 목록</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  작업일지에서 선택할 수 있는 부재명을 관리합니다.
                </p>
              </div>
              {renderOptionList(componentTypes, 'component_type')}
            </div>
          </TabsContent>
          
          <TabsContent value="process" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">작업공정 목록</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  작업일지에서 선택할 수 있는 작업공정을 관리합니다.
                </p>
              </div>
              {renderOptionList(processTypes, 'process_type')}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}