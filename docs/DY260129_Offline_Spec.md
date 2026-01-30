# 제한적 오프라인 지원 및 동기화 기술 명세서

## 1. 개요 (Overview)

본 문서는 모바일 모듈을 위한 "제한적 오프라인 지원" 아키텍처를 설명합니다. 목표는 사용자가 통신이 불가한 환경(예: 지하 주차장)에서도 작업일지를 작성하거나 사진/도면 대장을 저장할 수 있게 하고, 네트워크 연결이 복구되면 자동으로 동기화하는 것입니다.

## 2. 요구사항 분석 (Requirements Analysis)

- **오프라인 작업 수행**: 작업일지 생성/수정, 사진 마킹 저장, 도면 마킹 저장.
- **데이터 영속성**: 앱 재시작 후에도 데이터가 유지되어야 함 (`IndexedDB` 필수).
- **대기열(Queue)**: 오프라인 상태에서 수행된 작업은 큐에 저장되어야 함.
- **동기화**: 네트워크 복구 시 자동 재전송.
- **충돌 해결**: 버전 충돌 발생 시 사용자 주도의 병합/선택 절차 제공.

## 3. 아키텍처 설계 (Architecture Design)

### 3.1 기술 스택

- **상태 관리**: `@tanstack/react-query` (v5)
- **오프라인 저장소**: `IndexedDB` (경량 래퍼 `idb-keyval` 또는 `dexie` 사용)
- **네트워크 감지**: `navigator.onLine` + 윈도우 이벤트 리스너

### 3.2 데이터 흐름 (Data Flow)

#### A. 데이터 읽기 (오프라인 모드)

TanStack Query의 `persistQueryClient` 플러그인을 활용합니다.

- **메커니즘**: 성공한 쿼리 결과를 `localStorage`(또는 이미지는 `IndexedDB`)에 캐싱합니다.
- **TTL (유효기간)**: 중요 리소스(작업일지 초안, 현장 정보 등)에 대해 `maxAge`를 24시간으로 설정하여 오프라인에서도 조회 가능하게 합니다.

#### B. 데이터 쓰기 (오프라인 모드)

변경 요청(Mutation)이 가장 복잡한 부분입니다. 기본 `useMutation`은 오프라인 요청을 자동으로 큐에 넣지 않습니다.

**새로운 추상화**: `useOfflineMutation` 훅 개발.

1.  **가로채기 (Intercept)**: `mutate` 호출 시 `navigator.onLine`을 확인.
2.  **온라인일 때**: 표준 API 호출을 그대로 수행.
3.  **오프라인일 때**:
    - `MutationPayload` 객체 생성: `{ id, type, payload, timestamp, retryCount: 0 }`.
    - `OfflineMutationQueue` (IndexedDB)에 저장.
    - `onMutate`를 통해 UI에 낙관적 업데이트(Optimistic Update) 적용 (사용자에게는 "저장됨"으로 표시).
    - 토스트 메시지: "단말기에 임시 저장되었습니다 (오프라인)".

#### C. 동기화 (Sync Engine)

전역 `OfflineSyncProvider` 컴포넌트가 다음을 수행:

1.  `window.addEventListener('online')` 감지.
2.  연결 복구 시:
    - `OfflineMutationQueue`에서 모든 항목 조회.
    - 타임스탬프 순으로 정렬 (FIFO).
    - 순차적 처리.
    - **성공 시**: 큐에서 삭제, 관련 쿼리 무효화(Invalidate).
    - **실패 시 (4xx/5xx)**:
      - **409 Conflict**: 해당 항목을 `CONFLICT` 상태로 마킹하고 "충돌 해결 UI" 오픈.
      - **일시적 오류 (500/네트워크)**: 재시도 횟수 증가 후 백오프(대기) 적용.

## 4. 충돌 해결 전략 (Conflict Resolution)

서버가 `409 Conflict`를 반환하거나 버전 불일치가 감지될 때:

1.  **큐 차단**: 의존성 있는 후속 작업 처리 일시 중지.
2.  **알림**: "동기화 충돌이 감지되었습니다."
3.  **UI 표시**: 모달을 통해 다음을 비교:
    - **로컬 버전**: 사용자가 오프라인에서 입력한 내용.
    - **서버 버전**: 현재 서버에 저장된 내용.
4.  **선택 옵션**:
    - "서버 덮어쓰기" (강제 푸시)
    - "서버 내용 유지" (로컬 내용 폐기)
    - "병합" (수동 편집)

## 5. 범위 및 난이도 평가

### 난이도: **높음 (High, 7/10)**

- **복잡성**: 상태 동기화는 경쟁 조건(Race Condition)으로 인해 본질적으로 복잡합니다.
- **리스크**: 데이터 손실(Data Loss)이 가장 큰 위험 요소이며, 견고한 에러 처리가 필수적입니다.

### 영향받는 영역

1.  **`lib/offline`**:
    - `queue.ts`: IndexedDB 큐 관리 로직.
    - `sync.ts`: 동기화 프로세서 로직.
2.  **`hooks/use-offline-mutation.ts`**: 개발자가 사용할 핵심 훅.
3.  **`modules/mobile`**:
    - `WorkLogWritePage`: 기존 `useMutation`을 `useOfflineMutation`으로 교체.
    - `PhotoRegistry`: 저장 로직 업데이트.
4.  **Global Layout**: `<OfflineSyncProvider />` 추가.

## 6. 구현 계획

### 1단계: 기반 마련 (라이브러리 & 헬퍼)

- `idb-keyval` 설치.
- 큐 작업을 위한 `lib/offline/store.ts` 생성.

### 2단계: 훅 개발 (`useOfflineMutation`)

- `useMutation`을 래핑하여 오프라인 분기를 처리하는 훅 작성.

### 3단계: 동기화 엔진 (Sync Engine)

- 백그라운드 재전송/재시도 로직 구현.

### 4단계: UI 통합

- 가장 중요한 **작업일지 작성** 화면부터 적용.
- 전역적으로 보이는 "동기화 중..." / "오프라인" 상태 표시기 추가.

### 5단계: 충돌 해결 UI

- 수동 해결을 위한 모달(Modal) 구현.
