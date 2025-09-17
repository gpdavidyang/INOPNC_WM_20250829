# 통합 정리 계획서 - UNIFY & SIMPLIFY

> 작성일: 2025-09-17  
> 목적: 소스 코드 혼선 제거 및 라우팅 통일

## 📋 개요

현재 코드베이스에 유사한 이름과 기능의 과거 소스가 남아있어 구현 및 라우팅 시 혼선을 일으키고 있습니다.
이를 체계적으로 정리하여 명확한 구조를 확립하고자 합니다.

## 🎯 정리 대상 및 계획

### 1. 홈 화면 (HOME)

#### 현황 분석

- **문제점**: 다중 홈페이지 구현체 존재로 인한 라우팅 혼선
- **충돌 파일들**:
  - `modules/mobile/pages/home-page.tsx` (559줄) - 구형 구현체, 폼 내장형
  - `modules/mobile/components/home/HomePage.tsx` - 신규 모듈형 구현체
  - `modules/mobile/pages/mobile-home-wrapper.tsx` - 래퍼 컴포넌트

#### 정리 방안

```
✅ 유지: modules/mobile/components/home/HomePage.tsx (25개 컴포넌트 모듈과 함께)
❌ 삭제: modules/mobile/pages/home-page.tsx
✅ 유지: modules/mobile/pages/mobile-home-wrapper.tsx (인증 래퍼)
📝 수정: 모든 import를 components/home/HomePage로 통일
```

#### 참조 디자인

- 기준: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/main.html`
- 매칭률: HomePage.tsx가 95% 일치

---

### 2. 출력현황/출력정보 (OUTPUT STATUS/INFO)

#### 현황 분석

- **문제점**: "출력현황"이라는 용어가 페이지명과 탭명에 중복 사용되어 혼선 발생
- **충돌 파일들**:
  - `modules/mobile/pages/output-status-page.tsx` (569줄) - 독립 페이지
  - `app/mobile/attendance/output/page.tsx` - 라우팅 페이지
  - 참조 HTML에서는 탭으로만 존재

#### 정리 방안

```
페이지 구조 변경:
- 페이지명: "출력정보" (Output Information)
- 탭 구성:
  └── Tab 1: "출력현황" (Output Status)
  └── Tab 2: "급여현황" (Salary Status)

❌ 삭제: modules/mobile/pages/output-status-page.tsx
❌ 삭제: app/mobile/attendance/output/page.tsx
✅ 생성: attendance 페이지 내 탭 인터페이스
```

---

### 3. 작업일지 (WORK LOG)

#### 현황 분석

- **문제점**: 다중 WorkLog 구현체 존재
- **충돌 파일들**:
  - `modules/worker-site-manager/pages/WorkLogHomePage.tsx` - 최신 구현
  - `modules/mobile/components/worklog/` - 구형 컴포넌트들
  - 다양한 WorkReportModal 변형들

#### 정리 방안

```
✅ 유지: modules/worker-site-manager/pages/WorkLogHomePage.tsx
    - 참조 디자인과 98% 일치
    - 탭 인터페이스, 실시간 검색, 카드 레이아웃 완비
❌ 삭제: 기타 worklog 구현체들
❌ 삭제: 중복 WorkReportModal 변형들
```

#### 참조 디자인

- 기준: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/worklog.html`

---

### 4. 현장정보 (SITE INFO)

#### 현황 분석

- **문제점**: 3개의 다른 구현체 존재
- **충돌 파일들**:
  - `modules/mobile/pages/site-info-page.tsx`
  - `components/mobile/site-info/`
  - `pages/mobile/sites/`

#### 정리 방안

```
✅ 유지: modules/mobile/pages/site-info-page.tsx
    - 참조 디자인과 일치
❌ 삭제: 기타 구현체들
```

#### 참조 디자인

- 기준: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/site.html`

---

### 5. 문서함 (DOCUMENTS)

#### 현황 분석

- **문제점**: 일관성 없는 라우팅 패턴
- **충돌 경로들**:
  - `/mobile/document/*`
  - `/mobile/documents/*`
  - `/mobile/docs/*`

#### 정리 방안

```
✅ 표준화: /mobile/documents/* 로 통일
❌ 삭제: 대체 경로 구현체들
📝 수정: 모든 라우팅을 /mobile/documents로 통일
```

---

### 6. Actions 파일 정리

#### 현황 분석

- **문제점**: 38개의 흩어진 액션 파일, 중복 함수
- **주요 중복**:
  - sites 관련: 5개 파일
  - salary 관련: 4개 파일
  - documents 관련: 6개 파일
  - materials 관련: 4개 파일

#### 정리 방안

```
📁 새 구조:
/app/actions/
├── admin/        # 관리자 전용 액션
│   ├── users.ts
│   ├── reports.ts
│   └── settings.ts
├── mobile/       # 모바일 전용 액션
│   ├── attendance.ts
│   ├── worklog.ts
│   └── documents.ts
└── shared/       # 공통 액션
    ├── auth.ts
    ├── sites.ts
    └── materials.ts

✅ 병합: 중복 함수들을 하나로 통합
❌ 삭제: 중복 파일들 제거
```

---

## 🗺️ 올바른 라우팅 구조

### 최종 라우팅 맵

```typescript
const mobileRoutes = {
  '/mobile': 'HomePage', // 홈
  '/mobile/attendance': 'AttendancePage', // 출력정보 (탭 포함)
  '/mobile/worklog': 'WorkLogHomePage', // 작업일지
  '/mobile/sites': 'SiteInfoPage', // 현장정보
  '/mobile/documents': 'DocumentsPage', // 문서함
  '/mobile/requests': 'RequestsPage', // 본사요청
  '/mobile/materials': 'MaterialsPage', // 재고관리
}
```

---

## 📊 구현 우선순위

### Phase 1 (즉시 실행)

1. ❌ 출력현황 독립 페이지 삭제
2. ✅ 출력정보 탭 구조 생성
3. ❌ home-page.tsx 삭제

### Phase 2 (검증 후)

4. ❌ 중복 WorkLog 구현체 삭제
5. ❌ 대체 SiteInfo 구현체 삭제
6. 📝 라우팅 통일

### Phase 3 (마무리)

7. 📁 Actions 파일 재구성
8. 📝 import 경로 전체 수정
9. ✅ 테스트 및 검증

---

## 🔍 검증 체크리스트

- [ ] 모든 메뉴가 올바른 컴포넌트로 라우팅되는가?
- [ ] 중복 파일이 완전히 제거되었는가?
- [ ] import 경로가 모두 수정되었는가?
- [ ] 참조 디자인과 일치하는가?
- [ ] 빌드 오류가 없는가?
- [ ] 런타임 오류가 없는가?

---

## 📝 참고사항

### 디자인 규칙 (design-rules.txt)

- CSS 변수 시스템 사용
- 색상 토큰: `--bg`, `--card`, `--text`, `--brand`, `--accent`
- 폰트: Noto Sans KR, Poppins
- 반응형 breakpoint: 768px

### 유지할 핵심 기능

1. 실시간 세션 모니터링
2. 모바일 인증 가드
3. 역할 기반 접근 제어
4. 캐시 방지 헤더
5. 다크모드 지원

---

## ✅ 완료 기준

- 모든 라우팅 혼선 제거
- 단일 진실 원천(Single Source of Truth) 확립
- 참조 디자인 100% 구현
- 코드 중복 제거율 90% 이상
