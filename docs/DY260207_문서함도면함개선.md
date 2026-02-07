# 도면함 기능 개선 구현 계획서

## 1. 개요 및 분석

사용자는 현재 문서함(Document Hub) 내의 **'도면함(Drawings Tab)'** 기능을 대폭 개선하고자 합니다.
기존의 단순 리스트 형태에서 벗어나, **작업일지(Worklog) 단위**로 도면을 그룹화하고, 확장/축소 가능한 카드 UI를 도입하여 **현장 관리자 화면**과 유사한 경험을 제공하는 것이 목표입니다.

**요구사항 핵심:**

1.  **UI 참조:** `dy_memo/request_20260111/05doc.*` (HTML/CSS/JS)
    - **카드형 리스트:** 현장명, 작업내용, 작성자, 날짜 표시
    - **확장 기능:** 카드 클릭 시 하단에 도면 리스트(Grid)와 액션 버튼(업로드, 도구) 표출
    - **탭 구조:** 리스트(List) / 업로드(Upload) / 도구(Tool) 3단 구조 (JS 로직 참조)
2.  **데이터 구조:** 작업일지(Daily Report)를 기준으로 도면(Drawing)을 묶어서 보여주는 방식.
    - 이미 `actions.ts`의 `fetchDrawings`가 이 구조(`DrawingWorklog`)를 반환하고 있음.
3.  **백엔드:** 현장관리자(Site Manager) 화면의 로직을 재사용.
    - `lib/documents/worklog-links.ts`가 핵심 연결 로직임.

## 2. 데이터 구조 및 인터페이스 (기존 활용)

`app/documents/hub/doc-hub-data.ts`에 정의된 `DrawingWorklog` 인터페이스를 그대로 활용하되, UI 상태 관리를 위한 속성이 컴포넌트 레벨에서 추가될 수 있습니다.

```typescript
export interface DrawingWorklog {
  id: string
  type: string
  date: string
  siteName: string
  desc: string
  author: string
  status: DocStatus
  drawings: DrawingItem[]
}

export interface DrawingItem {
  id: string
  title: string
  type: string // 'blueprint' | 'progress'
  source: 'file' | 'markup'
  date: string
  url: string
}
```

## 3. 구현 단계별 상세 계획

### 3.1. 백엔드 (Server Actions) 개선

현재 `fetchDrawings`는 최근 20개 작업일지만 가져옵니다. 이를 검색 조건(현장명, 날짜 등)에 따라 유연하게 가져올 수 있도록 개선해야 합니다.

- **파일:** `app/documents/hub/actions.ts`
- **작업:** `fetchDrawings` 함수에 필터 인자 추가 (검색어, 카테고리 등)
  - `searchQuery`: 현장명, 작성자, 내용 검색
  - `filter`: 공종 필터 (건축, 전기 등 - `05doc.js`의 필터 목록 참조)

### 3.2. 프론트엔드 컴포넌트 (`DrawingsTab.tsx`) 신규 생성

현재 `page.tsx` 내에 하드코딩된 `renderDrawingsTab` 함수를 별도의 클라이언트 컴포넌트로 분리하여 복잡한 상태 관리(확장/축소, 탭 전환)를 처리합니다.

- **파일:** `app/documents/hub/components/DrawingsTab.tsx` (신규 생성)
- **기능:**
  - **리스트 렌더링:** `DrawingWorklog` 배열을 순회하며 카드 렌더링.
  - **카드 상태 관리:**
    - `expandedId`: 현재 확장된 작업일지 ID (Null 가능)
    - `activeSubTab`: 확장된 영역 내 탭 ('list' | 'upload' | 'tool')
  - **확장 영역 (Expanded View):**
    - **리스트 탭:** 해당 작업일지에 연결된 도면들을 썸네일 그리드로 표시. (마크업/파일 구분)
    - **업로드 탭:** 파일 드래그앤드롭 영역, `file type` (진행/완료) 선택 라디오 버튼.
    - **도구 탭:** "준비중" 메시지 또는 마크업 툴 진입 버튼.
  - **스타일링:** `05doc.css`의 `.doc-card`, `.sub-tab-btn`, `.upload-area` 등의 스타일을 SCSS 모듈이나 Tailwind로 이식. `app/documents/hub/doc-hub.css`에 이미 대부분의 스타일이 존재하므로 이를 활용.

### 3.3. 페이지 통합 (`page.tsx`)

`page.tsx`에서 `DrawingsTab` 컴포넌트를 import하여 사용하도록 수정합니다.

- **파일:** `app/documents/hub/page.tsx`
- **작업:** 기존 `renderDrawingsTab` 로직 제거하고 `<DrawingsTab />` 컴포넌트로 대체. 데이터(`drawings`)와 필터 상태를 props로 전달.

## 4. UI 세부 명세 (참조: 05doc.html)

### 4.1. 도면 카드 (접힌 상태)

- **좌측:** 체크박스 (일괄 작업용 - 선택사항)
- **썸네일:** 대표 도면 이미지 1개 또는 폴더 아이콘
- **중앙:** 현장명(Title), 작성자 | 날짜 | 시간 (Meta)
- **우측:** 상태 배지 (진행중/완료), 확장 아이콘 (Chevron)

### 4.2. 도면 카드 (펼친 상태)

- **상단:** 카드 내용 유지
- **중단 (탭):** [목록] [도면등록] [도구] 구분 버튼
- **하단 (컨텐츠):**
  - **목록:** 3열 그리드, 도면 이미지, 우측 상단 배지(진행/완료)
  - **등록:** 점선 박스 업로드 영역, 파일 선택, 등록 버튼
  - **도구:** (추후 구현)

## 5. 실행 순서

1.  **`actions.ts` 수정:** 검색/필터링 로직 보강.
2.  **`DrawingsTab.tsx` 작성:** UI 구조 잡기 및 상태 로직 구현.
3.  **`doc-hub.css` 보완:** `05doc.css`에서 누락된 스타일(확장 영역, 서브 탭 등) 추가.
4.  **`page.tsx` 연동:** 컴포넌트 교체 및 테스트.
