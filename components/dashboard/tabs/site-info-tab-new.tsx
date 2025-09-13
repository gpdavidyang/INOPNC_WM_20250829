'use client'

import { useState } from 'react'
import { MapPin, Phone, Copy, Navigation, Building } from 'lucide-react'

export default function SiteInfoTabNew() {
  const [showDetails, setShowDetails] = useState(false)
  
  // 현장 정보 (예시)
  const siteInfo = {
    name: '강남 현장',
    company: '현대건설',
    manager: '김현장',
    phone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123',
    accommodation: '서울시 강남구 논현동 123-45 원룸',
    safetyManager: '박안전',
    safetyPhone: '010-8765-4321',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    workers: 25,
    currentPhase: '골조공사'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Show toast notification
  }

  const openTmap = (address: string) => {
    // T맵 앱 또는 웹 열기
    const tmapUrl = `tmap://search?name=${encodeURIComponent(address)}`
    window.location.href = tmapUrl
  }

  return (
    <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
      {/* 현장 정보 카드 */}
      <div className="card">
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/images/brand/현장정보.png" 
              alt="현장정보" 
              style={{ width: '20px', height: '20px' }}
            />
            <h3 className="section-title" style={{ margin: 0 }}>
              {siteInfo.name}
            </h3>
          </div>
          <button 
            className="btn btn--outline"
            onClick={() => setShowDetails(!showDetails)}
            style={{ 
              padding: '6px 12px',
              minHeight: 'unset',
              height: 'auto',
              fontSize: '14px'
            }}
          >
            {showDetails ? '간단히' : '상세'}
          </button>
        </div>

        {/* 기본 정보 */}
        <div className="stack" style={{ gap: '12px' }}>
          {/* 소속 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building size={18} color="var(--muted)" />
            <div style={{ flex: 1 }}>
              <div className="t-cap">소속</div>
              <div style={{ fontWeight: 600 }}>{siteInfo.company}</div>
            </div>
          </div>

          {/* 현장 담당자 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={18} color="var(--muted)" />
            <div style={{ flex: 1 }}>
              <div className="t-cap">현장 담당자</div>
              <div style={{ fontWeight: 600 }}>
                {siteInfo.manager} ({siteInfo.phone})
              </div>
            </div>
            <button 
              className="btn btn--ghost"
              onClick={() => window.location.href = `tel:${siteInfo.phone}`}
              style={{ 
                padding: '6px',
                minHeight: 'unset',
                height: 'auto'
              }}
            >
              <Phone size={16} />
            </button>
          </div>

          {/* 안전 담당자 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={18} color="var(--muted)" />
            <div style={{ flex: 1 }}>
              <div className="t-cap">안전 담당자</div>
              <div style={{ fontWeight: 600 }}>
                {siteInfo.safetyManager} ({siteInfo.safetyPhone})
              </div>
            </div>
            <button 
              className="btn btn--ghost"
              onClick={() => window.location.href = `tel:${siteInfo.safetyPhone}`}
              style={{ 
                padding: '6px',
                minHeight: 'unset',
                height: 'auto'
              }}
            >
              <Phone size={16} />
            </button>
          </div>

          {/* 주소 */}
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <MapPin size={18} color="var(--muted)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div className="t-cap">주소</div>
              <div style={{ fontWeight: 600 }}>{siteInfo.address}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn--ghost"
                onClick={() => copyToClipboard(siteInfo.address)}
                style={{ 
                  padding: '6px',
                  minHeight: 'unset',
                  height: 'auto'
                }}
                title="복사"
              >
                <Copy size={16} />
              </button>
              <button 
                className="btn btn--ghost"
                onClick={() => openTmap(siteInfo.address)}
                style={{ 
                  padding: '6px',
                  minHeight: 'unset',
                  height: 'auto'
                }}
                title="T맵"
              >
                <Navigation size={16} />
              </button>
            </div>
          </div>

          {/* 숙소 */}
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <MapPin size={18} color="var(--muted)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div className="t-cap">숙소</div>
              <div style={{ fontWeight: 600 }}>{siteInfo.accommodation}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn--ghost"
                onClick={() => copyToClipboard(siteInfo.accommodation)}
                style={{ 
                  padding: '6px',
                  minHeight: 'unset',
                  height: 'auto'
                }}
                title="복사"
              >
                <Copy size={16} />
              </button>
              <button 
                className="btn btn--ghost"
                onClick={() => openTmap(siteInfo.accommodation)}
                style={{ 
                  padding: '6px',
                  minHeight: 'unset',
                  height: 'auto'
                }}
                title="T맵"
              >
                <Navigation size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 상세 정보 (토글) */}
        {showDetails && (
          <div style={{ 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)'
          }}>
            <div className="stack" style={{ gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div className="t-cap">공사 기간</div>
                  <div style={{ fontWeight: 600 }}>
                    {siteInfo.startDate} ~ {siteInfo.endDate}
                  </div>
                </div>
                <div>
                  <div className="t-cap">작업 인원</div>
                  <div style={{ fontWeight: 600 }}>{siteInfo.workers}명</div>
                </div>
              </div>
              <div>
                <div className="t-cap">현재 공정</div>
                <div style={{ fontWeight: 600 }}>{siteInfo.currentPhase}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 현장 자료 */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3 className="section-title" style={{ marginBottom: '12px' }}>현장 자료</h3>
        <div className="stack" style={{ gap: '8px' }}>
          <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
            <FileText size={18} />
            도면 자료
          </button>
          <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
            <FileText size={18} />
            안전 수칙
          </button>
          <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
            <FileText size={18} />
            작업 지침서
          </button>
        </div>
      </div>

      {/* 최근 작업 현장 */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3 className="section-title" style={{ marginBottom: '12px' }}>최근 작업 현장</h3>
        <div className="stack" style={{ gap: '8px' }}>
          <div 
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>판교 현장</div>
            <div className="t-cap">2025.01.10 작업</div>
          </div>
          <div 
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>송도 현장</div>
            <div className="t-cap">2025.01.08 작업</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing import
import { FileText } from 'lucide-react'