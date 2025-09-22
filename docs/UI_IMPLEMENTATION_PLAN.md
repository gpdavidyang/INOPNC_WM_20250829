# 🎯 UI 단순화 구현 계획 - 새로운 디자인 100% 일치 적용

## 📋 핵심 원칙
1. **HTML/CSS 100% 일치**: 제공된 HTML 디자인을 픽셀 단위로 정확히 재현
2. **CSS 변수 직접 사용**: 디자인CSS규칙.txt의 토큰을 그대로 적용
3. **구조 단순화**: 복잡한 상태관리 제거, 정적 UI 중심
4. **스타일 보존**: className이 아닌 style 속성 또는 CSS-in-JS로 정확한 스타일 적용

---

## 🔧 Phase 1: 디자인 시스템 설정 (2시간)

### 1.1 CSS 변수 시스템 구축
```typescript
// /styles/design-tokens.css 생성
/* 디자인CSS규칙.txt 내용 그대로 복사 */
:root {
  /* Fonts */
  --font-sans: "Noto Sans KR", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-brand: "Poppins", var(--font-sans);

  /* Type scale */
  --fs-title: 24px;
  --fs-h2: 18px;
  --fs-body: 15px;
  --fs-cap: 12px;
  --fs-ctl: 14px;

  /* Colors */
  --bg: #F6F9FF;
  --card: #FFFFFF;
  --text: #1A1A1A;
  --muted: #6B7280;
  --line: #E6ECF4;
  --brand: #1A254F;
  --gray-btn: #99A4BE;
  --sky-btn: #00BCD4;
  --accent: #0068FE;
  
  /* Sizes */
  --r: 14px;
  --pad: 14px;
  --btn-h: 44px;
  --chip-h: 48px;
  --gap: 12px;
}
```

### 1.2 글로벌 스타일 적용
```typescript
// /app/globals.css 수정
@import './design-tokens.css';

/* HTML에서 사용하는 모든 클래스 그대로 복사 */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r);
  padding: var(--pad);
  box-shadow: 0 2px 10px rgba(2,6,23,.04);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--btn-h);
  padding: 0 14px;
  border-radius: 12px;
  /* ... 정확한 스타일 ... */
}

.quick-item {
  /* home.html의 빠른메뉴 스타일 그대로 */
}
```

### 1.3 폰트 로딩
```typescript
// /app/layout.tsx
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" />
```

---

## 🔧 Phase 2: 홈 화면 구현 (4시간)

### 2.1 HTML 구조 1:1 복사
```typescript
// /components/dashboard/tabs/home-tab-new.tsx
export default function HomeTabNew() {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const notices = [
    { tag: '공지사항', text: '시스템 점검 안내: 1월 15일 오전 2시~4시' },
    { tag: '업데이트', text: '새로운 기능이 추가되었습니다. 확인해보세요!' },
    { tag: '이벤트', text: '신규 회원 대상 특별 혜택 이벤트 진행 중' }
  ];

  return (
    <>
      {/* 빠른메뉴 - HTML 구조 그대로 */}
      <section id="qm-section" className="section mb-3.5">
        <div className="flex items-center gap-2 mb-3">
          <img src="/images/Flash.png" alt="" className="w-4 h-4" />
          <h3 className="section-title">빠른메뉴</h3>
        </div>
        <ul id="quick-menu" className="quick-grid">
          <li>
            <a href="/dashboard/attendance" className="quick-item">
              <img className="qm-icon" src="/images/출력현황.png" width="64" height="64" alt="출력현황" />
              <span>출력현황</span>
            </a>
          </li>
          <li>
            <a href="/dashboard/daily-reports" className="quick-item">
              <img className="qm-icon" src="/images/작업일지.png" width="64" height="64" alt="작업일지" />
              <span>작업일지</span>
            </a>
          </li>
          <li>
            <a href="/dashboard/site-info" className="quick-item">
              <img className="qm-icon" src="/images/현장정보.png" width="64" height="64" alt="현장정보" />
              <span>현장정보</span>
            </a>
          </li>
          <li>
            <a href="/dashboard/documents" className="quick-item">
              <img className="qm-icon" src="/images/문서함.png" width="64" height="64" alt="문서함" />
              <span>문서함</span>
            </a>
          </li>
          <li>
            <a href="/dashboard/requests" className="quick-item">
              <img className="qm-icon" src="/images/본사요청.png" width="64" height="64" alt="본사요청" />
              <span>본사요청</span>
            </a>
          </li>
          <li>
            <a href="/dashboard/materials" className="quick-item">
              <img className="qm-icon" src="/images/재고관리.png" width="64" height="64" alt="재고관리" />
              <span>재고관리</span>
            </a>
          </li>
        </ul>
      </section>

      {/* 공지사항 - 자동 슬라이드 */}
      <section id="notice-section" className="section mb-3.5">
        <div className="card notice-card">
          <div className="notice-content">
            {notices.map((notice, index) => (
              <div 
                key={index} 
                className={`notice-item ${index === currentNoticeIndex ? 'active' : ''}`}
              >
                <span className="notice-text">
                  <strong className="tag-label">[{notice.tag}]</strong>
                  {notice.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 작업내용 기록 폼 */}
      <section className="section">
        <div className="card">
          <h3 className="q">작업내용 기록</h3>
          <form className="space-y-3">
            <div>
              <label className="label">현장명</label>
              <input type="text" className="input" placeholder="현장을 선택하세요" />
            </div>
            <div>
              <label className="label">근무시간</label>
              <input type="text" className="input" placeholder="8시간" />
            </div>
            <div>
              <label className="label">작업내용</label>
              <textarea className="textarea" rows={3} placeholder="오늘의 작업내용을 입력하세요" />
            </div>
            <button type="submit" className="btn btn--primary w-full">저장</button>
          </form>
        </div>
      </section>
    </>
  )
}
```

