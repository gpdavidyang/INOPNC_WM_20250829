'use client'

import RequestsTab from './tabs/RequestsTab'

interface CommunicationManagementProps {
  profile: Profile
}

export default function CommunicationManagement({ profile }: CommunicationManagementProps) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'requests'>('announcements')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const tabs = [
    {
      key: 'announcements',
      label: '알림 및 공지사항',
      icon: Bell,
      description: '전체 공지사항 및 알림 관리',
    },
    {
      key: 'requests',
      label: '본사 요청사항',
      icon: MessageSquare,
      description: '작업자/현장관리자/시공업체 요청사항',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">커뮤니케이션 관리</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              공지사항 관리 및 요청사항 처리
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as unknown)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                    mr-2 h-5 w-5
                    ${
                      isActive
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }
                  `}
                  />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-500/70' : 'text-gray-400'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {activeTab === 'announcements' && <AnnouncementsTab profile={profile} />}
        {activeTab === 'requests' && <RequestsTab profile={profile} />}
      </div>
    </div>
  )
}
