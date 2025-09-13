'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function HomeTabNew() {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const noticeIntervalRef = useRef<NodeJS.Timeout>()
  
  // 공지사항 데이터
  const notices = [
    { label: '[공지사항]', text: '시스템 점검 안내: 1월 15일 오전 2시~4시' },
    { label: '[업데이트]', text: '새로운 기능이 추가되었습니다' },
    { label: '[안내]', text: '안전교육 일정 안내' }
  ]

  // 공지사항 자동 슬라이드
  useEffect(() => {
    noticeIntervalRef.current = setInterval(() => {
      setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)
    }, 3000)

    return () => {
      if (noticeIntervalRef.current) {
        clearInterval(noticeIntervalRef.current)
      }
    }
  }, [notices.length])

  return (
    <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
      {/* 빠른메뉴 섹션 */}
      <section id="qm-section" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <img 
            src="/images/brand/Flash.png" 
            alt="" 
            style={{ width: '16px', height: '16px' }}
          />
          <h3 className="section-title">빠른메뉴</h3>
        </div>
        <ul className="quick-grid">
          <li>
            <Link href="/daily-reports" className="quick-item">
              <img src="/images/brand/출력현황.png" alt="출력현황" />
              <span>출력현황</span>
            </Link>
          </li>
          <li>
            <Link href="/daily-reports" className="quick-item">
              <img src="/images/brand/작업일지.png" alt="작업일지" />
              <span>작업일지</span>
            </Link>
          </li>
          <li>
            <Link href="/site-info" className="quick-item">
              <img src="/images/brand/현장정보.png" alt="현장정보" />
              <span>현장정보</span>
            </Link>
          </li>
          <li>
            <Link href="/documents" className="quick-item">
              <img src="/images/brand/문서함.png" alt="문서함" />
              <span>문서함</span>
            </Link>
          </li>
          <li>
            <Link href="/requests" className="quick-item">
              <img src="/images/brand/본사요청.png" alt="본사요청" />
              <span>본사요청</span>
            </Link>
          </li>
          <li>
            <Link href="/inventory" className="quick-item">
              <img src="/images/brand/재고관리.png" alt="재고관리" />
              <span>재고관리</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 공지사항 섹션 */}
      <section id="notice-section" style={{ marginBottom: '14px' }}>
        <div className="card notice-card">
          <div className="notice-content">
            {notices.map((notice, index) => (
              <div
                key={index}
                className={`notice-item ${index === currentNoticeIndex ? 'active' : ''}`}
              >
                <span className="notice-text">
                  <strong className="tag-label">{notice.label}</strong>
                  {notice.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 작업내용 기록 섹션 */}
      <section>
        <div className="card">
          <h3 className="q">작업내용 기록</h3>
          <div className="stack" style={{ gap: '16px' }}>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                현장명
              </label>
              <select className="input" style={{ width: '100%' }}>
                <option>현장을 선택하세요</option>
                <option>강남 현장</option>
                <option>판교 현장</option>
                <option>송도 현장</option>
              </select>
            </div>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                근무시간
              </label>
              <input 
                type="text" 
                className="input" 
                placeholder="8시간"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                작업내용
              </label>
              <textarea 
                className="input"
                placeholder="오늘의 작업내용을 입력하세요"
                style={{ 
                  width: '100%',
                  minHeight: '80px',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  resize: 'vertical'
                }}
              />
            </div>
            <button className="btn btn--primary" style={{ width: '100%' }}>
              작업내용 저장
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}