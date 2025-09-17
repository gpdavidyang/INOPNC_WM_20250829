'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Mock Auth Provider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockUser = {
    id: 'preview-user',
    email: 'preview@example.com',
    full_name: '미리보기 사용자',
    role: 'site_manager',
  }

  // Mock useAuth hook
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__mockAuth = {
        user: mockUser,
        profile: mockUser,
        loading: false,
        signOut: () => Promise.resolve(),
      }
    }
  }, [])

  return <>{children}</>
}

// 동적 임포트로 실제 컴포넌트 로드 (SSR 비활성화)
const HomePage = dynamic(() => import('@/modules/mobile/components/home/HomePage'), {
  ssr: false,
  loading: () => <div className="p-4">로딩 중...</div>,
})

const AttendancePage = dynamic(
  () => import('@/modules/mobile/components/attendance/attendance-page'),
  {
    ssr: false,
    loading: () => <div className="p-4">로딩 중...</div>,
  }
)

const WorkLogPage = dynamic(() => import('@/modules/mobile/components/worklog/WorkLogPage'), {
  ssr: false,
  loading: () => <div className="p-4">로딩 중...</div>,
})

export default function MobileRealPreviewPage() {
  const [currentView, setCurrentView] = useState<string>('home')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const components = {
    home: { name: '홈', Component: HomePage },
    attendance: { name: '출력정보', Component: AttendancePage },
    worklog: { name: '작업일지', Component: WorkLogPage },
  }

  const CurrentComponent = components[currentView as keyof typeof components]?.Component

  if (!isClient) {
    return <div className="min-h-screen bg-gray-100 p-4">로딩 중...</div>
  }

  return (
    <MockAuthProvider>
      <div className="min-h-screen bg-gray-100">
        {/* 탭 네비게이션 */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex gap-2 p-2 overflow-x-auto">
            {Object.entries(components).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  currentView === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>

        {/* 컴포넌트 렌더링 영역 */}
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 미리보기 모드: API 호출이 차단될 수 있습니다
              </p>
            </div>
            {CurrentComponent && <CurrentComponent />}
          </div>
        </div>
      </div>
    </MockAuthProvider>
  )
}
