'use client'


interface TaskDetailProps {
  currentUser: unknown
  currentProfile: unknown
  task: unknown
  comments: unknown[]
  users: unknown[]
  projects: unknown[]
}

export default function TaskDetail({ 
  currentUser, 
  currentProfile, 
  task, 
  comments, 
  users,
  projects 
}: TaskDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || '',
    assigned_to: task?.assigned_to || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
  })

  const canEdit = currentProfile?.role === 'admin' || 
                  currentProfile?.role === 'manager' ||
                  task?.created_by === currentUser.id ||
                  task?.assigned_to === currentUser.id

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement when tasks table is created
      // const { error } = await supabase
      //   .from('tasks')
      //   .update({
      //     ...formData,
      //     project_id: formData.project_id || null,
      //     assigned_to: formData.assigned_to || null,
      //     due_date: formData.due_date || null,
      //     completed_at: formData.status === 'completed' && task?.status !== 'completed' 
      //       ? new Date().toISOString() 
      //       : task?.completed_at,
      //   })
      //   .eq('id', task?.id)

      // if (error) throw error

      alert('작업 수정 기능은 아직 구현 중입니다.')
      setIsEditing(false)
      // router.refresh()
    } catch (error: unknown) {
      alert('작업 수정 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    try {
      // TODO: Implement when comments table is created
      // const { error } = await supabase
      //   .from('comments')
      //   .insert({
      //     task_id: task?.id,
      //     user_id: currentUser.id,
      //     content: newComment,
      //   })

      // if (error) throw error

      alert('댓글 추가 기능은 아직 구현 중입니다.')
      setNewComment('')
      // router.refresh()
    } catch (error: unknown) {
      alert('댓글 추가 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: '대기 중',
      in_progress: '진행 중',
      completed: '완료됨',
      cancelled: '취소됨',
    }
    return labels[status as keyof typeof labels] || '대기 중'
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return badges[priority as keyof typeof badges] || badges.medium
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      urgent: '긴급',
    }
    return labels[priority as keyof typeof labels] || '보통'
  }

  return (
    <>
      <Navbar user={currentUser} profile={currentProfile} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                작업 상세
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/tasks"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                목록으로
              </Link>
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  수정
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  {isEditing ? (
                    <form onSubmit={handleUpdate}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">제목</label>
                          <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">설명</label>
                          <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">프로젝트</label>
                            <select
                              value={formData.project_id}
                              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">프로젝트 없음</option>
                              {Array.isArray(projects) && projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">담당자</label>
                            <select
                              value={formData.assigned_to}
                              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">미지정</option>
                              {Array.isArray(users) && users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name || user.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">상태</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="pending">대기 중</option>
                              <option value="in_progress">진행 중</option>
                              <option value="completed">완료됨</option>
                              <option value="cancelled">취소됨</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">우선순위</label>
                            <select
                              value={formData.priority}
                              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="low">낮음</option>
                              <option value="medium">보통</option>
                              <option value="high">높음</option>
                              <option value="urgent">긴급</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">마감일</label>
                          <input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false)
                              setFormData({
                                title: task.title,
                                description: task.description || '',
                                project_id: task.project_id || '',
                                assigned_to: task.assigned_to || '',
                                priority: task.priority,
                                status: task.status,
                                due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
                              })
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? '저장 중...' : '저장'}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {task.title}
                      </h3>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">설명</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {task.description || '설명 없음'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">프로젝트</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {task.project?.name || '프로젝트 없음'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">담당자</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {task.assigned_user?.full_name || task.assigned_user?.email || '미지정'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">생성자</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {task.created_user?.full_name || task.created_user?.email}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">마감일</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {task.due_date ? new Date(task.due_date).toLocaleString() : '없음'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">생성일</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(task.created_at).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    댓글 ({Array.isArray(comments) ? comments.length : 0})
                  </h3>
                </div>
                
                <div className="border-t border-gray-200">
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="p-4">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      className="mt-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      댓글 추가
                    </button>
                  </form>

                  {/* Comments List */}
                  <ul className="divide-y divide-gray-200">
                    {Array.isArray(comments) && comments.map((comment: unknown) => (
                      <li key={comment.id} className="px-4 py-4">
                        <div className="flex space-x-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                {comment.user?.full_name || comment.user?.email}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}