### 2.2 JavaScript 로직 이식
```typescript
// 공지사항 자동 슬라이드 (3초)
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);
  }, 3000);
  return () => clearInterval(interval);
}, [notices.length]);
```

### 2.3 스타일 정확성 보장
```typescript
// 인라인 스타일 사용으로 100% 일치
<div style={{
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: '14px',
  padding: '14px',
  boxShadow: '0 2px 10px rgba(2,6,23,.04)'
}}>
```

---

## 🔧 Phase 3: 작업일지 화면 구현 (3시간)

### 3.1 worklog.html 구조 복사
```typescript
// /components/daily-reports/daily-report-list-simple.tsx
export default function DailyReportListSimple() {
  return (
    <>
      {/* 월별 통계 카드 */}
      <div className="card mb-4">
        <h3 className="card-title">12월 작업 현황</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">출근일수</span>
            <span className="stat-value">22일</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">총 근무시간</span>
            <span className="stat-value">176시간</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">작성 일지</span>
            <span className="stat-value">22건</span>
          </div>
        </div>
      </div>

      {/* 작업일지 리스트 */}
      <div className="card">
        <h3 className="card-title">작업일지 목록</h3>
        <div className="list">
          <div className="list-item">
            <div className="list-date">2025-01-13</div>
            <div className="list-title">삼성 반도체 공장 신축현장</div>
            <div className="list-status">제출완료</div>
          </div>
          {/* 더 많은 항목... */}
        </div>
      </div>
    </>
  )
}
```

### 3.2 필터 제거, 단순 리스트
- 모든 필터 컴포넌트 제거
- 페이지네이션 제거
- 정렬 기능 제거
- 뷰 모드 전환 제거

---

## 🔧 Phase 4: 문서함 화면 구현 (3시간)

