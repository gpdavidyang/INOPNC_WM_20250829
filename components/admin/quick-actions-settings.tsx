'use client'

import type { QuickAction } from '@/types'

interface QuickActionsSettingsProps {
  onUpdate?: () => void
}

// 사용 가능한 아이콘 목록
const AVAILABLE_ICONS = [
  { name: 'Users', icon: Users, label: '사용자' },
  { name: 'Building2', icon: Building2, label: '건물' },
  { name: 'DollarSign', icon: DollarSign, label: '달러' },
  { name: 'Package', icon: Package, label: '패키지' },
  { name: 'FileText', icon: FileText, label: '문서' },
  { name: 'Layers', icon: Layers, label: '레이어' },
  { name: 'Home', icon: Home, label: '홈' },
  { name: 'Search', icon: Search, label: '검색' },
  { name: 'Calendar', icon: Calendar, label: '달력' },
  { name: 'Bell', icon: Bell, label: '알림' },
  { name: 'Shield', icon: Shield, label: '보안' },
  { name: 'Monitor', icon: Monitor, label: '모니터' },
  { name: 'Database', icon: Database, label: '데이터베이스' },
  { name: 'Settings', icon: SettingsIcon, label: '설정' },
  { name: 'HelpCircle', icon: HelpCircle, label: '도움말' }
]

interface QuickActionFormData {
  title: string
  description: string
  icon_name: string
  link_url: string
  is_active: boolean
  display_order: number
}

const initialFormData: QuickActionFormData = {
  title: '',
  description: '',
  icon_name: 'Home',
  link_url: '',
  is_active: true,
  display_order: 0
}

export function QuickActionsSettings({ onUpdate }: QuickActionsSettingsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  const [isOpen, setIsOpen] = useState(false)
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null)
  const [formData, setFormData] = useState<QuickActionFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 빠른 작업 목록 불러오기
  const fetchQuickActions = async () => {
    try {
      const response = await fetch('/api/admin/quick-actions')
      if (!response.ok) throw new Error('Failed to fetch quick actions')
      
      const data = await response.json()
      setQuickActions(data.quickActions || [])
    } catch (error) {
      console.error('Error fetching quick actions:', error)
      setError('빠른 작업을 불러오는데 실패했습니다.')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchQuickActions()
    }
  }, [isOpen])

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = editingAction 
        ? `/api/admin/quick-actions/${editingAction.id}`
        : '/api/admin/quick-actions'
      
      const method = editingAction ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save quick action')
      }

      await fetchQuickActions()
      setFormData(initialFormData)
      setEditingAction(null)
      onUpdate?.()
    } catch (error) {
      console.error('Error saving quick action:', error)
      setError(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!confirm('이 빠른 작업을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/quick-actions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete quick action')

      await fetchQuickActions()
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting quick action:', error)
      setError('삭제에 실패했습니다.')
    }
  }

  // 편집 모드 시작
  const startEdit = (action: QuickAction) => {
    setEditingAction(action)
    setFormData({
      title: action.title,
      description: action.description || '',
      icon_name: action.icon_name,
      link_url: action.link_url,
      is_active: action.is_active,
      display_order: action.display_order
    })
  }

  // 편집 취소
  const cancelEdit = () => {
    setEditingAction(null)
    setFormData(initialFormData)
    setError(null)
  }

  // 아이콘 선택 렌더링
  const renderIconSelect = () => {
    const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === formData.icon_name)
    const IconComponent = selectedIcon?.icon || Home

    return (
      <Select value={formData.icon_name} onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <span>{selectedIcon?.label || formData.icon_name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_ICONS.map((icon) => {
            const IconComp = icon.icon
            return (
              <SelectItem key={icon.name} value={icon.name}>
                <div className="flex items-center gap-2">
                  <IconComp className="h-4 w-4" />
                  <span>{icon.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${
            touchMode === 'glove' ? 'h-12 w-12' : touchMode === 'precision' ? 'h-8 w-8' : 'h-10 w-10'
          } p-0`}
        >
          <Settings className={`${
            touchMode === 'glove' ? 'h-6 w-6' : 'h-4 w-4'
          }`} />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-4xl"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '64rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          gap: 0,
          overflow: 'hidden'
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            빠른 작업 설정
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-600`}>
                {error}
              </p>
            </div>
          )}

          {/* 새 빠른 작업 추가/편집 폼 */}
          <div className="border rounded-lg p-4">
            <h3 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-medium mb-4`}>
              {editingAction ? '빠른 작업 편집' : '새 빠른 작업 추가'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="예: 사용자 관리"
                  />
                </div>
                
                <div>
                  <Label htmlFor="icon">아이콘 *</Label>
                  {renderIconSelect()}
                </div>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="빠른 작업에 대한 설명을 입력하세요"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link_url">링크 URL *</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    required
                    placeholder="/dashboard/admin/users"
                  />
                </div>
                
                <div>
                  <Label htmlFor="display_order">표시 순서</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '저장 중...' : editingAction ? '수정' : '추가'}
                </Button>
                {editingAction && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    취소
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* 기존 빠른 작업 목록 */}
          <div>
            <h3 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-medium mb-4`}>
              현재 빠른 작업 목록
            </h3>
            
            <div className="space-y-2">
              {quickActions.map((action) => {
                const IconComponent = AVAILABLE_ICONS.find(icon => icon.name === action.icon_name)?.icon || Home
                
                return (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded ${action.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <IconComponent className={`h-4 w-4 ${action.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      
                      <div>
                        <h4 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium ${!action.is_active ? 'text-gray-500' : ''}`}>
                          {action.title}
                        </h4>
                        <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                          순서: {action.display_order} | URL: {action.link_url}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(action)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(action.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {quickActions.length === 0 && (
                <div className="text-center py-8">
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                    등록된 빠른 작업이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}