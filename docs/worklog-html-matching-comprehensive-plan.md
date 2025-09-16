# 작업일지 HTML 참조 100% 매칭 구현 종합 계획서

## 📋 프로젝트 개요

**목표**: 현재 React 작업일지 구현체를 HTML 참조 파일(`worklog.html`)과 100% 동일하게 구현

**현재 매칭률**: 약 15% (기본 탭 구조와 카드 시스템만 부분 일치)

**요구사항 파일**: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/worklog.html` (62,252 토큰)

**현재 구현**: `modules/worker-site-manager/pages/WorkLogHomePage.tsx`

---

## 🔍 핵심 차이점 분석 (62,252 토큰 HTML 분석 결과)

### 1. **전체 구조적 차이점**

| 구분 | 현재 React 구현 | HTML 참조 요구사항 | 매칭률 |
|------|-----------------|-------------------|--------|
| **메인 탭** | "작성중" / "승인완료" | "출력현황" / "급여현황" | ❌ 0% |
| **레이아웃** | 카드 리스트 기반 | 캘린더 + 통계 + 급여명세 | ❌ 10% |
| **CSS 시스템** | 기본 Tailwind | 포괄적 CSS 변수 시스템 | ❌ 5% |
| **상호작용** | 기본 클릭/터치 | 고도화된 터치 인터랙션 | ❌ 20% |

### 2. **누락된 핵심 기능 (42개 주요 기능)**

#### A. 출력현황 탭 (완전 누락)
- **월별 캘린더 시스템** (LocalStorage 연동)
- **일별 작업 현황 표시**
- **월별 통계 카드** (총 출력일수, 평균 공수, 총 급여액)
- **캘린더 네비게이션** (이전/다음 달)

#### B. 급여현황 탭 (완전 누락)
- **급여명세서 PDF 미리보기 시스템**
- **줌/팬 기능** (확대/축소/이동)
- **월별 급여명세서 선택**
- **PDF 다운로드 기능**

#### C. CSS 변수 시스템 (95% 누락)
```css
/* HTML 참조의 포괄적 CSS 변수 (현재 구현에서 완전 누락) */
:root {
  --font: 'Noto Sans KR', system-ui;
  --bg: #f5f7fb; --card: #ffffff; --text: #101828;
  --muted: #667085; --line: #e6eaf2; --brand: #1A254F;
  --num: #0068FE; --hover: #E5EAF3; --active: #D1DCF0;
}
```

#### D. 고급 UX 패턴 (완전 누락)
- **Line Tabs 시스템** (그리드 기반)
- **롱프레스 인터랙션**
- **디바운싱 검색**
- **테마 토글** (다크/라이트)
- **폰트 크기 전환** (fs-100/fs-150)

---

## 🎯 단계별 구현 전략 (5 Phase)

### **Phase 1: 기반 시스템 구축** (예상 3-4시간)

#### 1.1 CSS 변수 시스템 구현
```css
/* 새로운 global.css 추가 */
:root {
  --font: 'Noto Sans KR', system-ui, -apple-system;
  --bg: #f5f7fb; --card: #ffffff; --text: #101828;
  --muted: #667085; --line: #e6eaf2; --brand: #1A254F;
  --num: #0068FE; --hover: #E5EAF3; --active: #D1DCF0;
}

