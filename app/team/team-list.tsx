'use client'

import { createClient } from '@/lib/supabase/client'


interface TeamListProps {
  currentUser: unknown
  currentProfile: unknown
  teamMembers: unknown[]
}

export default function TeamList({ currentUser, currentProfile, teamMembers }: TeamListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<unknown>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    position: '',
    role: 'user' as 'admin' | 'manager' | 'user',
  })

  const isAdmin = currentProfile?.role === 'admin'

  const handleEdit = (member: unknown) => {
    setEditingMember(member)
    setFormData({
      full_name: member.full_name || '',
      department: member.department || '',
      position: member.position || '',
      role: member.role || 'user',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', editingMember.id)

    if (!error) {
      setShowEditModal(false)
      router.refresh()
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return badges[role as keyof typeof badges] || badges.user
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: '관리자',
      manager: '매니저',
      user: '팀원',
    }
    return labels[role as keyof typeof labels] || '팀원'
  }

  return (
    <>
      <Navbar user={currentUser} profile={currentProfile} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                팀원 목록
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                전체 {teamMembers.length}명의 팀원
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {teamMembers.map((member: unknown) => (
                <li key={member.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.full_name || member.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            {member.department && (
                              <span className="text-xs text-gray-500">{member.department}</span>
                            )}
                            {member.position && (
                              <span className="text-xs text-gray-500">• {member.position}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            수정
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    팀원 정보 수정
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        이름
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        부서
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        직책
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        역할
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as unknown })}
                        className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="user">팀원</option>
                        <option value="manager">매니저</option>
                        <option value="admin">관리자</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}