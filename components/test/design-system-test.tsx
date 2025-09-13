'use client'

export default function DesignSystemTest() {
  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1 className="brand-title">디자인 시스템 테스트</h1>
      
      {/* 색상 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">색상 팔레트</h2>
        <div className="row" style={{ gap: '16px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'var(--brand)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            Brand
          </div>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'var(--accent)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            Accent
          </div>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'var(--card)', 
            border: '1px solid var(--line)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Card
          </div>
        </div>
      </section>

      {/* 카드 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">카드 컴포넌트</h2>
        <div className="card">
          <h3 className="section-title">카드 제목</h3>
          <p className="t-body">이것은 카드 내용입니다. border: 1px solid #E6ECF4, padding: 14px, border-radius: 14px가 적용되어야 합니다.</p>
        </div>
      </section>

      {/* 버튼 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">버튼 컴포넌트</h2>
        <div className="row" style={{ gap: '12px' }}>
          <button className="btn btn--primary">Primary 버튼</button>
          <button className="btn btn--gray">Gray 버튼</button>
          <button className="btn btn--sky">Sky 버튼</button>
          <button className="btn btn--outline">Outline 버튼</button>
        </div>
      </section>

      {/* 빠른메뉴 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">빠른메뉴 (6개 고정)</h2>
        <ul className="quick-grid">
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/출력현황.png" alt="출력현황" />
              <span>출력현황</span>
            </a>
          </li>
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/작업일지.png" alt="작업일지" />
              <span>작업일지</span>
            </a>
          </li>
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/현장정보.png" alt="현장정보" />
              <span>현장정보</span>
            </a>
          </li>
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/문서함.png" alt="문서함" />
              <span>문서함</span>
            </a>
          </li>
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/본사요청.png" alt="본사요청" />
              <span>본사요청</span>
            </a>
          </li>
          <li>
            <a href="#" className="quick-item">
              <img src="/images/brand/재고관리.png" alt="재고관리" />
              <span>재고관리</span>
            </a>
          </li>
        </ul>
      </section>

      {/* 공지사항 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">공지사항</h2>
        <div className="card notice-card">
          <div className="notice-content">
            <div className="notice-item active">
              <span className="notice-text">
                <strong className="tag-label">[공지사항]</strong>
                시스템 점검 안내: 1월 15일 오전 2시~4시
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 입력 필드 테스트 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">입력 필드</h2>
        <div className="card">
          <h3 className="q">작업내용 기록</h3>
          <div className="stack" style={{ gap: '16px' }}>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>현장명</label>
              <input type="text" className="input" placeholder="현장을 선택하세요" />
            </div>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>근무시간</label>
              <input type="text" className="input" placeholder="8시간" />
            </div>
          </div>
        </div>
      </section>

      {/* CSS 변수 확인 */}
      <section className="stack" style={{ marginTop: '32px' }}>
        <h2 className="t-h2">CSS 변수 확인</h2>
        <div className="card">
          <pre style={{ fontSize: '12px', lineHeight: '1.5' }}>
            {`--brand: #1A254F
--accent: #0068FE
--card: #FFFFFF
--line: #E6ECF4
--text: #1A1A1A
--muted: #6B7280
--pad: 14px
--r: 14px
--btn-h: 44px`}
          </pre>
        </div>
      </section>
    </div>
  )
}