[data-theme="dark"] {
  --bg: #0a0e17; --card: #1a1f2b; --text: #e9eef5;
  --muted: #8da1b8; --line: #2a3441; --brand: #4a69bd;
}
```

#### 1.2 탭 구조 완전 변경
- **현재**: `useState<WorkLogStatus>('draft'|'approved')`
- **변경**: `useState<'output'|'salary'>('output')`
- **구현**: Line Tabs 그리드 시스템
```tsx
const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')
```

#### 1.3 기본 레이아웃 리팩토링
- **현재**: 카드 리스트 컨테이너
- **변경**: 탭별 조건부 렌더링 (캘린더 vs 급여명세)

### **Phase 2: 출력현황 탭 구현** (예상 4-5시간)

#### 2.1 캘린더 시스템 구현
```tsx
// 새로운 컴포넌트: WorkCalendar.tsx
interface CalendarProps {
  currentDate: Date;
  workLogs: WorkLogData[];
  onDateSelect: (date: Date) => void;
}
```

#### 2.2 월별 통계 카드
```tsx
// 새로운 컴포넌트: MonthlyStats.tsx
interface StatsData {
  totalWorkDays: number;
  averageHours: number;
  totalSalary: number;
}
```

#### 2.3 LocalStorage 연동
- 캘린더 상태 저장/복원
- 선택된 날짜 기억
- 월별 데이터 캐싱

### **Phase 3: 급여현황 탭 구현** (예상 3-4시간)

#### 3.1 급여명세서 PDF 미리보기 시스템
```tsx
// 새로운 컴포넌트: PayslipViewer.tsx
interface PayslipViewerProps {
  pdfUrl: string;
  month: string;
  onZoom: (scale: number) => void;
  onPan: (x: number, y: number) => void;
}
```

#### 3.2 줌/팬 기능 구현
- **확대/축소**: pinch/wheel 이벤트
- **이동**: drag 이벤트
- **초기화**: 더블탭 이벤트

#### 3.3 급여명세서 선택 UI
- 월별 드롭다운
- PDF 다운로드 버튼
- 로딩/에러 상태 처리

### **Phase 4: 고급 UX 기능** (예상 2-3시간)

#### 4.1 인터랙션 시스템
- **롱프레스**: `useLongPress` 훅 활용
- **리플 이펙트**: 버튼 클릭 애니메이션
- **스와이프 제스처**: 탭 전환

#### 4.2 검색 및 필터링
- **디바운싱 검색**: 300ms 지연
- **날짜 범위 필터**
- **현장별 필터**

#### 4.3 테마 시스템
- **다크/라이트 모드** 토글
- **폰트 크기 전환** (fs-100/fs-150)
- **시스템 테마 감지**

### **Phase 5: 최적화 및 마무리** (예상 1-2시간)

#### 5.1 성능 최적화
- **React.memo** 적용
- **useMemo/useCallback** 최적화
- **가상 스크롤링** (대용량 데이터)

#### 5.2 접근성 및 반응형
- **키보드 네비게이션**
- **스크린 리더 지원**
- **모바일 터치 최적화**

---

## 📁 수정 대상 파일 상세

### **대폭 수정 (90% 이상 변경)**

#### 1. `modules/worker-site-manager/pages/WorkLogHomePage.tsx` (589 라인)
- **현재**: 카드 기반 작업일지 목록
- **변경**: 탭별 조건부 렌더링 (캘린더 vs 급여명세)
- **추가**: 새로운 상태 관리 로직

#### 2. CSS 파일 신규 생성
- **`styles/worklog-variables.css`**: CSS 변수 정의
- **`styles/worklog-calendar.css`**: 캘린더 전용 스타일
- **`styles/worklog-payslip.css`**: 급여명세 전용 스타일

### **신규 생성 컴포넌트 (8개)**

#### 1. 캘린더 관련 (4개)
- **`WorkCalendar.tsx`**: 메인 캘린더 컴포넌트
- **`CalendarDay.tsx`**: 개별 날짜 셀
- **`MonthlyStats.tsx`**: 월별 통계 카드
- **`CalendarNavigation.tsx`**: 월 네비게이션

#### 2. 급여명세 관련 (4개)
- **`PayslipViewer.tsx`**: PDF 미리보기어
- **`PayslipControls.tsx`**: 줌/팬 컨트롤
- **`PayslipSelector.tsx`**: 월별 선택 UI
- **`PayslipDownload.tsx`**: 다운로드 기능

### **훅 및 유틸리티 (6개)**

#### 1. 상태 관리 훅
- **`useWorkCalendar.ts`**: 캘린더 상태 관리
- **`usePayslipViewer.ts`**: PDF 뷰어 상태
- **`useMonthlyStats.ts`**: 통계 계산

#### 2. 인터랙션 훅
- **`usePinchZoom.ts`**: 핀치 줌 처리
- **`useDragPan.ts`**: 드래그 팬 처리
- **`useDebounceSearch.ts`**: 디바운싱 검색

---

## 🔢 구현 복잡도 분석

### **코드 변경 규모**

| 파일 타입 | 신규 생성 | 대폭 수정 | 소폭 수정 | 총계 |
|-----------|----------|----------|----------|-------|
| **React 컴포넌트** | 8개 | 1개 | 3개 | 12개 |
| **CSS 파일** | 3개 | 0개 | 1개 | 4개 |
| **TypeScript 훅** | 6개 | 0개 | 2개 | 8개 |
| **타입 정의** | 2개 | 1개 | 1개 | 4개 |
| **총계** | 19개 | 2개 | 7개 | **28개** |

### **예상 작업 시간**

- **Phase 1**: 3-4시간 (기반 시스템)
- **Phase 2**: 4-5시간 (캘린더 시스템)
- **Phase 3**: 3-4시간 (급여명세 시스템)
- **Phase 4**: 2-3시간 (고급 기능)
- **Phase 5**: 1-2시간 (최적화)

**총 예상 시간**: **13-18시간**

---

## 🎨 디자인 시스템 매칭 세부사항

### 1. **CSS 변수 시스템 (42개 변수)**
```css
/* 기본 컬러 시스템 */
--bg: #f5f7fb;      /* 배경색 */
--card: #ffffff;     /* 카드 배경 */
--text: #101828;     /* 주요 텍스트 */
--muted: #667085;    /* 보조 텍스트 */
--line: #e6eaf2;     /* 구분선 */
--brand: #1A254F;    /* 브랜드 컬러 */
--num: #0068FE;      /* 숫자/강조 */

/* 인터랙션 컬러 */
--hover: #E5EAF3;    /* 호버 상태 */
--active: #D1DCF0;   /* 활성 상태 */
--focus: #B3C8E8;    /* 포커스 상태 */
```

### 2. **Line Tabs 시스템**
```css
.line-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 2px solid var(--line);
}

.line-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--num);
}
```

### 3. **캘린더 그리드 시스템**
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--line);
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--card);
}
```

---

## ✅ 검증 기준 및 완성도 체크리스트

### **기능 완성도 (100% 매칭 목표)**

#### 출력현황 탭
- [ ] 월별 캘린더 표시 (7x6 그리드)
- [ ] 일별 작업 현황 표시 (출력일수 표시)
- [ ] 월 네비게이션 (이전/다음 버튼)
- [ ] 오늘 날짜 하이라이트
- [ ] 작업일 클릭 → 상세 정보 표시
- [ ] 월별 통계 카드 (3개 지표)
- [ ] LocalStorage 상태 저장/복원

#### 급여현황 탭
- [ ] 급여명세서 PDF 미리보기
- [ ] 줌 인/아웃 기능 (핀치/휠)
- [ ] 팬 기능 (드래그 이동)
- [ ] 더블탭 초기화
- [ ] 월별 급여명세서 선택
- [ ] PDF 다운로드 버튼
- [ ] 로딩/에러 상태 표시

#### 공통 기능
- [ ] Line Tabs 그리드 시스템
- [ ] CSS 변수 테마 시스템
- [ ] 폰트 크기 토글 (fs-100/fs-150)
- [ ] 다크/라이트 모드 전환
- [ ] 모바일 터치 최적화
- [ ] 접근성 준수 (ARIA, 키보드 네비게이션)

### **시각적 디자인 매칭 (100% 목표)**

- [ ] 색상 팔레트 정확 매칭 (42개 CSS 변수)
- [ ] 타이포그래피 일치 (Noto Sans KR 폰트)
- [ ] 간격/여백 정확 매칭
- [ ] 애니메이션 효과 일치
- [ ] 반응형 브레이크포인트 일치

### **성능 및 안정성**

- [ ] 초기 로딩 시간 < 2초
- [ ] 캘린더 렌더링 최적화
- [ ] PDF 뷰어 메모리 효율성
- [ ] 터치 응답 지연 < 100ms
- [ ] 에러 처리 완성도

---

## 🚀 구현 시작 순서

### **즉시 시작 (Critical)**
1. **CSS 변수 시스템** 구축
2. **탭 구조 변경** (작성중/승인완료 → 출력현황/급여현황)
3. **기본 레이아웃** 리팩토링

### **1단계 완료 후 (High)**
1. **캘린더 컴포넌트** 구현
2. **월별 통계 카드** 구현
3. **LocalStorage 연동**

### **2단계 완료 후 (Medium)**
1. **급여명세 PDF 뷰어** 구현
2. **줌/팬 인터랙션** 구현
3. **고급 UX 기능** 추가

---

## 📞 구현 후 예상 결과

### **Before (현재 - 15% 매칭)**
- 기본적인 카드 기반 작업일지 목록
- 제한적인 탭 기능 ("작성중/승인완료")
- 기본 Tailwind 스타일링
- 단순한 클릭 인터랙션

### **After (목표 - 100% 매칭)**
- 완전한 캘린더 기반 출력현황 시스템
- 고도화된 급여명세서 PDF 미리보기 시스템
- 포괄적인 CSS 변수 테마 시스템
- 고급 터치 인터랙션 (롱프레스, 핀치줌, 팬)
- 완전한 모바일 UX 최적화

---

**작성일**: 2025년 9월 16일  
**문서 버전**: v2.0 (종합 분석 완료)  
**예상 완료일**: 구현 시작 후 3-4일  
**매칭 목표**: 100% (HTML 참조와 완전 일치)

---

*이 문서는 62,252 토큰 HTML 참조 파일의 완전 분석을 바탕으로 작성되었습니다.*