'use client'


interface AnnouncementsTabProps {
  profile: Profile
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  target_roles: string[]
  target_sites: string[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export default function AnnouncementsTab({ profile }: AnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [filterAudience, setFilterAudience] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    priority: 'normal',
    target_roles: [],
    target_sites: [],
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadAnnouncements()
  }, [filterType, filterAudience])

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (!error && data) {
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Failed to load announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    try {
      const dataToSave = {
        ...formData,
        created_by: profile.id,
        updated_at: new Date().toISOString()
      }

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update(dataToSave)
          .eq('id', editingId)

        if (!error) {
          alert('공지사항이 수정되었습니다.')
          setEditingId(null)
        }
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([dataToSave])

        if (!error) {
          alert('공지사항이 등록되었습니다.')
          setShowAddForm(false)
        }
      }

      resetForm()
      await loadAnnouncements()
    } catch (error) {
      console.error('Failed to save announcement:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData(announcement)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (!error) {
        alert('공지사항이 삭제되었습니다.')
        await loadAnnouncements()
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (!error) {
        await loadAnnouncements()
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error)
    }
  }


  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_roles: [],
      target_sites: [],
      is_active: true
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const getAnnouncementIcon = () => {
    return <Bell className="h-5 w-5 text-blue-500" />
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: '낮음' },
      normal: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '보통' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', label: '높음' },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '긴급' }
    }
    const badge = badges[priority as keyof typeof badges] || badges.normal
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getRolesBadges = (roles: string[]) => {
    if (!roles || roles.length === 0) return null
    return roles.map((role, index) => (
      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-1">
        {role}
      </span>
    ))
  }

  const filteredAnnouncements = announcements.filter(announcement =>
    searchTerm === '' ||
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="공지사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 우선순위</option>
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            공지사항 작성
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingId ? '공지사항 수정' : '새 공지사항'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                우선순위
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as unknown })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성화</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              {editingId ? '수정' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            데이터를 불러오는 중...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getAnnouncementIcon()}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    {getPriorityBadge(announcement.priority)}
                    {getRolesBadges(announcement.target_roles)}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                    {announcement.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                    className={`p-2 rounded ${
                      announcement.is_active
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={announcement.is_active ? '활성화됨' : '비활성화됨'}
                  >
                    {announcement.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}