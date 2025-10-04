'use client'

import { t } from '@/lib/ui/strings'

import ShipmentRequestsTab from './tabs/ShipmentRequestsTab'

interface NPCMaterialManagementProps {
  profile?: Profile
}

export default function NPCMaterialManagement({ profile }: NPCMaterialManagementProps) {
  // Default profile for cases where it's not provided
  const defaultProfile: Profile = {
    id: 'temp-admin',
    name: 'System Admin',
    email: 'admin@inopnc.com',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const currentProfile = profile || defaultProfile
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'production' | 'shipment' | 'requests' | 'integrated'
  >('integrated')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const tabs = [
    {
      key: 'integrated',
      label: '통합재고현황',
      icon: Database,
      description: '전체 재고 현황 및 실시간 모니터링',
    },
    {
      key: 'inventory',
      label: '사용재고관리',
      icon: Package,
      description: '현장별 일자별 입고량, 사용량, 재고량 정보',
    },
    {
      key: 'production',
      label: '생산관리',
      icon: BarChart3,
      description: '일자별 생산량, 출고량, 잔고량 정보',
    },
    {
      key: 'shipment',
      label: '출고관리',
      icon: Truck,
      description: '출고 기록 및 배송 관리',
    },
    {
      key: 'requests',
      label: '출고요청 관리',
      icon: FileText,
      description: 'NPC-1000 출고 요청 관리',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              NPC-자재관리 시스템
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              NPC-1000 자재의 생산, 재고, 출고를 통합 관리합니다
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </button>
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
        {activeTab === 'integrated' && <IntegratedInventoryStatus profile={currentProfile} />}
        {activeTab === 'inventory' && <InventoryUsageTab profile={currentProfile} />}
        {activeTab === 'production' && <ProductionManagementTab profile={currentProfile} />}
        {activeTab === 'shipment' && <ShipmentManagementTab profile={currentProfile} />}
        {activeTab === 'requests' && <ShipmentRequestsTab profile={currentProfile} />}
      </div>
    </div>
  )
}
