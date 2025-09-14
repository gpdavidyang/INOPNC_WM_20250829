'use client'

import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'

export const TasksPage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'draft' | 'approved'>('draft')

  // Mock data
  const workLogs = [
    {
      id: 1,
      date: '2025-01-14',
      site: '현장 1',
      status: 'draft',
      content: '기둥 균열 보수작업',
      progress: '80%',
      hours: 8.0
    },
    {
      id: 2,
      date: '2025-01-13',
      site: '현장 2',
      status: 'approved',
      content: '슬래브 마감작업',
      progress: '100%',
      hours: 8.5
    },
    {
      id: 3,
      date: '2025-01-12',
      site: '현장 1',
      status: 'draft',
      content: '보 면정리 작업',
      progress: '60%',
      hours: 7.5
    },
    {
      id: 4,
      date: '2025-01-11',
      site: '현장 3',
      status: 'approved',
      content: '신축 기둥 설치',
      progress: '100%',
      hours: 9.0
    }
  ]

  const draftLogs = workLogs.filter(log => log.status === 'draft')
  const approvedLogs = workLogs.filter(log => log.status === 'approved')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-orange-100 text-orange-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '작성중'
      case 'approved':
        return '승인완료'
      default:
        return '알 수 없음'
    }
  }

  const currentLogs = activeTab === 'draft' ? draftLogs : approvedLogs

  return (
    <MobileLayout 
      title="작업일지" 
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
    >
      <div className="min-h-screen bg-[#f5f7fb] font-['Noto_Sans_KR']">
        {/* 상태별 탭 네비게이션 */}
        <div className="bg-white border-b border-[#e6eaf2]">
          <div className="px-4 pt-4">
            <div className="flex bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('draft')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'draft'
                    ? 'bg-white text-[#1A254F] shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                작성중
                {draftLogs.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {draftLogs.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'approved'
                    ? 'bg-white text-[#1A254F] shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                승인완료
                {approvedLogs.length > 0 && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {approvedLogs.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 현장 필터 */}
          <div className="px-4 py-3">
            <select className="w-full h-10 px-3 border border-[#e6eaf2] rounded-lg bg-white text-sm">
              <option>전체 현장</option>
              <option>현장 1</option>
              <option>현장 2</option>
              <option>현장 3</option>
            </select>
          </div>
        </div>

        {/* 작업일지 목록 */}
        <div className="px-4 py-4 space-y-3">
          {currentLogs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-[#101828] font-medium mb-2">
                {activeTab === 'draft' ? '작성중인 작업일지가 없습니다' : '승인된 작업일지가 없습니다'}
              </p>
              <p className="text-sm text-gray-600">
                {activeTab === 'draft' ? '새로운 작업일지를 작성해보세요' : '승인된 작업일지가 표시됩니다'}
              </p>
            </div>
          ) : (
            currentLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#1A254F]">{log.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-[#101828] mb-1">{log.content}</h3>
                    <p className="text-xs text-gray-600">현장: {log.site}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">공수</p>
                    <p className="text-sm font-semibold text-[#1A254F]">{log.hours}h</p>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">진행률</span>
                    <span className="text-xs font-medium text-[#0068FE]">{log.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#0068FE] h-2 rounded-full transition-all duration-300"
                      style={{ width: log.progress }}
                    />
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  {log.status === 'draft' ? (
                    <>
                      <button className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200">
                        수정하기
                      </button>
                      <button className="flex-1 h-10 bg-[#1A254F] text-white rounded-lg text-sm font-medium hover:bg-[#152041] active:scale-95 transition-all duration-200">
                        제출하기
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200">
                        상세보기
                      </button>
                      <button className="flex-1 h-10 bg-[#0068FE] text-white rounded-lg text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all duration-200">
                        인쇄하기
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 미작성 알림 바텀시트 (작성중 탭일 때만) */}
        {activeTab === 'draft' && draftLogs.length > 0 && (
          <div className="fixed bottom-20 left-4 right-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">!</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-800 mb-1">미완성 작업일지 알림</h4>
                <p className="text-xs text-orange-700">
                  {draftLogs.length}개의 작업일지가 미완성 상태입니다. 빠른 시일 내에 완성해주세요.
                </p>
              </div>
              <button className="text-orange-500 hover:text-orange-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" x2="6" y1="6" y2="18"/>
                  <line x1="6" x2="18" y1="6" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 플로팅 액션 버튼 */}
        <button className="fixed bottom-20 right-4 w-14 h-14 bg-[#1A254F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#152041] active:scale-95 transition-all duration-200">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" x2="12" y1="5" y2="19"/>
            <line x1="5" x2="19" y1="12" y2="12"/>
          </svg>
        </button>
      </div>
    </MobileLayout>
  )
}