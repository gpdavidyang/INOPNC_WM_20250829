# INOPNC 시스템 화면 UI/UX 표준화 및 개선 구현 계획안 (DY1004)

문서버전: v0.1 (Draft)
작성일: 2025-10-03
대상: INOPNC Work Management System – 관리자(대시보드) 중심, 모바일 일부 공통 적용

## 1. 목적과 범위

- 목적: 관리자 화면의 UI/UX 일관성, 확장성, 유지보수성을 확보하기 위해 디자인 시스템과 표준 컴포넌트를 구축하고, 파일럿 화면을 시작으로 점진적 리팩터링을 수행한다.
- 범위: Next.js(App Router) + TypeScript + Tailwind + Supabase 기반의 대시보드 전반과 공통 컴포넌트. 모바일은 공통 컴포넌트/토큰을 공유하되 별도 최적화를 후속 진행.
- 비범위: 데이터 스키마 대규모 변경, 신규 대규모 비즈니스 기능 신설(본 문서는 UI/UX 표준화 중심).

## 2. 배경 및 문제 인식

- 화면 간 스타일 편차, 반복되는 UI 패턴의 중복 구현, 상태/에러 처리 방식의 불일치로 유지보수 비용 증가.
- 백엔드 준비 상황과 무관하게 UI 작업이 지연되는 현상.
- 접근성(a11y), 반응형, 다크모드 등 시스템 수준 품질 속성의 일관 부재.

## 3. 핵심 원칙

1. 디자인 시스템 우선: 디자인 토큰 → UI 프리미티브 → 패턴 컴포넌트 순으로 구축.
2. 계약 우선 개발: API 계약(타입/스키마)을 먼저 정의하고 모킹으로 병행 개발.
3. 점진적 이관: 파일럿 1~2개 화면에 적용하여 패턴 확정 후 전체 확산.
4. 경계 명확화: 레이아웃/컴포넌트/데이터 계층 간 의존 방향을 일관되게 유지.
5. 테스트/접근성 내재화: 스냅샷/RTL, 기본 a11y 체크를 도입해 회귀 방지.

## 4. 제안 진행 전략(요약)

- 표준 컴포넌트와 레이아웃을 먼저 만들고, API는 계약/모킹으로 진행한 뒤 단계적으로 실제 엔드포인트 연결.
- 파일럿(사용자 관리, 현장 관리)으로 품질 기준과 개발 속도 검증 후 전체 전환.

## 5. 산출물 및 디렉터리 구조(제안)

- 디자인 토큰/테마
  - `tailwind.config.js` 확장 (컬러, 간격, 타이포, 쉐도우, z-index, 브레이크포인트)
  - `lib/ui/tokens.ts` (JS 레벨 토큰, 라이트/다크 테마 스위치 지원)
- UI 프리미티브(접근성 내장)
  - `components/ui/*` (Button, Input, Select, Checkbox, Radio, Textarea, Badge, Card, Tabs, Tooltip, Dialog/Drawer, Toast 등)
  - 변형 시스템: class-variance-authority(cva) + tailwind-merge(twMerge)
  - 필요 시 Radix Primitives 도입(접근성/상호작용 안정화)
- 레이아웃/내비게이션
  - `components/layout/AppShell.tsx` (Sidebar, Topbar, Breadcrumb, Content, Toaster)
  - `components/layout/Sidebar.tsx`, `components/layout/Topbar.tsx`
  - 역할 기반 메뉴: UI Track System과 연동하여 동적 메뉴 구성
- 데이터 계층(계약/어댑터/모킹)
  - `lib/api/contracts/*.ts` (Zod 스키마 + TS 타입)
  - `lib/api/adapters/*.ts` (Supabase/RPC/REST 세부 캡슐화)
  - `lib/api/mocks/*.ts` (모킹/fixture, 개발·테스트 병행)
- 훅/유틸
  - `hooks/useToast`, `useConfirm`, `usePagination`, `useDataTable`
  - `lib/utils/cn.ts` (twMerge 래퍼), `lib/utils/error.ts`
- 파일럿 라우트(예시)
  - `app/dashboard/users/*`, `app/dashboard/sites/*`

