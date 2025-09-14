'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name?: string
  email: string
  role: string
  site_id?: string
}

interface MobileHomeWrapperProps {
  initialProfile: Profile
  initialUser: User
}

export const MobileHomeWrapper: React.FC<MobileHomeWrapperProps> = ({
  initialProfile,
  initialUser
}) => {
  // Render the mobile home page directly without client-side auth checks
  // since we've already validated the user and profile on the server
  return (
    <div className="min-h-screen bg-[#f5f7fb] font-['Noto_Sans_KR']">
      {/* Header */}
      <header className="appbar bg-white border-b border-[#e6eaf2] h-14 flex items-center px-4">
        <div className="flex items-center gap-3">
          <button className="w-5 h-5 text-[#1A254F]" aria-label="메뉴">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
          <a href="/mobile" className="brand-logo flex items-center">
            <img 
              src="https://postfiles.pstatic.net/MjAyNTA5MTBfMjk3/MDAxNzU3NDc4ODkwMTc3.lBcKNGpQIyCk5kkAruIKUApO23ml-EJeX7da8626bQQg.oMA0TTp0F8nLP6ICPLrGelEJMVNg6cS5fdLUsXBb7pUg.PNG/00_%EB%A1%9C%EA%B3%A0-%EC%84%B8%EB%A1%9C%EC%A1%B0%ED%95%A9_n.png?type=w3840"
              alt="INOPNC" 
              className="h-8"
            />
          </a>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="relative w-6 h-6 text-[#1A254F]" aria-label="알림">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <div className="w-8 h-8 bg-[#1A254F] rounded-full flex items-center justify-center text-white text-sm font-medium">
            {initialProfile?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 pb-20">
        {/* User Role Info for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Role: {initialProfile.role} | Email: {initialProfile.email}
            </p>
          </div>
        )}

        {/* Quick Menu Section */}
        <section id="qm-section" className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <img 
              src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjYz/MDAxNzU3MzczOTIzNjUy.938EaPjiHzNGNoECgw9vItJhy_4pR6ZYVq3-8Z3tJecg.pSbWcXNy1U9El6kYe8OpwKmCEwkZiWJUiIM2R1qL2Swg.PNG/Flash.png?type=w966"
              alt="" 
              className="w-4 h-4" 
            />
            <h3 className="text-[17px] font-bold text-[#1A254F] font-['Noto_Sans_KR']">빠른메뉴</h3>
          </div>
          <ul className="grid grid-cols-6 gap-1 list-none">
            <li>
              <a href="/mobile/worklog" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966"
                  alt="출력현황"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">출력현황</span>
              </a>
            </li>
            <li>
              <a href="/mobile/worklog" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966"
                  alt="작업일지"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">작업일지</span>
              </a>
            </li>
            <li>
              <a href="/mobile/sites" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966"
                  alt="현장정보"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">현장정보</span>
              </a>
            </li>
            <li>
              <a href="/mobile/documents" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966"
                  alt="문서함"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">문서함</span>
              </a>
            </li>
            <li>
              <a href="/mobile/requests" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966"
                  alt="본사요청"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">본사요청</span>
              </a>
            </li>
            <li>
              <a href="/mobile/materials" className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105">
                <img 
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTAg/MDAxNzU3MzczOTIzODc2.V3ORy11Kszltv6qJ6M3zt4qFtdNopNi1sYcrZALvFD0g.5ZpgJNYRXfyedL0hVpIfo1sxqgBPUAO9SmMjmKf7qZgg.PNG/%EC%9E%AC%EA%B3%A0%EA%B4%80%EB%A6%AC.png?type=w966"
                  alt="재고관리"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">재고관리</span>
              </a>
            </li>
          </ul>
        </section>

        {/* Notice Section */}
        <section id="notice-section" className="mb-3">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-5">
            <div className="notice-content">
              <div className="notice-item active">
                <span className="text-sm text-[#101828] font-medium">
                  📢 새로운 안전규정이 적용됩니다. 모든 작업자는 필수 안전장비를 착용해주세요.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] h-16">
        <ul className="flex h-full">
          <li className="flex-1">
            <a href="/mobile" className="flex flex-col items-center justify-center h-full text-[#2563eb] font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              <span className="text-xs">홈</span>
            </a>
          </li>
          <li className="flex-1">
            <a href="/mobile/worklog" className="flex flex-col items-center justify-center h-full text-[#6b7280]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
              </svg>
              <span className="text-xs">출력현황</span>
            </a>
          </li>
          <li className="flex-1">
            <a href="/mobile/worklog" className="flex flex-col items-center justify-center h-full text-[#6b7280]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
                <path d="M8 6h.01"/>
                <path d="M16 6h.01"/>
                <path d="M12 6h.01"/>
                <path d="M12 10h.01"/>
                <path d="M12 14h.01"/>
                <path d="M16 10h.01"/>
                <path d="M16 14h.01"/>
                <path d="M8 10h.01"/>
                <path d="M8 14h.01"/>
              </svg>
              <span className="text-xs">작업일지</span>
            </a>
          </li>
          <li className="flex-1">
            <a href="/mobile/sites" className="flex flex-col items-center justify-center h-full text-[#6b7280]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              <span className="text-xs">현장정보</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}