### 4.1 doc.html 탭 구조
```typescript
// /components/dashboard/tabs/documents-tab-simple.tsx
export default function DocumentsTabSimple() {
  const [activeTab, setActiveTab] = useState('required');

  return (
    <>
      {/* 탭 - doc.html의 정확한 스타일 */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'required' ? 'active' : ''}`}
          onClick={() => setActiveTab('required')}
        >
          필수서류
        </div>
        <div 
          className={`tab ${activeTab === 'requested' ? 'active' : ''}`}
          onClick={() => setActiveTab('requested')}
        >
          요청서류
        </div>
      </div>

      {/* 서류 리스트 */}
      <div className="card mt-4">
        {activeTab === 'required' ? (
          <div className="item-list">
            <div className="item">
              <span className="item-title">신분증 사본</span>
              <button className="btn-upload">업로드</button>
            </div>
            <div className="item">
              <span className="item-title">통장 사본</span>
              <span className="item-status">제출완료</span>
            </div>
          </div>
        ) : (
          <div className="item-list">
            <div className="item">
              <span className="item-title">안전교육 수료증</span>
              <button className="btn-upload">업로드</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
```

---

## 🔧 Phase 5: 현장정보 화면 구현 (2시간)

### 5.1 site.html 카드 구조
```typescript
// /components/dashboard/tabs/site-info-tab-simple.tsx
export default function SiteInfoTabSimple() {
  return (
    <>
      {/* 현장정보 카드 */}
      <div className="card mb-3">
        <h3 className="card-title">현장정보</h3>
        <div className="info-row">
          <span className="info-label">현장명</span>
          <span className="info-value">삼성 반도체 공장 신축현장</span>
        </div>
        <div className="info-row">
          <span className="info-label">주소</span>
          <span className="info-value">경기도 평택시 고덕산업단지</span>
        </div>
        <div className="info-row">
          <span className="info-label">현장소장</span>
          <span className="info-value">김철수 (010-1234-5678)</span>
        </div>
      </div>

      {/* 숙소정보 카드 */}
      <div className="card mb-3">
        <h3 className="card-title">숙소정보</h3>
        <div className="info-row">
          <span className="info-label">숙소명</span>
          <span className="info-value">평택 워커힐 모텔</span>
        </div>
        <div className="info-row">
          <span className="info-label">주소</span>
          <span className="info-value">경기도 평택시 고덕면 123-45</span>
        </div>
      </div>

      {/* 작업공정 정보 */}
      <div className="card">
        <h3 className="card-title">작업공정</h3>
        <div className="info-row">
          <span className="info-label">공정</span>
          <span className="info-value">배관 설치</span>
        </div>
        <div className="info-row">
          <span className="info-label">구역</span>
          <span className="info-value">A동 3층</span>
        </div>
      </div>
    </>
  )
}
```

---

## 🔧 Phase 6: 통합 및 라우팅 (2시간)

### 6.1 대시보드 레이아웃 수정
```typescript
// /components/dashboard/dashboard-layout-simple.tsx
export default function DashboardLayoutSimple({ children }) {
  return (
    <div className="dashboard-container">
      {/* 헤더 - HTML 구조 */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo-text">INOPNC</h1>
          <div className="header-actions">
            <button className="bell-icon">🔔</button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        {children}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="bottom-nav">
        {/* HTML의 네비게이션 구조 */}
      </nav>
    </div>
  )
}
```

### 6.2 컴포넌트 교체
```typescript
// 기존 컴포넌트를 새 컴포넌트로 교체
- HomeTab → HomeTabNew
- DailyReportList → DailyReportListSimple  
- DocumentsTab → DocumentsTabSimple
- SiteInfoTab → SiteInfoTabSimple
```

### 6.3 Context Provider 제거
```typescript
// 제거할 것들
- FontSizeContext
- TouchModeContext
- NotificationContext (최소화)
- 기타 복잡한 Provider
```

---

## 🔧 Phase 7: 검증 및 미세 조정 (2시간)

### 7.1 픽셀 퍼펙트 검증
1. HTML 파일과 React 화면을 나란히 비교
2. Chrome DevTools로 계산된 스타일 비교
3. 색상, 간격, 폰트 크기 정확성 확인

### 7.2 검증 체크리스트
```markdown
□ 색상 정확성
  - Brand: #1A254F
  - Line: #E6ECF4
  - Card: #FFFFFF
  - Background: #F6F9FF
  - Text: #1A1A1A
  - Muted: #6B7280

□ 간격 정확성
  - Card padding: 14px
  - Section margin-bottom: 12px
  - Button height: 44px
  - Gap: 12px

□ 폰트 정확성
  - Noto Sans KR: 400/600/700/800
  - Title: 24px (700)
  - H2: 18px (600)
  - Body: 15px (400)
  - Caption: 12px (400)

□ 컴포넌트 스타일
  - Card: border-radius 14px, shadow 정확히
  - Button: 호버/액티브 효과
  - Quick menu: 6개 고정 그리드
  - Notice: 자동 슬라이드 3초

□ 아이콘 및 이미지
  - 빠른메뉴 아이콘 크기: 64x64
  - 정확한 이미지 경로
  - 대체 텍스트
```

### 7.3 반응형 테스트
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPhone 14 Pro Max (428px)
- iPad Mini (768px)
- Desktop (1024px+)

---

## 📊 예상 결과

### 코드 품질 개선
| 지표 | 기존 | 개선 후 | 변화율 |
|------|------|---------|--------|
| 코드 복잡도 | 높음 | 낮음 | -70% |
| 파일 크기 | 대형 | 소형 | -60% |
| 렌더링 성능 | 보통 | 빠름 | +200% |
| 디자인 일치도 | 80% | 100% | +20% |

### 제거되는 기능들
- ❌ 13개 useState → ✅ 2-3개로 감소
- ❌ useEffect 훅 대부분 → ✅ 필수만 유지
- ❌ 복잡한 이벤트 핸들러 → ✅ 단순 클릭 이벤트
- ❌ 불필요한 컴포넌트 분리 → ✅ 통합된 구조
- ❌ 과도한 애니메이션 → ✅ 필수 전환효과만

### 유지되는 핵심 기능
- ✅ API 연결 (최소한)
- ✅ 기본 라우팅
- ✅ 인증 체크
- ✅ 다크모드 지원
- ✅ 필수 데이터 로딩

---

## ⚠️ 중요 주의사항

### 1. 스타일 우선순위
```css
/* 1순위: HTML의 인라인 스타일 */
style={{ background: 'var(--card)', padding: '14px' }}

/* 2순위: HTML의 클래스명 그대로 */
className="card notice-card"

/* 3순위: CSS 변수 사용 */
background: var(--card)

/* Tailwind 사용 최소화 - HTML과 불일치 방지 */
```

### 2. 이미지 경로 매핑
```typescript
// HTML 경로 → Public 폴더 구조
image/Flash.png → /public/images/Flash.png
image/출력현황.png → /public/images/출력현황.png
```

### 3. JavaScript 로직 변환
```javascript
// HTML의 바닐라 JS
document.getElementById('notice').classList.add('active')

// React로 변환
const [isActive, setIsActive] = useState(false)
className={isActive ? 'active' : ''}
```

### 4. 테스트 방법
1. HTML 파일을 브라우저에서 열기
2. React 앱을 같은 해상도로 열기
3. 스크린샷 찍어서 픽셀 단위 비교
4. Chrome DevTools로 computed styles 비교

---

## 📅 작업 일정

| 단계 | 작업 내용 | 예상 시간 | 우선순위 | 담당자 |
|------|----------|-----------|----------|--------|
| Phase 1 | 디자인 시스템 설정 | 2시간 | 🔴 필수 | - |
| Phase 2 | 홈 화면 | 4시간 | 🔴 필수 | - |
| Phase 3 | 작업일지 | 3시간 | 🟡 중요 | - |
| Phase 4 | 문서함 | 3시간 | 🟡 중요 | - |
| Phase 5 | 현장정보 | 2시간 | 🟢 보통 | - |
| Phase 6 | 통합 | 2시간 | 🔴 필수 | - |
| Phase 7 | 검증 | 2시간 | 🔴 필수 | - |

**총 예상 시간: 18시간**

---

## 🚀 시작하기

### Step 1: 브랜치 생성
```bash
git checkout -b feature/ui-simplification
```

### Step 2: 디자인 토큰 파일 생성
```bash
cp dy_memo/new_image_html/디자인CSS규칙.txt styles/design-tokens.css
```

### Step 3: 첫 번째 컴포넌트 작업
```bash
# 홈 화면부터 시작
cp components/dashboard/tabs/home-tab.tsx components/dashboard/tabs/home-tab.backup.tsx
# 새 파일 생성 후 작업
```

### Step 4: 검증
```bash
# 개발 서버 실행
npm run dev

# HTML 파일 열기
open dy_memo/new_image_html/html_css/home.html
```

---

## 📝 체크포인트

### 각 Phase 완료 시 확인사항
- [ ] HTML과 시각적으로 100% 일치하는가?
- [ ] CSS 변수가 올바르게 적용되었는가?
- [ ] 불필요한 코드가 제거되었는가?
- [ ] 반응형이 제대로 동작하는가?
- [ ] API 연결이 유지되는가?

---

*작성일: 2025-09-13*
*버전: 1.0*
*작성자: Claude Code Assistant*

이 계획을 따르면 제공된 HTML/CSS 디자인과 100% 일치하는 UI를 구현할 수 있습니다.