## 6. 구현 아키텍처 상세

### 6.1 디자인 토큰 & 테마

- 컬러: 의미 기반(Primary/Secondary/Success/Warning/Danger/Info/Surface/Outline) 정의, 라이트/다크 동시 지원.
- 타이포: 헤딩 스케일, 본문, 코드, 자간/행간 기준 확정.
- 간격/레이아웃: spacing scale(4 또는 8 단위), 컨테이너 max-width, grid/gap 표준.
- 레이어: z-index 단계(Modal, Popover, Toast, Navbar 등) 규정.
- 접근성 대비: 색 대비(4.5:1) 기본 충족, 포커스 링 스타일 표준.

### 6.2 UI 프리미티브 및 패턴 컴포넌트

- Button: variant(primary/secondary/ghost/link/destructive), size(sm/md/lg), loading/disabled 상태.
- Form Controls: Label, HelperText, ErrorText 일관 출력. 유효성 및 에러 바인딩 표준화.
- Dialog/Drawer/Toast: 포커스트랩/aria-속성, 애니메이션 일관.
- Data Table: 정렬/필터/다중선택/페이지네이션/열 리사이즈, 상태(loading/empty/error) 내장.
- Empty/Loading/Error State 컴포넌트 표준화.

### 6.3 레이아웃(AppShell)

- Sidebar(역할 기반 메뉴), Topbar(검색/아바타/알림), Breadcrumb, Content, Footer(선택).
- 반응형 브레이크포인트에 맞춘 접힘/노출 규칙.
- Toaster/Confirm Provider 글로벌 마운트.

### 6.4 데이터 계층

- Contracts: Zod로 요청/응답 스키마 정의 → 타입 자동 추론.
- Adapters: Supabase 쿼리/프로시저 호출 캡슐화, 오류를 표준 도메인 에러로 변환.
- Mocks: 계약 준수 목 데이터/핸들러 제공, 스토리/테스트/개발 서버에서 재사용.

### 6.5 상태 관리 및 데이터 페칭

- RSC(Server Components) + 서버 액션 우선, 필요시 클라이언트 훅으로 캐시/옵티미스틱 갱신.
- 페이지네이션/정렬/필터를 단일 훅(useDataTable)로 표준화.

### 6.6 접근성/국제화/다크모드

- a11y: 키보드 탐색, 포커스 표시, aria 속성 준수. Radix/Headless UI 고려.
- i18n: 텍스트 리소스 추출 가능 구조, l10n 확대 여지 확보.
- 다크모드: 시스템 선호도 연동(`prefers-color-scheme`), 토큰 기반 자동 전환.

### 6.7 용어/문구 스타일 가이드

- 버튼 라벨: 짧고 명확하게, 1~2어절. ‘~하기’ 금지(예: ‘저장하기’ → ‘저장’).
- 어조/형식: 중립형(존댓말 메시지), 라벨은 명사형 우선(저장/삭제/수정/추가/취소).
- 줄임표(…): 추가 입력/대화상자 유도 시에만 사용(예: ‘내보내기…’). 즉시 실행은 미사용.
- 확인/취소 패턴: 긍정 기본은 ‘저장/확인’, 파괴적(primary)은 ‘삭제’, secondary는 ‘취소’.
- 토스트 메시지: 한 문장, 간결/행동 지시 포함. 예) 성공: ‘저장되었습니다.’ 실패: ‘저장에 실패했습니다. 잠시 후 다시 시도하세요.’
- 날짜/시간 표기: YYYY-MM-DD, YYYY-MM-DD HH:mm. 컬럼명은 ‘생성일/수정일’ 통일.
- 상태 칩: 의미 일관(활성/비활성, 진행중/완료/대기). 색상은 의미 토큰 준수.
- 검색/필터: 플레이스홀더는 구체적으로(예: ‘이름, 이메일 검색’). 초기화 버튼은 ‘초기화’ 통일.
- 단위 표기: ‘명/건/원’ 등 붙여쓰기(예: 10명, 3건). 범위는 ‘~’ 또는 ‘–’ 일관 사용.

