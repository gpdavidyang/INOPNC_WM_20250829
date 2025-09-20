# DY0921 관리자 공통 컴포넌트/패턴 가이드

Phase 1 이후의 신규 관리자 화면에서 일관된 UX를 유지하기 위해, 현재 재사용 가능한 UI 컴포넌트와 부족한 요소를 정리한다. 이 문서는 React 클라이언트 컴포넌트 기준의 가이드이며, `components/ui/` 및 `components/shared/` 아래 자산을 우선 활용한다.

## 1. 기존 재사용 가능 자산
| 영역 | 컴포넌트 | 설명 | 비고 |
| --- | --- | --- | --- |
| Card/Panel | `components/ui/card` | Card, CardHeader, CardContent 등 기본 패널 | 대시보드 전반 사용 중 |
| 버튼 | `components/ui/button` | Variant/size 지원, 다크모드 대응 | 아이콘 버튼 시 `lucide-react`와 조합 |
| 입력/폼 | `components/ui/input`, `components/ui/select`, `components/ui/switch`, `components/ui/textarea`, `components/ui/label` | 대부분 Radix 기반 | 관리자 폼에도 동일 적용 |
| Table | `components/ui/table` | 단순 표 구조. 정렬/페이지네이션 미포함 | 사용자/조직/문서 리스트에 기본 활용 |
| 배지/상태 | `components/ui/badge` | 상태/필터 태그 표시 | 상태 값 통일 필요 |
| 탭 | `components/ui/tabs` | Radix Tabs 래퍼. 가로 탭 구현에 적합 | 세부 탭 페이지에 활용 |
| 다이얼로그 | `components/ui/dialog`, `components/ui/sheet`, `components/ui/drawer` | 모달/슬라이드 패널 | 레거시 모달 이전 시 표준화 |
| 토스트 | `components/ui/sonner` (전역) | 알림/성공 메시지 | 서버액션 에러 처리 시 활용 |

## 2. 관리자 전용 공통 묶음 제안
### 2.1 레이아웃/내비게이션
- `AdminDashboardLayout` + `AdminHeader` 조합을 표준화한다.
- 서브 섹션별로 `AdminSectionHeader`(제작 예정) 컴포넌트를 만들어 타이틀/필터/액션 버튼을 묶는다.

### 2.2 데이터 테이블 & 필터 바
- 다수 페이지에서 필터/검색/정렬이 필요하므로 다음 유틸을 공통화한다:
  - `AdminDataTable` (레거시 제공)을 TypeScript 제네릭으로 리팩터링.
  - `FilterBar` (신규): 검색어, 역할/상태 셀렉트, 날짜 범위 등 slot 기반 구성.

### 2.3 상태/요약 카드
- 대시보드, 목록 상단 카드에 사용할 `StatCard` 컴포넌트를 정의 (아이콘·색상 props).
- 상태 배지(`Badge`)에 들어갈 상수/팔레트를 `lib/constants/admin-status.ts` 등으로 분리.

### 2.4 모달 & 폼 패턴
- 레거시 모달(`UserDetailModal.tsx`, `SiteWorkersModal.tsx`, etc.)을 참조하여 다음 패턴을 표준화:
  - `AdminFormDialog` : 제목/설명/Slot(Body)/FooterButton props 제공.
  - `ConfirmDialog` : 삭제/승인 등 확인 다이얼로그용 래퍼.
  - 입력 검증은 `zod` + `@hookform/resolvers` 조합으로 통일 권장.

### 2.5 Empty/Error/Skeleton 상태
- 플레이스홀더 메시지 구성 요소 `AdminPlaceholder`를 확장하여 `variant: 'empty' | 'error' | 'in-progress'` 옵션을 추가하고, 각 페이지에서 동일한 메시지를 사용한다.
- Skeleton 컴포넌트 (`components/ui/skeleton`)를 활용해 리스트/카드 로딩 상태를 정형화한다.

## 3. 데이터 패칭/상태 관리 패턴
- 서버 액션(`app/actions/admin/**`) + SWR 또는 React Query 구조 중 선택해야 하며, 현재 레포에는 React Query 미사용 → Phase 1에서는 `useEffect + fetch` → `Route Handler` → `AdminActionResult` 패턴 유지.
- 향후 공통 Hook 제안: `useAdminList(resource, params)` 형태로 페이지네이션, 오류 처리 로직 공통화.

## 4. 스타일/테마 가이드
- Tailwind 유틸 사용 시 `getFullTypographyClass`(폰트 크기 컨텍스트)와 `useTouchMode`(패딩/터치 대상 크기 조정)를 중심으로 반응형/접근성 보완.
- 다크모드 호환: 다수 컴포넌트가 `dark:` 프리픽스를 지원하므로 신규 UI 작성 시 동일 규칙 준수.
- 아이콘은 `lucide-react` 한정 사용, 색상은 Tailwind 팔레트(blue-500, green-500 등)로 통일.

## 5. 필요 신규 컴포넌트/유틸
| 이름 | 용도 | 비고 |
| --- | --- | --- |
| `AdminSectionHeader` | 페이지 타이틀·설명·액션 버튼 묶음 | Phase 1 사용자/현장/문서 페이지에 적용 |
| `AdminFilterBar` | 검색/필터 UI 모듈 | Slot 기반으로 확장 가능하게 설계 |
| `AdminPagination` | 표준 페이지네이션 컨트롤 | `Table`와 함께 배치 |
| `DataStatusBadge` | 상태와 색상을 매핑하는 배지 | `status` enum → 색상, 아이콘 지정 |
| `DocumentStatusList` | 필수 서류 상태 리스트 템플릿 | 사용자 상세/필수 서류 탭에서 공유 |
| `AssignmentSummary` | 배정 요약 카드 (인원 수, 현장 수 등) | 배정/현장 뷰 공통 |

## 6. 코드 위치 가이드
- 재사용 가능한 admin 전용 컴포넌트는 `components/admin/common/` 신규 디렉터리에 배치.
- 순수 UI 요소는 `components/ui/` 하위로 이동하여 관리자/모바일 양쪽에서 공유할 수 있도록 한다.
- 도메인별 복잡한 뷰(예: 사용자 상세 카드)는 해당 도메인 디렉터리(`components/admin/users/`)에 둔다.

## 7. 후속 액션
1. `components/admin/common/` 폴더 생성 및 위 신규 컴포넌트의 인터페이스 설계 초안 작성.
2. 레거시 `AdminPageLayout`, `AdminDataTable`, 모달 컴포넌트에서 재사용 가능한 부분을 추출하여 신버전에 옮긴다.
3. Tailwind 토큰/팔레트 통일을 위해 `tailwind.config.js`의 색상 확장 여부를 점검.
4. Phase 1에서 작업할 사용자/현장/문서 페이지에 위 공통 컴포넌트를 먼저 적용하여 패턴을 고정한다.
