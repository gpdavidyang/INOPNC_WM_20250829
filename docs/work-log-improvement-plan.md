# 작업일지 화면 개선 구현 계획서

## 📌 개요

본 문서는 참조 HTML 파일(task.html)과 100% 동일한 작업일지 화면을 구현하기 위한 상세 계획서입니다.

## 🔍 현재 구현 상태 분석

### 현재 구현 파일

- **위치**: `/modules/mobile/pages/tasks-page.tsx`
- **특징**: 기본적인 작업일지 목록 표시 기능만 구현

### 참조 파일

- **위치**: `/dy_memo/new_image_html/html_css/task.html`
- **특징**: 완성도 높은 작업일지 시스템 전체 구현

## 📊 기능 비교 분석

### 주요 기능 비교표

| 기능                   | 참조 HTML (task.html)         | 현재 구현 (tasks-page.tsx)  | 구현 필요 |
| ---------------------- | ----------------------------- | --------------------------- | --------- |
| **탭 네비게이션**      | 작성중/승인완료 + 카운트 뱃지 | ✅ 구현됨                   | -         |
| **현장 검색**          | 검색 입력 필드                | ❌ 미구현 (드롭다운만 있음) | ✅        |
| **작업일지 카드**      | 상세 정보 포함                | ⚠️ 기본 정보만              | ✅        |
| **NPC-1000 자재**      | 사용량 표시                   | ❌ 미구현                   | ✅        |
| **파일 업로드**        | 사진/도면/확인서              | ❌ 미구현                   | ✅        |
| **바텀시트**           | 월별 미작성 알림              | ⚠️ 단순 알림만              | ✅        |
| **상세보기 모달**      | 전체 정보 표시                | ❌ 미구현                   | ✅        |
| **작업일지 작성 모달** | 상세 입력 폼                  | ❌ 미구현                   | ✅        |

### 작업일지 카드 필드 비교

#### 참조 HTML의 필드

- 작업일자
- 현장명
- 부재명 (슬라브, 거더, 기타)
- 작업공정 (균열, 면, 마감)
- 작업유형 (지하, 지상, 기타)
- 블럭/동/호수
- 공수 (작업자별)
- 사진/도면/확인서 첨부
- NPC-1000 사용량
- 진행률

#### 현재 구현의 필드

- 날짜
- 현장
- 작업내용 (단순 텍스트)
- 진행률
- 공수 (전체)
- 상태

## 📝 개선 구현 계획

### Phase 1: 데이터 구조 확립 (우선순위: 높음)

#### 1.1 작업일지 인터페이스 정의

```typescript
interface WorkLog {
  id: string
  date: string
  siteId: string
  siteName: string
  status: 'draft' | 'approved'

  // 작업 상세
  memberName: string[] // 부재명 (슬라브, 거더, 기타)
  workProcess: string[] // 작업공정 (균열, 면, 마감)
  workType: string[] // 작업유형 (지하, 지상, 기타)
  location: {
    block: string // 블럭
    dong: string // 동
    unit: string // 호수
  }

  // 공수 정보
  workers: {
    id: string
    name: string
    hours: number
    role?: string
  }[]

  // 자재 정보
  npcUsage?: {
    amount: number
    unit: string
  }

  // 첨부파일
  attachments: {
    photos: {
      id: string
      url: string
      name: string
      size: number
    }[]
    drawings: {
      id: string
      url: string
      name: string
      size: number
    }[]
    confirmations: {
      id: string
      url: string
      name: string
      size: number
    }[]
  }

  progress: number
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}
```

#### 1.2 미작성 알림 데이터 구조

```typescript
interface UncompletedAlert {
  month: string
  count: number
  workLogs: WorkLog[]
  dismissed: boolean // localStorage에 저장
  dismissedAt?: string
}
```

### Phase 2: UI 컴포넌트 구현 (우선순위: 높음)

#### 2.1 컴포넌트 구조

```
modules/mobile/
├── components/
│   ├── work-log/
│   │   ├── WorkLogCard.tsx          // 확장된 작업일지 카드
│   │   ├── WorkLogModal.tsx         // 작성/수정 모달
│   │   ├── WorkLogDetailModal.tsx   // 상세보기 모달
│   │   ├── WorkLogSearch.tsx        // 검색 컴포넌트
│   │   ├── UncompletedBottomSheet.tsx // 미작성 알림
│   │   └── FileUploadSection.tsx    // 파일 업로드
│   └── ...
├── hooks/
│   ├── use-work-logs.ts            // 작업일지 데이터 관리
│   ├── use-file-upload.ts          // 파일 업로드 로직
│   └── ...
└── utils/
    └── work-log-utils.ts           // 유틸리티 함수
```

#### 2.2 검색 기능 구현

- 실시간 현장명 검색
- 디바운싱 적용 (300ms)
- 검색 결과 하이라이팅

#### 2.3 작업일지 카드 확장

- 모든 필드 정보 표시
- 태그 형태로 부재명, 작업공정, 작업유형 표시
- NPC-1000 사용량 진행바
- 첨부파일 아이콘 및 개수
- 작업자별 공수 리스트

#### 2.4 바텀시트 구현

- 월별 그룹핑
- 스와이프 다운으로 닫기
- "오늘은 그만 보기" 체크박스
- 애니메이션 효과 (slide-up)

