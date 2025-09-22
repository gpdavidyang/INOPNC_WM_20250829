# 📊 INOPNC 모바일 화면 구현 현황 및 100% 디자인 일치 계획

## ⚠️ **핵심 원칙: HTML 디자인과 100% 픽셀 퍼펙트 구현**

HTML 문서(`/dy_memo/new_image_html/html_css/`)의 디자인, 레이아웃, 스타일을 **완벽하게** 일치시켜야 합니다.

---

## 🎨 **글로벌 UI 컴포넌트 (모든 페이지 공통)**

### 1. **상단 헤더 (Appbar)** - 고정 위치

```css
.appbar {
  position: fixed;
  top: 0;
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e6eaf2;
  z-index: 100;
}
```

**구성 요소:**

- 🍔 **햄버거 메뉴** (좌측) - 사이드바 열기
- 🏢 **INOPNC 로고** (24px 높이)
- **우측 액션 버튼들:**
  - 글씨 크기 스위치 (일반/확대)
  - 다크모드 토글 🌙
  - 검색 버튼 🔍
  - 알림 버튼 🔔 (배지 포함)

### 2. **사이드바 (Drawer)** - 슬라이드 메뉴

```css
.drawer {
  position: fixed;
  left: -320px; /* 숨김 상태 */
  width: 320px;
  height: 100%;
  background: #fff;
  transition: left 0.28s ease-out;
}
.drawer.show {
  left: 0;
}
```

**구성 요소:**

- **프로필 섹션**
  - 사용자 이름 + 역할 태그
  - 이메일 주소
- **메뉴 리스트**
  - 홈, 출력현황, 작업일지, 현장정보, 문서함
- **로그아웃 버튼** (하단 고정)

### 3. **하단 네비게이션** - 5개 탭

```css
nav {
  position: fixed;
  bottom: 0;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}
```

- 홈 | 출력현황 | 작업일지 | 현장정보 | **문서함** ✅

---

## 🔍 **현재 구현 상태 대비 차이점 분석**

### ❌ **완전 누락된 요소**

| 컴포넌트             | HTML 디자인         | 현재 상태    |
| -------------------- | ------------------- | ------------ |
| **사이드바**         | 320px 슬라이드 메뉴 | ❌ 구현 안됨 |
| **글씨 크기 스위치** | 일반/확대 토글      | ❌ 구현 안됨 |
| **검색 페이지**      | 전체화면 오버레이   | ❌ 구현 안됨 |
| **알림 배지**        | 빨간색 원형 배지    | ❌ 구현 안됨 |

### 🔄 **디자인 불일치 요소**

| 페이지       | HTML 요구사항    | 현재 상태       | 수정 필요사항    |
| ------------ | ---------------- | --------------- | ---------------- |
| **홈 화면**  | 작업일지 입력 폼 | 빠른메뉴만 있음 | 📝 전체 폼 추가  |
| **출력현황** | 2개 탭 구조      | 단일 페이지     | 📊 탭 구조 변경  |
| **작업일지** | 상태별 카드      | 단순 리스트     | 🗂️ 카드 UI 적용  |
| **현장정보** | 지도 연동        | 텍스트만        | 🗺️ 지도 API 추가 |
| **문서함**   | 2개 탭           | 3개 탭          | 📁 탭 구조 수정  |

---

## 🚀 **단계별 구현 계획**

### **Phase 0: 글로벌 컴포넌트 (2일)** 🆕

#### 0.1 상단 헤더 완벽 구현

```typescript
// components/mobile/AppBar.tsx
- 햄버거 메뉴 버튼 (drawer 토글)
- INOPNC 로고 (이미지)
- 글씨 크기 스위치 (body.fs-100 / body.fs-150)
- 다크모드 토글 (data-theme="dark")
- 검색 버튼 → 전체화면 검색 페이지
- 알림 버튼 + 배지 (glow 애니메이션)
```

