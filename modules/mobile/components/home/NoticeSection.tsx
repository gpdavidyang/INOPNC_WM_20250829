'use client'

import React, { useState, useEffect } from 'react'

const notices = [
  {
    type: '공지사항',
    content: '시스템 점검 안내: 1월 15일 오전 2시~4시',
  },
  {
    type: '업데이트',
    content: '새로운 기능이 추가되었습니다. 확인해보세요!',
  },
  {
    type: '이벤트',
    content: '신규 회원 대상 특별 혜택 이벤트 진행 중',
  },
]

export const NoticeSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % notices.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="section mb-3.5">
      <div className="card notice-card">
        <div className="notice-content">
          {notices.map((notice, index) => (
            <div key={index} className={`notice-item ${index === activeIndex ? 'active' : ''}`}>
              <span className="notice-text">
                <strong className="tag-label">[{notice.type}]</strong>
                {notice.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