#### 2.5 모달 구현

**작성/수정 모달**

- Step 형태의 입력 프로세스
- 작업자 검색 및 추가
- 파일 드래그앤드롭
- 입력값 검증

**상세보기 모달**

- 읽기 전용 뷰
- 파일 다운로드
- 인쇄 기능
- 공유 기능

### Phase 3: 기능 구현 (우선순위: 중간)

#### 3.1 파일 업로드 시스템

```typescript
// 파일 업로드 설정
const fileUploadConfig = {
  photos: {
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: ['image/jpeg', 'image/png', 'image/gif'],
    multiple: true,
    maxCount: 10,
  },
  drawings: {
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: ['application/pdf', 'image/*'],
    multiple: false,
    maxCount: 1,
  },
  confirmations: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['application/pdf'],
    multiple: false,
    maxCount: 1,
  },
}
```

#### 3.2 NPC-1000 자재 관리

- 재고 확인 API 연동
- 사용량 입력 검증
- 잔량 자동 계산

#### 3.3 작업자 공수 관리

- 작업자 검색 자동완성
- 개별/전체 공수 계산
- 중복 작업자 방지

#### 3.4 localStorage 활용

```typescript
// 미작성 알림 해제 관리
const DISMISS_KEY = 'worklog_uncompleted_dismiss'
const dismissData = {
  date: new Date().toISOString().split('T')[0],
  months: ['2025-01'], // 해제한 월 목록
}
```

### Phase 4: 스타일링 (우선순위: 낮음)

#### 4.1 디자인 토큰

```css
:root {
  /* 색상 */
  --primary-color: #1a254f;
  --secondary-color: #0068fe;
  --draft-color: #ffa500;
  --approved-color: #22c55e;
  --bg-color: #f5f7fb;
  --border-color: #e6eaf2;

  /* 그림자 */
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --modal-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

  /* 애니메이션 */
  --transition-default: all 0.2s ease;
  --transition-modal: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 4.2 반응형 디자인

- 모바일 우선 접근
- 최소 너비: 320px
- 최대 너비: 768px
- 뷰포트 메타 태그 최적화

## 🗂️ 신규 생성 파일 목록

### 컴포넌트 파일

1. `/modules/mobile/components/work-log/WorkLogCard.tsx`
2. `/modules/mobile/components/work-log/WorkLogModal.tsx`
3. `/modules/mobile/components/work-log/WorkLogDetailModal.tsx`
4. `/modules/mobile/components/work-log/WorkLogSearch.tsx`
5. `/modules/mobile/components/work-log/UncompletedBottomSheet.tsx`
6. `/modules/mobile/components/work-log/FileUploadSection.tsx`

### 훅 파일

1. `/modules/mobile/hooks/use-work-logs.ts`
2. `/modules/mobile/hooks/use-file-upload.ts`

### 유틸리티 파일

1. `/modules/mobile/utils/work-log-utils.ts`

### 타입 정의 파일

1. `/modules/mobile/types/work-log.types.ts`

## 📊 예상 작업량 및 일정

| Phase    | 작업 내용        | 예상 시간     | 우선순위 |
| -------- | ---------------- | ------------- | -------- |
| Phase 1  | 데이터 구조 정의 | 2-3시간       | 높음     |
| Phase 2  | UI 컴포넌트 개발 | 6-8시간       | 높음     |
| Phase 3  | 기능 구현        | 6-7시간       | 중간     |
| Phase 4  | 스타일링         | 2시간         | 낮음     |
| **총계** | **전체 구현**    | **16-20시간** | -        |

## ✅ 성공 지표

### 기능적 요구사항

- [ ] 참조 HTML과 100% 동일한 UI 구현
- [ ] 모든 입력 필드 작동
- [ ] 파일 업로드 기능 정상 작동
- [ ] NPC-1000 자재 관리 통합
- [ ] 월별 미작성 알림 시스템
- [ ] 검색 기능 구현

### 비기능적 요구사항

- [ ] 페이지 로드 시간 2초 이내
- [ ] 모바일 디바이스 최적화
- [ ] 접근성 표준 준수
- [ ] 크로스 브라우저 호환성

## 🚀 구현 순서

1. **1단계**: 타입 정의 및 데이터 구조 생성
2. **2단계**: 기본 UI 컴포넌트 개발
3. **3단계**: 모달 및 바텀시트 구현
4. **4단계**: 파일 업로드 기능 구현
5. **5단계**: NPC-1000 자재 관리 기능
6. **6단계**: 검색 및 필터 기능
7. **7단계**: 스타일링 및 애니메이션
8. **8단계**: 테스트 및 디버깅

## 📝 참고사항

- 모든 텍스트는 한국어로 표시
- 날짜 형식: YYYY-MM-DD
- 시간 형식: 24시간 형식
- 파일 크기 표시: KB, MB 단위
- 에러 처리: 사용자 친화적 메시지 표시

## 🔄 향후 개선 사항

- 오프라인 모드 지원
- 일괄 승인 기능
- 엑셀 내보내기
- 푸시 알림 연동
- 음성 입력 지원

---

_작성일: 2025-09-16_
_작성자: Claude Assistant_
_버전: 1.0.0_