## 7. 파일럿 대상 및 성공 기준

- 파일럿 대상: 1) 사용자 관리(User List/Detail) 2) 현장 관리(Site List/Detail)
- 성공 기준
  - UI 일관성: 버튼/폼/테이블/레이아웃의 동일한 룩앤필 및 상호작용
  - 품질: a11y 기본 점검 통과, 로딩/에러/빈 상태 처리 누락 없음
  - 개발 생산성: 동일 복잡도의 화면 신규 개발 리드타임 30% 이상 단축
  - 성능: 초기 로드 영향 최소화, LCP/INP 기저 품질 유지

## 8. API 계약/모킹 정책(예시)

```ts
// lib/api/contracts/user.ts
import { z } from 'zod'

export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'worker']),
  createdAt: z.string(),
})
export type User = z.infer<typeof User>

export const ListUsersRequest = z.object({
  q: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
})

export const ListUsersResponse = z.object({
  items: z.array(User),
  total: z.number(),
})
export type ListUsersResponse = z.infer<typeof ListUsersResponse>
```

```ts
// lib/api/adapters/user.ts (실제 연결은 Supabase/REST 캡슐화)
import { ListUsersRequest, ListUsersResponse } from '../contracts/user'

export async function listUsers(req: ListUsersRequest): Promise<ListUsersResponse> {
  // TODO: Supabase 쿼리 또는 RPC 호출 캡슐화
  // 에러는 표준 도메인 에러로 변환하여 상위에 전달
  return { items: [], total: 0 }
}
```

```ts
// lib/api/mocks/user.ts
import { type ListUsersResponse } from '../contracts/user'

export const mockListUsers: ListUsersResponse = {
  items: [
    { id: 'u1', name: '홍길동', email: 'hong@example.com', role: 'admin', createdAt: '2025-10-01' },
  ],
  total: 1,
}
```

## 9. 품질 기준 및 테스트 전략

- 린트/포맷: ESLint + Prettier, TypeScript strict 유지.
- 단위/컴포넌트 테스트: Jest/RTL, 스냅샷 최소화·행동 중심 테스트.
- 접근성 검사: eslint-plugin-jsx-a11y, 가능 시 Storybook a11y/axe 도입.
- 회귀 방지: 핵심 컴포넌트(Button/Form/Table/AppShell) 커버리지 확보.

## 10. 보안/권한/에러 표준

- 인증 연동: CompositeAuthProvider + UI Track System 기준으로 가시성/메뉴 제어.
- 보호된 파일 변경 전 테스트 필수: `/lib/supabase/server.ts`, `/lib/supabase/client.ts`, `/middleware.ts`, `/app/auth/actions.ts`.
- 에러 모델 표준화: 사용자 메시지(친절/행동지시)와 로깅용 원인 분리.

## 11. 마이그레이션 전략(점진 전환)

1. 토큰/프리미티브/AppShell 구축 → 샌드박스 라우트에서 검증
2. 파일럿 2개 화면 신규 구현(모킹) → UX/개발 패턴 승인
3. 실제 엔드포인트 연결(어댑터) → 로딩/에러/권한 최종 점검
4. 나머지 화면 전환(중요도/빈도 기준 배치) → 순차 롤아웃

## 12. 일정(초안) 및 마일스톤

- W1: 토큰/프리미티브/AppShell, 데이터 계약 초안, 모킹 환경
- W2: 파일럿(사용자 관리) 모킹 완료, 피드백 반영
- W3: 파일럿(현장 관리) 모킹 완료, 공통 패턴 고도화
- W4: 파일럿 실제 엔드포인트 연결, a11y/테스트 정비
- W5+: 나머지 화면 단계적 전환 및 성능/UX 튜닝

## 13. 운영 및 브랜치 전략

- 브랜치: `feature/ui-standardization` → `develop` → `main`
- PR 체크리스트: 디자인 토큰 사용 여부, 상태/에러/빈 상태 처리, a11y, 테스트 통과.
- 배포: Vercel Preview로 UI 검수, Supabase 스키마 영향 없는지 확인.

## 14. 리스크 및 대응

