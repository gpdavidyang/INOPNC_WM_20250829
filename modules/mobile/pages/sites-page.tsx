'use client'

import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'

export const SitesPage: React.FC = () => {
  const { profile } = useMobileUser()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Mock data
  const sites = [
    {
      id: 1,
      name: '부산 신축 현장',
      address: '부산광역시 해운대구 중동 1234-5',
      phone: '051-123-4567',
      manager: '김현장',
      status: 'active',
      progress: '75%',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      workers: 12,
      attachments: 3
    },
    {
      id: 2, 
      name: '서울 보수 현장',
      address: '서울특별시 강남구 테헤란로 123',
      phone: '02-987-6543',
      manager: '이관리',
      status: 'active',
      progress: '45%',
      startDate: '2025-02-01',
      endDate: '2025-07-15',
      workers: 8,
      attachments: 5
    },
    {
      id: 3,
      name: '대구 리모델링 현장',
      address: '대구광역시 중구 동성로 456-7',
      phone: '053-555-1234',
      manager: '박매니저',
      status: 'completed',
      progress: '100%',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      workers: 6,
      attachments: 8
    }
  ]

  const activeSites = sites.filter(site => site.status === 'active')
  const completedSites = sites.filter(site => site.status === 'completed')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'suspended':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'completed':
        return '완료'
      case 'suspended':
        return '중단'
      default:
        return '알 수 없음'
    }
  }

  const openTMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    // T맵 앱이 설치되어 있으면 앱으로, 없으면 웹으로
    const tmapAppUrl = `tmap://search?name=${encodedAddress}`
    const tmapWebUrl = `https://tmap.life/route/search?name=${encodedAddress}`
    
    try {
      window.location.href = tmapAppUrl
      // 앱이 없으면 웹으로 fallback
      setTimeout(() => {
        window.open(tmapWebUrl, '_blank')
      }, 1000)
    } catch (error) {
      window.open(tmapWebUrl, '_blank')
    }
  }

  const openKakaoMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    const kakaoMapUrl = `https://map.kakao.com/link/search/${encodedAddress}`
    window.open(kakaoMapUrl, '_blank')
  }

  return (
    <MobileLayout 
      title="현장정보" 
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
    >
      <div className="min-h-screen bg-[#f5f7fb] font-['Noto_Sans_KR']">
        {/* 날짜별 현장정보 필터 */}
        <div className="bg-white border-b border-[#e6eaf2] px-4 py-4">
          <div className="mb-3">
            <label className="text-sm font-semibold text-[#1A254F] mb-2 block">
              날짜별 현장정보
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 border border-[#e6eaf2] rounded-lg bg-white text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-[#0068FE]">{activeSites.length}</p>
              <p className="text-xs text-blue-700">진행중 현장</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-600">{sites.reduce((sum, site) => sum + site.workers, 0)}</p>
              <p className="text-xs text-green-700">전체 작업자</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-600">{completedSites.length}</p>
              <p className="text-xs text-gray-700">완료 현장</p>
            </div>
          </div>
        </div>

        {/* 현장 카드 목록 */}
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1A254F]">현장 목록</h3>
            <select className="px-3 py-1 border border-[#e6eaf2] rounded-lg text-sm">
              <option>전체 현장</option>
              <option>진행중 현장</option>
              <option>완료된 현장</option>
            </select>
          </div>

          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              {/* 현장 기본 정보 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[#1A254F]">{site.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                      {getStatusText(site.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{site.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>{site.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>담당: {site.manager} | 작업자 {site.workers}명</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 진행률 */}
              {site.status === 'active' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">진행률</span>
                    <span className="text-sm font-semibold text-[#0068FE]">{site.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#0068FE] h-2 rounded-full transition-all duration-300"
                      style={{ width: site.progress }}
                    />
                  </div>
                </div>
              )}

              {/* 기간 정보 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">시작일</p>
                    <p className="font-medium text-[#1A254F]">{site.startDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">완료일</p>
                    <p className="font-medium text-[#1A254F]">{site.endDate}</p>
                  </div>
                </div>
              </div>

              {/* 지도 연동 버튼 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                  onClick={() => openTMap(site.address)}
                  className="flex items-center justify-center gap-2 h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  T맵
                </button>
                <button 
                  onClick={() => openKakaoMap(site.address)}
                  className="flex items-center justify-center gap-2 h-10 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 active:scale-95 transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  카카오맵
                </button>
              </div>

              {/* 첨부파일 및 액션 버튼 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <span>첨부파일 {site.attachments}개</span>
                </div>
                <button className="px-4 py-2 bg-[#1A254F] text-white rounded-lg text-sm font-medium hover:bg-[#152041] active:scale-95 transition-all duration-200">
                  상세보기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 현장관리자 전용 메뉴 */}
        {profile?.role === 'site_manager' && (
          <div className="px-4 pb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <h3 className="text-lg font-bold text-[#1A254F] mb-3">현장관리자 메뉴</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="h-16 bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-blue-100 active:scale-95 transition-all duration-200">
                  <span className="text-xl">🏗️</span>
                  <span className="text-sm font-medium text-blue-700">현장 등록</span>
                </button>
                <button className="h-16 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-green-100 active:scale-95 transition-all duration-200">
                  <span className="text-xl">👥</span>
                  <span className="text-sm font-medium text-green-700">작업자 배정</span>
                </button>
                <button className="h-16 bg-orange-50 border border-orange-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-orange-100 active:scale-95 transition-all duration-200">
                  <span className="text-xl">📊</span>
                  <span className="text-sm font-medium text-orange-700">진행률 관리</span>
                </button>
                <button className="h-16 bg-purple-50 border border-purple-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-purple-100 active:scale-95 transition-all duration-200">
                  <span className="text-xl">📋</span>
                  <span className="text-sm font-medium text-purple-700">현장 보고서</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}