#### 0.2 사이드바 (Drawer) 구현

```typescript
// components/mobile/Drawer.tsx
- 320px 너비, 좌측 슬라이드
- 프로필 섹션 (이름, 역할, 이메일)
- 메뉴 리스트 (5개 메뉴)
- 로그아웃 버튼
- 스크림(배경) 클릭 시 닫기
```

#### 0.3 검색 페이지 오버레이

```typescript
// components/mobile/SearchOverlay.tsx
- 전체화면 오버레이
- 상단 검색 입력창
- 최근 검색어 리스트
```

---

### **Phase 1: 홈페이지 100% 구현 (3일)** 🔥

#### 1.1 작업일지 입력 폼 섹션

**정확한 HTML 구조 복제:**

```html
<!-- 현장 선택 -->
<div class="card p-5 site-selection-card">
  <button class="chip" data-role="site">site1</button>
  <select id="siteSelect">
    ...
  </select>
</div>

<!-- 작성 정보 -->
<div class="card p-5">
  <input type="date" class="ctl" />
  <input type="text" placeholder="현장 미선택" readonly />
</div>

<!-- 작업 내용 기록 -->
<div class="card p-5 work-card">
  <!-- 부재명 칩들 -->
  <button class="chip" data-role="part">슬라브</button>
  <input class="custom-input" placeholder="기타 직접입력" />

  <!-- 작업공정 칩들 -->
  <button class="chip" data-role="proc">균열</button>

  <!-- 작업구간 -->
  <input placeholder="블럭/동/호수 입력" />
</div>

<!-- 사진업로드 -->
<div class="upload-chip-group">
  <button class="upload-chip">작업전</button>
  <button class="upload-chip">작업후</button>
  <button class="upload-chip">영수증</button>
  <button class="upload-chip">도면</button>
</div>

<!-- 공수입력 스테퍼 -->
<div class="stepper">
  <button>-</button>
  <input type="number" value="1.0" />
  <button>+</button>
</div>
```

#### 1.2 공지사항 자동 슬라이드

- 3초마다 세로 슬라이드 전환
- fadeIn/fadeOut 애니메이션

---

### **Phase 2: 핵심 화면 재구현 (5일)**

#### 2.1 출력현황 (`worklog.html`)

**탭 구조:**

```html
<nav class="line-tabs">
  <button class="line-tab active">출력현황</button>
  <button class="line-tab">급여현황</button>
</nav>
```

**출력현황 탭:**

- 현장 필터 select
- 캘린더 그리드
- 월간 통계 카드 (3개)

**급여현황 탭:**

- 급여 정보 입력 폼
- 급여명세서 요약 카드
- 미리보기/PDF 버튼
- 인라인 뷰어 (줌 기능)

#### 2.2 작업일지 (`task.html`)

- 상태별 분류 UI
- 작업일지 카드 디자인
- 작성/수정 모달

#### 2.3 현장정보 (`site.html`)

- 현장 카드 UI
- 지도 API 연동
- 첨부파일 관리

#### 2.4 문서함 (`doc.html`)

- 2개 탭으로 변경
- 필수서류 리스트
- 업로드 UI

---

### **Phase 3: 추가 페이지 (1일)**

#### 3.1 본사요청 페이지

- `/mobile/requests` 생성
- 요청 폼 UI

---

## 📐 **정확한 스타일 가이드**

### CSS 변수 (필수)

```css
:root {
  --font: 'Noto Sans KR', system-ui, sans-serif;
  --bg: #f5f7fb;
  --card: #ffffff;
  --text: #101828;
  --muted: #667085;
  --line: #e6eaf2;
  --brand: #1a254f;
  --num: #0068fe;
  --header-h: 56px;
  --nav-h: 64px;
}
```

### 컴포넌트 스타일 명세

#### 칩 버튼

