import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ChevronDown, Cloud, Sun } from 'lucide-react'
import { SiteCard, Site } from '../components/pmain/SiteCard'
import { Toast } from '../components/pmain/Toast'

const MainPage: React.FC = () => {
  const navigate = useNavigate()
  const [noticeIdx, setNoticeIdx] = useState(0)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'warning' }>({
    show: false,
    msg: '',
    type: 'success',
  })
  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500)
  }

  // 공지사항 데이터
  const notices = [
    {
      type: '공지',
      text: '동절기 현장 안전 관리 지침이 업데이트 되었습니다.',
      badgeClass: 'badge-notice',
    },
    {
      type: '업데이트',
      text: '작업완료확인서 PDF 저장 기능이 개선되었습니다.',
      badgeClass: 'badge-update',
    },
    { type: '안내', text: '금일 전국 현장 강추위 주의 바랍니다.', badgeClass: 'badge-notice' },
  ]

  // 현장 데이터
  const mySites: Site[] = [
    {
      id: 1,
      name: '성수자이 아파트 101동',
      status: 'ing',
      days: 120,
      mp: 450,
      address: '서울 성동구 성수동 1가 12-3',
      worker: 8,
      affil: '수도권지사',
      manager: '이현수',
      safety: '김안전',
      lastUpdate: '2025-12-24 08:30',
      hasDraw: true,
      hasPhoto: true,
      hasPTW: true,
      hasLog: true,
      hasAction: false,
    },
    {
      id: 2,
      name: '강남 타워 리모델링',
      status: 'wait',
      days: 15,
      mp: 85,
      address: '서울 강남구 역삼동 123-45',
      worker: 3,
      affil: '본사관리실',
      manager: '박현장',
      safety: '최안전',
      lastUpdate: '2025-12-24 09:00',
      hasDraw: true,
      hasPhoto: false,
      hasPTW: false,
      hasLog: true,
      hasAction: true,
    },
  ]

  // 날씨 정보
  const getWeather = (addr: string) => {
    if (addr.includes('성수동')) return { icon: <Cloud size={14} />, text: '흐림 2°C' }
    if (addr.includes('역삼동')) return { icon: <Cloud size={14} />, text: '흐림 2°C' }
    return { icon: <Sun size={14} />, text: '맑음 5°C' }
  }

  // 공지사항 슬라이더 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setNoticeIdx(prev => (prev + 1) % notices.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [notices.length])

  // Toggle expanded card
  const toggleExpanded = (id: number) => {
    const newSet = new Set(expandedCards)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedCards(newSet)
  }

  return (
    <div className="dashboard-wrapper">
      {/* Quick Menu */}
      <section className="quick-menu-section">
        <div className="qm-header">
          <div className="qm-title-group">
            <img
              src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/Flash.png?raw=true"
              alt="빠른메뉴"
              className="qm-title-icon-img"
            />
            <span className="qm-title">빠른메뉴</span>
          </div>
        </div>
        <div className="qm-grid">
          <div className="qm-item" onClick={() => navigate('/site')}>
            <div className="qm-icon-wrapper">
              <img
                className="qm-main-icon"
                src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/map.png?raw=true"
                alt="현장정보"
              />
            </div>
            <span className="qm-label">현장정보</span>
          </div>
          <div className="qm-item" onClick={() => navigate('/worklog')}>
            <div className="qm-icon-wrapper">
              <span className="qm-badge worklog">3</span>
              <img
                className="qm-main-icon"
                src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/report.png?raw=true"
                alt="작업일지"
              />
            </div>
            <span className="qm-label">작업일지</span>
          </div>
          <div className="qm-item" onClick={() => navigate('/print')}>
            <div className="qm-icon-wrapper">
              <img
                className="qm-main-icon"
                src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/pay.png?raw=true"
                alt="출력현황"
              />
            </div>
            <span className="qm-label">출력현황</span>
          </div>
          <div className="qm-item" onClick={() => navigate('/doc')}>
            <div className="qm-icon-wrapper">
              <img
                className="qm-main-icon"
                src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/doc.png?raw=true"
                alt="문서함"
              />
            </div>
            <span className="qm-label">문서함</span>
          </div>
          <div className="qm-item" onClick={() => navigate('/request')}>
            <div className="qm-icon-wrapper">
              <span className="qm-badge req">2</span>
              <img
                className="qm-main-icon"
                src="https://github.com/gpdavidyang/INOPNC_WM_20250829/blob/main/public/icons/request.png?raw=true"
                alt="본사요청"
              />
            </div>
            <span className="qm-label">본사요청</span>
          </div>
        </div>
      </section>

      {/* Notice Slider */}
      <div className="notice-slider-container">
        <div className="notice-wrapper">
          {notices.map((n, i) => (
            <div
              key={i}
              className={`notice-item ${i === noticeIdx ? 'active' : i === (noticeIdx - 1 + notices.length) % notices.length ? 'prev' : ''}`}
            >
              <span className={`notice-badge ${n.badgeClass}`}>{n.type}</span>
              <span className="notice-text">{n.text}</span>
            </div>
          ))}
        </div>
        <ChevronDown size={18} style={{ color: 'var(--text-sub)' }} />
      </div>

      {/* Summary Card */}
      <div className="summary-card-box">
        <div className="summary-header">
          <div className="summary-title-group">
            <MapPin size={20} style={{ color: 'var(--navy-dark)' }} />
            <span className="summary-title">최근 현장 투입현황</span>
          </div>
          <div className="summary-header-right">
            <span className="summary-date-badge">12.29 (월)</span>
            <button
              className="summary-view-all"
              onClick={() => {
                const siteCardList = document.getElementById('siteCardList')
                siteCardList?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              전체보기 <ChevronDown size={16} />
            </button>
          </div>
        </div>
        <div className="site-status-list">
          {mySites.map(s => (
            <div key={s.id} className="site-status-item">
              <span className="ss-name">{s.name}</span>
              <span className="ss-count">
                <Users size={18} /> {s.worker}명
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Site Cards List */}
      <div id="siteCardList">
        {mySites.map(s => {
          const weather = getWeather(s.address)
          const expanded = expandedCards.has(s.id)

          return (
            <SiteCard
              key={s.id}
              site={s}
              expanded={expanded}
              onToggleExpand={toggleExpanded}
              showToast={showToast}
              navigate={navigate}
              weather={weather}
            />
          )
        })}
      </div>

      {/* Toast Notification */}
      <Toast message={toast.msg} show={toast.show} type={toast.type} />
    </div>
  )
}

export default MainPage
export { MainPage }
