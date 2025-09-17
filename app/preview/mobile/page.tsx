'use client'

import { useState } from 'react'

export default function MobilePreviewPage() {
  const [currentView, setCurrentView] = useState<string>('list')
  const [selectedComponent, setSelectedComponent] = useState<string>('')

  // 미리보기할 모바일 컴포넌트 목록
  const mobileComponents = [
    { id: 'home', name: '홈 화면', path: '/modules/mobile/components/home/HomePage' },
    {
      id: 'attendance',
      name: '출력정보',
      path: '/modules/mobile/components/attendance/attendance-page',
    },
    { id: 'worklog', name: '작업일지', path: '/modules/mobile/components/worklog/WorkLogPage' },
    { id: 'sites', name: '현장정보', path: '/modules/mobile/components/sites/SitesPage' },
    { id: 'documents', name: '문서함', path: '/modules/mobile/components/documents/DocumentsPage' },
    { id: 'markup', name: '도면마킹', path: '/modules/mobile/components/markup/MarkupEditor' },
  ]

  const loadComponent = () => {
    if (!selectedComponent) return null

    try {
      // 각 컴포넌트를 조건부로 렌더링
      switch (selectedComponent) {
        case 'home':
          return (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold mb-4">홈 화면</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded">작업일지 작성</div>
                  <div className="bg-green-50 p-4 rounded">출력정보 확인</div>
                  <div className="bg-yellow-50 p-4 rounded">문서함</div>
                </div>
              </div>
            </div>
          )
        case 'attendance':
          return (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold">출력정보</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-blue-100 rounded">출력현황</button>
                    <button className="p-4 bg-green-100 rounded">급여현황</button>
                  </div>
                </div>
              </div>
            </div>
          )
        case 'worklog':
          return (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold mb-4">작업일지</h2>
                <div className="space-y-2">
                  <input className="w-full p-2 border rounded" placeholder="작업 제목" />
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={4}
                    placeholder="작업 내용"
                  />
                  <button className="w-full bg-blue-500 text-white p-2 rounded">저장</button>
                </div>
              </div>
            </div>
          )
        default:
          return <div className="p-4 text-center text-gray-500">컴포넌트 미리보기 준비 중...</div>
      }
    } catch (error) {
      return <div className="p-4 text-center text-red-500">컴포넌트 로드 실패: {String(error)}</div>
    }
  }

  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">📱 모바일 컴포넌트 미리보기</h1>
          <div className="space-y-2">
            {mobileComponents.map(comp => (
              <button
                key={comp.id}
                onClick={() => {
                  setSelectedComponent(comp.id)
                  setCurrentView('preview')
                }}
                className="w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="font-medium">{comp.name}</div>
                <div className="text-sm text-gray-500 mt-1">{comp.path}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => setCurrentView('list')} className="mr-4 text-blue-500">
            ← 목록
          </button>
          <h1 className="font-bold flex-1">
            {mobileComponents.find(c => c.id === selectedComponent)?.name}
          </h1>
        </div>
      </div>

      {/* Component Preview */}
      <div className="max-w-md mx-auto bg-white min-h-screen">{loadComponent()}</div>
    </div>
  )
}