- 높이: **48px**
- 패딩: **0 12px**
- 보더: **1px solid #E6ECF4**
- 반경: **12px**
- 폰트: **600 15px 'Noto Sans KR'**
- 선택 시: 배경 **#EFF6FF**, 색상 **#1A56DB**

#### 카드

- 배경: **#ffffff**
- 보더: **1px solid #e6eaf2**
- 반경: **14px**
- 패딩: **20px**
- 그림자: **0 2px 10px rgba(2,6,23,.04)**

#### 버튼

- 저장: **#1A254F** (네이비)
- 수정: **#99A4BE** (그레이)
- 초기화: **#dc2626** (레드)

---

## ✅ **구현 체크리스트**

### 글로벌 컴포넌트

- [ ] 상단 헤더 (100% 일치)
- [ ] 사이드바 메뉴 (320px)
- [ ] 하단 네비게이션 (5개 탭)
- [ ] 검색 오버레이
- [ ] 글씨 크기 스위치
- [ ] 다크모드 토글

### 페이지별

- [ ] 홈: 작업일지 입력 폼
- [ ] 홈: 공지사항 슬라이드
- [ ] 출력현황: 2개 탭 구조
- [ ] 출력현황: 급여명세서 뷰어
- [ ] 작업일지: 카드 UI
- [ ] 현장정보: 지도 연동
- [ ] 문서함: 2개 탭 구조
- [ ] 본사요청: 신규 페이지

---

## 🎯 **성공 기준**

1. **픽셀 퍼펙트**: HTML과 100% 동일
2. **모든 인터랙션**: 호버, 클릭, 애니메이션
3. **반응형**: 모바일 최적화
4. **다크모드**: 완벽 지원
5. **성능**: 2초 이내 로딩

**총 예상 기간: 11-13일**

⚠️ **절대 원칙: HTML 디자인을 정확히 따라야 합니다!**

---

## 📋 **파일 구조**

```
/app/mobile/
├── layout.tsx           # 모바일 레이아웃 (헤더, 사이드바, 하단네비)
├── page.tsx            # 홈 페이지
├── worklog/
│   └── page.tsx        # 출력현황/급여현황
├── tasks/
│   └── page.tsx        # 작업일지
├── sites/
│   └── page.tsx        # 현장정보
├── documents/
│   └── page.tsx        # 문서함
└── requests/
    └── page.tsx        # 본사요청 (신규)

/modules/mobile/
├── components/
│   ├── layout/
│   │   ├── AppBar.tsx          # 상단 헤더
│   │   ├── Drawer.tsx          # 사이드바
│   │   ├── BottomNav.tsx       # 하단 네비게이션
│   │   └── SearchOverlay.tsx   # 검색 오버레이
│   ├── home/
│   │   ├── WorkLogForm.tsx     # 작업일지 입력 폼
│   │   ├── NoticeSlider.tsx    # 공지사항 슬라이더
│   │   └── QuickMenu.tsx       # 빠른메뉴
│   └── common/
│       ├── ChipButton.tsx      # 칩 버튼
│       ├── Card.tsx            # 카드 컴포넌트
│       └── Stepper.tsx         # 스테퍼 UI
└── styles/
    └── mobile.css              # 모바일 전용 스타일
```

---

## 📝 **구현 우선순위**

1. **최우선 (Phase 0)**: 글로벌 컴포넌트
   - 상단 헤더, 사이드바, 하단 네비게이션
   - 모든 페이지에서 공통으로 사용

2. **긴급 (Phase 1)**: 홈페이지
   - 작업일지 입력 폼 (핵심 기능)
   - 공지사항 슬라이드

3. **높음 (Phase 2)**: 주요 페이지
   - 출력현황 (탭 구조 + 급여명세서)
   - 작업일지, 현장정보, 문서함

4. **보통 (Phase 3)**: 추가 기능
   - 본사요청 페이지

---

_작성일: 2025-01-15_
_버전: 1.0_
