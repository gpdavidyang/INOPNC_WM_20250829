import React from 'react'
import { MapPin, Package, FileText, DollarSign, Home, Search } from 'lucide-react'

interface AppNavigationProps {
  onAppSelect: (appId: string) => void
  activeApp: string
}

const AppNavigation: React.FC<AppNavigationProps> = ({ onAppSelect, activeApp }) => {
  const apps = [
    {
      id: 'main',
      name: '메인',
      icon: Home,
      description: '대시보드 및 빠른메뉴',
      color: '#1a254f',
    },
    {
      id: 'worklog',
      name: '작업일지',
      icon: FileText,
      description: '현장 작업 일지 작성',
      color: '#0284c7',
    },
    {
      id: 'money',
      name: '출력현황',
      icon: DollarSign,
      description: '급여 및 작업량 관리',
      color: '#059669',
    },
    {
      id: 'doc',
      name: '문서함',
      icon: Package,
      description: '도면, 사진, 펀치 관리',
      color: '#7c3aed',
    },
    {
      id: 'site',
      name: '현장정보',
      icon: MapPin,
      description: '현장 상세 정보',
      color: '#dc2626',
    },
    {
      id: 'inopnc-navi',
      name: '네비게이션',
      icon: Search,
      description: '통합 검색 및 네비게이션',
      color: '#0891b2',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">INOPNC 통합 앱</h1>
          <p className="text-gray-600 dark:text-gray-400">
            모든 앱을 한 곳에서 관리하고 접근하세요
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => {
            const Icon = app.icon
            const isActive = activeApp === app.id

            return (
              <button
                key={app.id}
                onClick={() => onAppSelect(app.id)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-200 
                  hover:shadow-lg hover:scale-105 active:scale-95
                  ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                {/* App Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${app.color}15` }}
                >
                  <Icon
                    size={32}
                    style={{ color: app.color }}
                    className="transition-transform duration-200"
                  />
                </div>

                {/* App Info */}
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{app.description}</p>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }
                  `}
                  >
                    {isActive ? '실행 중' : '클릭하여 실행'}
                  </span>

                  {/* Arrow indicator */}
                  <div
                    className={`
                    transition-transform duration-200
                    ${isActive ? 'rotate-45' : 'rotate-0'}
                  `}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400 dark:text-gray-500"
                    >
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">빠른 실행</h2>
          <div className="flex flex-wrap gap-3">
            {apps.slice(0, 4).map(app => {
              const Icon = app.icon
              return (
                <button
                  key={`quick-${app.id}`}
                  onClick={() => onAppSelect(app.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  <Icon size={16} style={{ color: app.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {app.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppNavigation
