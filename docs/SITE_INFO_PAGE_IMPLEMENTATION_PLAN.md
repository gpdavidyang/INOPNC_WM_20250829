# SiteInfoPage 100% 요구사항 준수 구현 계획

## 개요

HTML 요구사항 파일(`dy_memo/new_image_html_v2.0/html_consolidate/site.html`)과 현재 React 구현(`modules/mobile/components/site/SiteInfoPage.tsx`)을 비교 분석하여, 요구사항과 100% 일치하도록 수정하는 상세 계획입니다.

## 주요 차이점 분석

### 1. 현장정보 카드 구조 차이

**HTML 요구사항:**

- 단일 현장정보 카드 (선택된 현장 1개 표시)
- 현장명 + 아이콘 + 작업일자 헤더
- 기본 정보: 소속, 관리자, 안전담당자, 주소, 숙소
- 상세/간단 토글 버튼으로 추가 정보 표시

**현재 React 구현:**

- 현장 검색 기능이 있는 다중 현장 리스트
- 현장별 상세 정보를 모달로 표시
- 첨부파일을 별도 모달로 관리

### 2. 상세 정보 표시 방식 차이

**HTML 요구사항:**

- 인라인 확장/축소 기능 (`detail-section` 토글)
- 관리자, 부제목, 공정, 작업종류, 블록/동/호수, 기간, 사진 수량, 최근 수정일 등 상세 필드

**현재 React 구현:**

- 모달 기반 상세 정보 표시
- 상세 필드가 다름 (예: NPC 자재 관리 포함)

### 3. 첨부파일 관리 차이

**HTML 요구사항:**

- 현장 공도면, PTW, 현장 사진의 3가지 카테고리
- 각 파일별 다운로드 버튼
- 팝업에서 전체화면 이미지 보기 지원
- 파일 미리보기 기능

**현재 React 구현:**

- 단순한 첨부파일 목록 표시
- 파일 업로드 기능 포함
- 미리보기 기능이 제한적

### 4. NPC-1000 자재관리 기능

**HTML 요구사항:**

- 현재 재고량 표시
- 입고/사용 로그 모달
- 입고/사용 기록 입력 모달
- 자재 요청 모달
- 상세한 자재 관리 인터페이스

**현재 React 구현:**

- 기본적인 NPC 표시만 있음
- 상호작용 기능 부족

### 5. 폰트 크기 대응 및 반응형 디자인

**HTML 요구사항:**

- `body.fs-150` 클래스로 큰글씨 모드 지원
- 세밀한 반응형 브레이크포인트 (768px, 480px)
- 다크모드 완전 지원

**현재 React 구현:**

- 기본 반응형만 구현
- 폰트 크기 조절 기능 없음

### 6. 데이터 구조 및 연동

**HTML 요구사항:**

- localStorage 기반 데이터 관리
- `state_site`, `state_date`, `workLogData` 연동
- 홈 페이지와 실시간 데이터 동기화

**현재 React 구현:**

- useState 기반 컴포넌트 상태 관리
- localStorage 연동이 제한적

## 상세 구현 계획

### Phase 1: 현장정보 카드 구조 변경 (2시간)

#### 1.1 메인 카드 레이아웃 변경

- **현재**: 다중 현장 리스트 → **변경**: 단일 현장 카드
- 현장명 + 아이콘 + 작업일자 헤더 구조 구현
- `card-header` 클래스 구조 적용

#### 1.2 기본 정보 섹션 구현

```typescript
interface SiteBasicInfo {
  org: string // 소속
  manager: string // 관리자
  managerPhone: string // 관리자 연락처
  safety: string // 안전담당자
  safetyPhone: string // 안전담당자 연락처
  address: string // 주소
  lodging: string // 숙소
}
```

#### 1.3 정보 행(info-row) 그리드 구현

- CSS Grid: `grid-template-columns: 80px 1fr auto`
- 각 행별 상세 버튼 배치
- 통화, 복사, T맵 연결 기능

### Phase 2: 상세 정보 섹션 및 토글 기능 (1.5시간)

#### 2.1 토글 가능한 detail-section 구현

```typescript
interface DetailSection {
  manager: string // 관리자
  subtitle: string // 부제목
  process: string // 공정
  workType: string // 작업종류
  block: string // 블록
  building: string // 동
  unit: string // 호수
  duration: string // 기간
  photosBefore: number // 보수 전 사진 수
  photosAfter: number // 보수 후 사진 수
  lastUpdated: string // 최근 수정일
}
```

#### 2.2 확장/축소 기능 (expandable)

- 긴 텍스트 (주소, 숙소) 클릭 시 전체 표시
- CSS 애니메이션 적용
- `expandable` 클래스 구현

#### 2.3 상세/간단 토글 버튼

- `toggleDetail` 함수 구현
- 버튼 텍스트 동적 변경 ("상세" ↔ "간단")
- detail-section 표시/숨김 제어

### Phase 3: 첨부파일 시스템 개선 (2시간)

#### 3.1 첨부파일 팝업 구조 변경

```typescript
interface AttachmentCategories {
  drawings: AttachmentFile[] // 현장 공도면
  ptw: AttachmentFile[] // PTW
  photos: AttachmentFile[] // 현장 사진
}

interface AttachmentFile {
  name: string
  date: string
  size?: string
  url?: string
}
```

#### 3.2 팝업 기능 구현

- `attachment-popup` 클래스 구조
- 카테고리별 파일 목록 표시
- 다운로드 버튼 개별 구현
- 전체화면 이미지 보기 모달

#### 3.3 미리보기 기능

- 이미지 파일 미리보기 지원
- PDF 파일 미리보기 지원
- 파일 크기 및 형식 정보 표시

### Phase 4: NPC-1000 자재관리 완전 구현 (2.5시간)

#### 4.1 NPC 카드 구조

```typescript
interface NPCData {
  siteName: string
  currentStock: number
  logs: NPCLog[]
}

interface NPCLog {
  date: string
  type: 'in' | 'out'
  quantity: number
  memo: string
}
```

#### 4.2 모달 다이얼로그 구현

- `npcDlgLog`: 입고/사용 로그 조회
- `npcDlgRecord`: 입고/사용 기록 입력
- `npcDlgRequest`: 자재 요청
- HTML `<dialog>` 엘리먼트 활용

#### 4.3 자재 관리 인터페이스

- 현재 재고량 KPI 표시
- 로그 데이터 시각화
- 입력 폼 유효성 검사
- 요청 승인 워크플로우

### Phase 5: 폰트 크기 조절 및 반응형 디자인 (1시간)

#### 5.1 폰트 크기 지원

```css
/* 기본 크기 */
body.fs-100 .site-info-card .site-name {
  font-size: 17px;
}

/* 큰글씨 모드 */
body.fs-150 .site-info-card .site-name {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  word-break: keep-all;
}
```

#### 5.2 반응형 브레이크포인트

- 768px: 태블릿 대응
- 480px: 모바일 대응
- 현장명 최대 너비 조정
- 버튼 크기 및 간격 조정

#### 5.3 다크모드 지원

```css
[data-theme='dark'] .site-info-card .site-name {
  color: #e9eef5;
}

[data-theme='dark'] .site-info-card .btn-detail {
  background-color: rgba(41, 52, 208, 0.3);
  color: #5b6bff;
}
```

### Phase 6: 데이터 구조 및 localStorage 연동 (1.5시간)

#### 6.1 localStorage 연동

```typescript
// 홈 페이지 연동
const siteName = localStorage.getItem('state_site') || ''
const workDate = localStorage.getItem('state_date') || ''
const workLogData = JSON.parse(localStorage.getItem('workLogData') || '[]')

// 실시간 동기화
window.addEventListener('storage', handleStorageChange)
```

#### 6.2 데이터 구조 통합

```typescript
interface SiteInfoData {
  [siteName: string]: {
    org: string
    manager: string
    managerPhone: string
    safety: string
    safetyPhone: string
    address: string
    lodging: string
    drawings: AttachmentFile[]
    ptw: AttachmentFile[]
    photos: AttachmentFile[]
    // 상세 정보
    subtitle?: string
    process?: string
    workType?: string
    block?: string
    building?: string
    unit?: string
    duration?: string
    photosBefore?: number
    photosAfter?: number
    lastUpdated?: string
  }
}
```

#### 6.3 실시간 데이터 동기화

- `storage` 이벤트 리스너
- localStorage 변경 감지
- UI 자동 업데이트

### Phase 7: 스타일링 완전 일치 (1시간)

#### 7.1 CSS 변수 및 클래스 통일

```css
/* 홈 페이지와 동일한 폰트 스타일 */
.q {
  font-family: 'Noto Sans KR', system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
  color: #1a254f;
}
```

#### 7.2 리플 이펙트 구현

```css
.ripple-ink {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0);
  animation: ripple 0.45s ease-out;
  pointer-events: none;
}
```

#### 7.3 홈 디자인 시스템 적용

- 버튼 스타일 통일
- 카드 디자인 일치
- 색상 팔레트 통일
- 간격 및 여백 조정

## 기술적 고려사항

### 1. 성능 최적화

- React.memo 적용
- useCallback으로 함수 메모이제이션
- 이미지 지연 로딩
- 가상화 스크롤 (필요시)

### 2. 접근성 (A11y)

- ARIA 레이블 적용
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 색상 대비 준수

### 3. 에러 처리

- 파일 로드 실패 처리
- 네트워크 오류 대응
- localStorage 접근 오류 처리
- 폴백 UI 제공

### 4. 타입 안전성

- TypeScript 인터페이스 정의
- 런타임 검증 추가
- Prop 타입 검증
- API 응답 검증

## 테스트 계획

### 1. 단위 테스트

- 컴포넌트 렌더링 테스트
- localStorage 연동 테스트
- 이벤트 핸들러 테스트
- 데이터 변환 로직 테스트

### 2. 통합 테스트

- 홈 페이지와 데이터 동기화 테스트
- 모달 상호작용 테스트
- 파일 다운로드 기능 테스트
- NPC 자재관리 워크플로우 테스트

### 3. E2E 테스트

- 전체 사용자 시나리오
- 모바일 디바이스 테스트
- 다크모드 테스트
- 폰트 크기 변경 테스트

## 일정 및 우선순위

### Day 1 (6시간)

- Phase 1: 현장정보 카드 구조 변경
- Phase 2: 상세 정보 섹션 및 토글 기능
- Phase 3: 첨부파일 시스템 개선

### Day 2 (5시간)

- Phase 4: NPC-1000 자재관리 완전 구현
- Phase 5: 폰트 크기 조절 및 반응형 디자인
- Phase 6: localStorage 연동

### Day 3 (2시간)

- Phase 7: 스타일링 완전 일치
- 테스트 및 버그 수정
- 문서 정리

## 완료 기준

1. ✅ HTML 요구사항과 시각적으로 100% 일치
2. ✅ 모든 기능적 요구사항 구현 완료
3. ✅ 반응형 디자인 및 접근성 준수
4. ✅ 성능 기준 만족 (Core Web Vitals)
5. ✅ 타입 안전성 확보
6. ✅ 테스트 커버리지 90% 이상
7. ✅ 홈 페이지와 완전 통합

이 계획을 통해 현재 React 구현을 HTML 요구사항과 100% 일치하도록 수정하여, 사용자 경험과 개발자 경험 모두를 향상시키겠습니다.
