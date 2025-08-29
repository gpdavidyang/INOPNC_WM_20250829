'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Bell, Megaphone, Info, AlertTriangle, AlertCircle,
  PlusCircle, Edit, Trash2, Save, X, Eye, EyeOff,
  Calendar, User, Clock, CheckCircle
} from 'lucide-react'

interface AnnouncementsTabProps {
  profile: Profile
}

interface Announcement {
  id: string
  title: string
  content: string
  type: 'notice' | 'alert' | 'info' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  target_audience: 'all' | 'workers' | 'managers' | 'partners' | 'admins'
  is_active: boolean
  is_pinned: boolean
  start_date?: string
  end_date?: string
  created_by: string
  created_at: string
  updated_at: string
  view_count?: number
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
    type: 'notice',
    priority: 'medium',
    target_audience: 'all',
    is_active: true,
    is_pinned: false,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: ''
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
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (filterType) {
        query = query.eq('type', filterType)
      }

      if (filterAudience) {
        query = query.eq('target_audience', filterAudience)
      }

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

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: !isPinned })
        .eq('id', id)

      if (!error) {
        await loadAnnouncements()
      }
    } catch (error) {
      console.error('Failed to toggle pin status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'notice',
      priority: 'medium',
      target_audience: 'all',
      is_active: true,
      is_pinned: false,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      notice: { icon: Bell, color: 'text-blue-500' },
      alert: { icon: AlertCircle, color: 'text-red-500' },
      info: { icon: Info, color: 'text-green-500' },
      warning: { icon: AlertTriangle, color: 'text-yellow-500' }
    }
    const config = icons[type as keyof typeof icons] || icons.notice
    const Icon = config.icon
    return <Icon className={`h-5 w-5 ${config.color}`} />
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: '낮음' },
      medium: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '보통' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', label: '높음' },
      critical: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '긴급' }
    }
    const badge = badges[priority as keyof typeof badges] || badges.medium
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getAudienceBadge = (audience: string) => {
    const labels: Record<string, string> = {
      all: '전체',
      workers: '작업자',
      managers: '관리자',
      partners: '파트너사',
      admins: '시스템관리자'
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        {labels[audience] || audience}
      </span>
    )
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
            <option value="">전체 유형</option>
            <option value="notice">공지</option>
            <option value="alert">알림</option>
            <option value="info">정보</option>
            <option value="warning">경고</option>
          </select>

          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 대상</option>
            <option value="all">전체</option>
            <option value="workers">작업자</option>
            <option value="managers">관리자</option>
            <option value="partners">파트너사</option>
            <option value="admins">시스템관리자</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    유형
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="notice">공지</option>
                    <option value="alert">알림</option>
                    <option value="info">정보</option>
                    <option value="warning">경고</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    우선순위
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="critical">긴급</option>
                  </select>
                </div>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  대상
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">전체</option>
                  <option value="workers">작업자</option>
                  <option value="managers">관리자</option>
                  <option value="partners">파트너사</option>
                  <option value="admins">시스템관리자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일 (선택)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성화</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">상단 고정</span>
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
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                announcement.is_pinned ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(announcement.type)}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    {announcement.is_pinned && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        고정됨
                      </span>
                    )}
                    {getPriorityBadge(announcement.priority)}
                    {getAudienceBadge(announcement.target_audience)}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                    {announcement.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {announcement.start_date}
                      {announcement.end_date && ` ~ ${announcement.end_date}`}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    {announcement.view_count && (
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {announcement.view_count}회
                      </div>
                    )}
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
                    onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                    className={`p-2 rounded ${
                      announcement.is_pinned
                        ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={announcement.is_pinned ? '고정 해제' : '상단 고정'}
                  >
                    <Megaphone className="h-4 w-4" />
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