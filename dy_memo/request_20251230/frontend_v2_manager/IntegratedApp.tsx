import React, { useState, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppNavigation from './apps/main/components/AppNavigation'

// Lazy load all apps
const MainApp = React.lazy(() =>
  import('./apps/main/App').then(module => ({ default: module.App }))
)
const MoneyApp = React.lazy(() => import('./apps/money/App'))
const DocApp = React.lazy(() => import('./apps/doc/App'))
const WorklogApp = React.lazy(() =>
  import('./apps/main/App').then(module => ({ default: module.App }))
)
const SiteApp = React.lazy(() =>
  import('./apps/main/App').then(module => ({ default: module.App }))
)
const InopncNaviApp = React.lazy(() => import('./apps/inopnc-navi/App'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
    </div>
  </div>
)

// App wrapper for individual apps
const AppWrapper: React.FC<{ appId: string }> = ({ appId }) => {
  switch (appId) {
    case 'main':
      return <MainApp />
    case 'money':
      return <MoneyApp />
    case 'doc':
      return <DocApp />
    case 'worklog':
      return <WorklogApp />
    case 'site':
      return <SiteApp />
    case 'inopnc-navi':
      return <InopncNaviApp />
    default:
      return <MainApp />
  }
}

const IntegratedApp: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string>('')
  const [showNavigation, setShowNavigation] = useState<boolean>(true)

  const handleAppSelect = (appId: string) => {
    setActiveApp(appId)
    setShowNavigation(false)
  }

  const handleBackToNavigation = () => {
    setShowNavigation(true)
    setActiveApp('')
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          {showNavigation ? (
            <AppNavigation onAppSelect={handleAppSelect} activeApp={activeApp} />
          ) : (
            <div className="relative">
              {/* Back button */}
              <button
                onClick={handleBackToNavigation}
                className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  앱 목록
                </span>
              </button>

              {/* App Container */}
              <div className="min-h-screen">
                <AppWrapper appId={activeApp} />
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </Router>
  )
}

export default IntegratedApp