- 백엔드 계약 변경: 어댑터/계약 분리로 UI 영향 최소화, Zod로 조기 검출.
- 컴포넌트 남용/확산: cva 변형 정책과 가이드 문서로 제한, 리뷰 규칙 강화.
- 성능 리스크: 테이블 가상화/청크 로딩 고려, 이미지/아이콘 최적화.

## 15. 승인/체크리스트

- [ ] 디자인 토큰/테마 승인
- [ ] UI 프리미티브 변형 정책 승인(cva variant/size/state)
- [ ] AppShell 레이아웃/내비 구조 승인
- [ ] 데이터 계약(Zod) 스키마 승인(파일럿 범위)
- [ ] 파일럿 화면 목록/요구사항 확정(사용자 관리, 현장 관리)
- [ ] 테스트/접근성 기준 합의

## 16. 변경 이력

- v0.1(초안, 2025-10-03): 초기 구조/전략/마일스톤 정리

## 17. 부록 A: UI 핵심 용어 사전(v1)

- common.save → ‘저장’
- common.cancel → ‘취소’
- common.delete → ‘삭제’
- common.edit → ‘수정’
- common.add → ‘추가’
- common.create → ‘생성’
- common.new → ‘신규’
- common.register → ‘등록’ (장부/목록에 올리는 의미에서만 사용)
- common.search → ‘검색’
- common.filter → ‘필터’
- common.apply → ‘적용’
- common.reset → ‘초기화’
- common.confirm → ‘확인’
- common.close → ‘닫기’
- common.details → ‘상세’
- common.list → ‘목록’
- common.export → ‘내보내기’
- common.import → ‘가져오기’
- common.download → ‘다운로드’
- common.upload → ‘업로드’
- common.approve → ‘승인’
- common.reject → ‘반려’
- common.submit → ‘제출’
- common.assign → ‘할당’
- common.unassign → ‘해제’
- common.complete → ‘완료’
- common.start → ‘시작’
- common.stop → ‘중지’
- common.pause → ‘일시중지’
- common.resume → ‘재개’
- common.print → ‘인쇄’
- common.refresh → ‘새로고침’
- common.sync → ‘동기화’
- common.remove → ‘제거’ (물리 삭제가 아닌 연결 해제/항목 제거)
- common.duplicate → ‘복제’
- common.copy → ‘복사’
- common.paste → ‘붙여넣기’
- common.cut → ‘잘라내기’
- common.prev → ‘이전’
- common.next → ‘다음’
- common.back → ‘뒤로’
- domain.user → ‘사용자’
- domain.site → ‘현장’
- domain.work → ‘작업’
- domain.dailyLog → ‘작업일지’
- domain.partner → ‘파트너’
- domain.material → ‘자재’
- domain.payroll → ‘급여’
- field.status → ‘상태’
- field.role → ‘역할’
- field.createdAt → ‘생성일’
- field.updatedAt → ‘수정일’

가이드

- ‘생성’ vs ‘등록’: 시스템에서 새 엔티티를 만들 때 ‘생성’, 기존 것을 목록/장부에 올릴 때 ‘등록’.
- ‘삭제’ vs ‘제거’: ‘삭제’는 파괴적(데이터 삭제), ‘제거’는 연결 해제/목록에서 빼기.
- 확인 대화상자에서는 가능하면 구체적 동사 사용(예: ‘삭제’)을 1차 버튼으로, ‘취소’를 2차로.

## 18. 문자열 키/적용 가이드(제안)

- 키 네이밍: `스코프.행동/필드` 점표기 사용(예: `common.save`, `user.list.title`).
- 중앙화: `lib/ui/strings.ts`에서 관리하고 컴포넌트는 키만 사용(`t('common.save')`).
- 적용 순서: 파일럿 화면에서 키 적용 → 용어 확정 후 전역 치환 진행.

실제 반영 현황

- 생성: `lib/ui/strings.ts:1` — `t(key)` 헬퍼와 한국어 기본 사전 추가.
- 적용: `components/admin/AdminHeader.tsx:1` — 대시보드 제목/검색 플레이스홀더/계정 설정/로그아웃/ARIA 라벨 등에 키 적용.
