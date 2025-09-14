'use client'

import { MarkupEditor } from '@/components/markup/markup-editor'

interface DocumentsPageWithTabsProps {
  profile: unknown
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function DocumentsPageWithTabs({ profile, searchParams }: DocumentsPageWithTabsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // Get initial tab from search params or default to "my-documents"
  const initialTab = searchParams?.tab as string || 'my-documents'
  const initialSearch = searchParams?.search as string || ''
  
  const [activeTab, setActiveTab] = useState(initialTab)
  
  console.log('[DocumentsPageWithTabs] Rendering with activeTab:', activeTab)
  console.log('[DocumentsPageWithTabs] SearchParams:', searchParams)
  
  // Auto-switch to shared documents tab if searching for "공도면"
  useEffect(() => {
    if (initialSearch === '공도면') {
      setActiveTab('shared-documents')
    }
  }, [initialSearch])

  const tabs = [
    {
      id: 'my-documents',
      name: '내문서함',
      icon: FileText,
      description: '내가 업로드한 개인 문서'
    },
    {
      id: 'shared-documents', 
      name: '공유문서함',
      icon: Share2,
      description: '조직에서 공유한 문서'
    },
    {
      id: 'markup-editor',
      name: '도면마킹',
      icon: PenTool,
      description: '도면에 마킹 및 편집'
    }
  ]

  const currentTab = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="h-full flex flex-col space-y-px">
      {/* Compact Page Header - Mobile Optimized */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            문서함
          </h1>
          {currentTab && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {currentTab.description}
            </p>
          )}
        </div>
        
        {/* Compact User Info - Hidden on Mobile */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {profile?.role === 'worker' && '작업자'}
            {profile?.role === 'site_manager' && '현장관리자'}
            {profile?.role === 'customer_manager' && '파트너사'}
            {profile?.role === 'admin' && '관리자'}
            {profile?.role === 'system_admin' && '시스템관리자'}
          </div>
        </div>
      </div>

      {/* Tabs - Mobile Optimized with Touch Targets */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 gap-2 mb-2 bg-gray-100 dark:bg-gray-700 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center justify-center gap-2 text-sm h-12 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">{tab.name}</span>
                <span className="sm:hidden font-medium text-xs">{tab.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Contents */}
        <div className="flex-1 min-h-0">
          <TabsContent value="my-documents" className="h-full mt-0">
            <MyDocuments profile={profile} />
          </TabsContent>

          <TabsContent value="shared-documents" className="h-full mt-0">
            <SharedDocuments 
              profile={profile} 
              initialSearch={activeTab === 'shared-documents' ? initialSearch : undefined}
            />
          </TabsContent>

          <TabsContent value="markup-editor" className="h-full mt-0">
            <MarkupEditor profile={profile} />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}