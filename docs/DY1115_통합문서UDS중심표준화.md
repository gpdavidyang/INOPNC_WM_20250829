# DY1115 – 통합 문서 UDS 중심 표준화 계획

## 1. 배경 및 문제

- **데이터 분산**: 현장 앱(`site_documents`), 본사 공유자료/도면마킹(`unified_document_system`, `markup_documents`)이 따로 저장되어 화면마다 다른 내용이 노출됨.
- **동기화 부재**: 업로드/수정/삭제가 각 테이블별로만 적용되어 “동시에 표시” 요구를 충족하지 못함.
- **필드 불일치**: 현장/작업일지/분류 정보가 위치마다 다르게 저장되어 연결 상태를 추적하기 어려움.

## 2. 목표

1. 현장/본사/도면마킹 화면 모두가 동일 문서를 바라보는 구조 확립.
2. 업로드·미리보기·열기·수정·삭제 시 한 번의 API 호출로 전체 Sync 보장.
3. 향후 권한/분류/통계 확장 시 단일 스키마만 변경하면 되도록 설계.

## 3. 기준 아키텍처 (UDS 중심)

```
현장 앱 업로드 ─┐
도면마킹 도구 ─┼─> Unified Document System (shared category)
관리자 UI   ───┘
                    │
                    ├─ async hooks: markup_documents (필요 시)
                    └─ legacy cache: site_documents (단계적 축소)
                    └─ SiteForm/문서링크, 오늘의 현장, PTW 연동
```

### 핵심 설계 원칙

- **UDS 단일 진실 원본(SSOT)**: 모든 공유자료는 `unified_document_system`에 저장.
- **메타데이터 표준화**
  - `site_id`, `linked_worklog_id`, `classification`(공도면/진행도면)
  - `source_table/source_id`로 도면마킹/현장 업로드 등 출처 추적
  - 파일 URL/미리보기/스토리지 경로 일원화
- **공통 서비스 레이어**: 업로드·수정·삭제·열기 요청이 동일 server action을 호출하고 필요한 파생 테이블(`markup_documents`)을 내부에서 갱신.
- **점진적 전환**: `site_documents`는 읽기 전용 캐시/백워드 호환 역할만 남기고 UDS로 이관.

## 4. 구현 단계

### Phase 1 – 준비 / Schema 정리

1. UDS 컬럼 정의 정리
   - 필수: `site_id`, `category_type`, `sub_category`, `status`, `metadata (linked_worklog_id, source_table, signer 등)`
   - 권한: org/site 기반 필터 기준 확정.
2. `site_documents` → UDS 마이그레이션 스크립트 작성 (1회 + 증분).
3. 업로드/메타데이터 저장 API 공통 유틸(`lib/unified-documents.ts`) 확장.

### Phase 2 – 업로드 경로 통합

1. 현장 앱 `/api/site-documents/upload` → UDS 쓰도록 변경 (필요 시 기존 API 래핑).
2. 도면마킹 저장/삭제 시 `linkUnifiedDocumentToMarkupDoc` 활용해 UDS 동기화.
3. 관리자 공유자료 탭 수정/삭제도 동일 API 사용하도록 조정.

### Phase 3 – 조회/뷰 통일

1. **현장 공유함**: 데이터를 `unified_document_system`에서 직접 조회하도록 교체.
2. **본사 공유자료 탭**: 현행 유지(이미 UDS 기반)하되 신규 필드(작업일지, 분류) 표준화.
3. **도면마킹 관리**: `sharedDocs` 생성 로직을 UDS 공통 헬퍼로 교체.
4. **현장 정보 수정 > 문서 링크**: SiteForm이 참조하는 링크 목록을 UDS 기반으로 재구성, `site_documents` 참조 제거.
5. **오늘의 현장 / PTW**: 모바일·파트너 홈에서 사용하는 “오늘의 현장” 데이터, PTW/공도면/진행도면 링크가 모두 UDS 기준으로 노출되도록 API 업데이트.

### Phase 4 – Legacy 정리

1. `site_documents` 읽기 경로 제거 혹은 캐시만 남김.
2. 마이그레이션 완료 후 데이터 일치 검사 및 알림.
3. 문서 작업자동화/통계 등 부가 기능 업데이트.

## 5. 고려사항 및 리스크

- **데이터 마이그레이션**: 대용량 파일/수천 건 레코드 이동 시 다운타임 최소화 필요.
- **권한 모델**: 현장/본사/파트너 권한이 다르므로 UDS API에서 역할별 필터링 재검토.
- **파일 스토리지 중복**: 기존 site_documents 경로와 UDS 경로를 통일하거나 symlink 전략 필요.
- **테스트 범위**: 웹/모바일/관리자 세 채널(현장 공유함, 도면마킹, SiteForm 문서 링크, 오늘의 현장/PTW) 모두 회귀 테스트 필요.

## 6. 후속 작업 목록

1. 데이터 현황 조사: site_documents vs UDS 레코드 수, 중복 여부.
2. Schema 문서화: `docs/`에 UDS 필드 정의, 메타데이터 계약서 작성.
3. 공통 서비스 모듈 작성 (`lib/unified-document-service.ts` 등) 후 API 리팩터링.
4. 단계별 릴리즈 계획 (마이그레이션 → 업로드 전환 → 조회 전환 → SiteForm/오늘의 현장/PTW 반영) 수립.

---

담당: @INOPNC Platform  
작성일: 2025-11-15
