# 도면마킹 도구 및 문서함 통합 개선 계획서

## 📊 현재 시스템 분석 보고서

### 1. 현재 아키텍처 문제점

#### 1.1 데이터베이스 구조 산발성
- **4개의 독립된 테이블 운영**
  - `markup_documents`: 도면 마킹 문서 전용
  - `photo_grid_reports`: 사진대지 문서 전용  
  - `shared_documents`: 공유 문서 전용
  - `unified_documents`: 통합 문서 시도 (부분적 구현)

- **문제점**
  - 각 테이블마다 다른 스키마 구조
  - 중복된 기능 구현
  - 데이터 정합성 관리 어려움
  - 통합 검색/필터링 불가능

#### 1.2 역할별 접근 권한 불일치
- **현재 권한 체계**
  ```
  markup_documents: location 필드 기반 (personal/shared)
  photo_grid_reports: created_by 기반 소유자 권한만
  unified_documents: is_public 플래그 + site_id 기반
  shared_documents: 별도 권한 체계 없음
  ```

- **역할별 접근 현황**
  - 작업자(worker): 제한적 접근, 일관성 없음
  - 현장관리자(site_manager): 현장별 다른 권한
  - 파트너사(partner): 문서 타입별 상이한 접근
  - 본사(admin): 전체 권한이나 UI 분산

#### 1.3 UI/UX 일관성 부족

**독립적인 컴포넌트들**:
| 컴포넌트 | 위치 | 용도 | 문제점 |
|---------|------|------|--------|
| MarkupEditor | /components/markup/ | 도면 마킹 | 독립 UI, 별도 저장 포맷 |
| PhotoGridCreator | /components/photo-grid-tool/ | 사진대지 | 다른 UX 패턴 |
| UnifiedDocumentManager | /components/unified-documents/ | 통합 시도 | 부분적 통합만 |
| MarkupToolManagement | /admin/tools/ | 관리자용 | 관리자 전용 분리 |
| PartnerDocumentsTab | /partner/tabs/ | 파트너용 | 역할별 중복 구현 |

#### 1.4 파일 포맷 및 저장 방식 불일치
```javascript
// markup_documents
{
  markup_data: JSONB,  // 마킹 데이터
  original_blueprint_url: TEXT,
  preview_image_url: TEXT
}

// photo_grid_reports  
{
  before_photo_url: TEXT,
  after_photo_url: TEXT,
  component_name: VARCHAR,
  work_process: VARCHAR
}

// unified_documents
{
  file_url: TEXT,
  metadata: JSONB,
  photo_metadata: JSONB,
  markup_data: JSONB
}
```

### 2. 주요 이슈 요약

1. **데이터 일관성**: 동일 문서가 여러 테이블에 분산 저장
2. **권한 관리**: 불필요한 현장 제약과 복잡한 권한 체계
3. **사용자 경험**: 문서 타입별로 다른 UI/UX로 혼란
4. **유지보수성**: 중복 코드와 산발적 구조로 관리 어려움
5. **확장성**: 새 문서 타입 추가 시 전체 시스템 수정 필요
6. **협업 제약**: 작업자/현장관리자 간 불필요한 현장 경계로 협업 저해

---

## 🎯 통합 개선 계획

### Phase 1: 데이터베이스 통합 (1-2주)

#### 1.1 통합 스키마 설계
```sql
-- 통합 문서 테이블 확장
CREATE TABLE unified_documents_v2 (
  -- 기본 정보
  id UUID PRIMARY KEY,
  document_type VARCHAR NOT NULL, -- 'markup', 'photo_grid', 'shared', 'required', 'invoice'
  title VARCHAR NOT NULL,
  description TEXT,
  
  -- 파일 정보
  file_url TEXT NOT NULL,
  file_name VARCHAR NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR,
  
  -- 분류 정보
  category_type VARCHAR NOT NULL,
  sub_category VARCHAR,
  tags TEXT[],
  
  -- 권한 정보
  access_level VARCHAR NOT NULL, -- 'private', 'site', 'role', 'public'
  allowed_roles TEXT[],
  allowed_users UUID[],
  
  -- 관계 정보
  site_id UUID REFERENCES sites(id),
  created_by UUID REFERENCES profiles(id),
  uploaded_by UUID REFERENCES profiles(id),
  customer_company_id UUID,
  daily_report_id UUID,
  
  -- 메타데이터 (타입별 특화 데이터)
  metadata JSONB,
  markup_data JSONB,
  photo_metadata JSONB,
  
  -- 워크플로우
  status VARCHAR DEFAULT 'active',
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- 버전 관리
  version INTEGER DEFAULT 1,
  parent_document_id UUID,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 역할 기반 권한 매트릭스

**핵심 원칙**:
- 작업자와 현장관리자는 모든 현장 문서에 동일한 접근 권한 (현장 제약 없음)
- 파트너사만 소속 회사 문서로 접근 제한
- 본사관리자만 승인 권한 보유

| 역할 | 개인문서 | 현장공유 | 도면마킹 | 사진대지 | 필수제출 | 기성청구 |
|------|---------|---------|---------|---------|---------|---------|
| 작업자 | 생성/수정/삭제 | 전체접근 | 전체접근 | 생성/수정 | 생성/수정 | 읽기 |
| 현장관리자 | 생성/수정/삭제 | 전체접근 | 전체접근 | 생성/수정 | 생성/수정 | 읽기 |
| 파트너사 | 생성/수정 | 자사문서만 | 자사문서만 | 자사문서만 | 자사문서만 | 자사문서 전체관리 |
| 본사관리자 | 전체관리 | 전체관리 | 전체관리 | 전체관리 | 전체관리/승인 | 전체관리/승인 |

**역할별 특징**:
- **작업자**: 모든 현장의 문서를 자유롭게 열람하고 작업 가능
- **현장관리자**: 작업자와 동일한 권한 + 작업지시서 작성 권한 (승인은 본사에서)
- **파트너사**: 소속 회사(customer_company_id) 관련 문서만 접근
- **본사관리자**: 시스템 전체 관리, 모든 승인 권한 보유

#### 1.3 통합 RLS 정책
```sql
-- 통합 RLS 정책 예시
CREATE POLICY "unified_document_access" ON unified_documents_v2
FOR ALL USING (
  -- 본사 관리자: 모든 접근
  (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')))
  OR
  -- 작업자 및 현장관리자: 모든 현장 문서 접근 (현장 제약 없음)
  (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('worker', 'site_manager')))
  OR
  -- 파트너사: 자사 문서만 접근
  (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'customer_manager')
    AND customer_company_id IN (
      SELECT customer_company_id FROM profiles WHERE id = auth.uid()
    )
  )
  OR
  -- 문서 소유자: 자신이 생성한 문서 권한
  (created_by = auth.uid())
  OR
  -- 공개 문서
  (access_level = 'public')
);

-- 승인 권한은 본사 관리자만
CREATE POLICY "document_approval_policy" ON unified_documents_v2
FOR UPDATE USING (
  -- 승인 관련 필드는 본사 관리자만 수정 가능
  (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')))
  OR
  -- 일반 수정은 위 정책 따름 (승인 필드 제외)
  (
    NOT (NEW.approved_by IS DISTINCT FROM OLD.approved_by) 
    AND NOT (NEW.approved_at IS DISTINCT FROM OLD.approved_at)
    AND NOT (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved')
  )
);
```

### Phase 2: UI/UX 통합 (2-3주)

#### 2.1 통합 문서함 컴포넌트 구조
```typescript
// 통합 문서 뷰어 컴포넌트
interface UnifiedDocumentViewerProps {
  userRole: UserRole;
  viewMode: 'list' | 'grid' | 'kanban';
  documentType?: DocumentType;
  companyId?: string; // 파트너사용 필터
}

// 역할별 뷰 컴포넌트 (간소화)
components/
  documents/
    UnifiedDocumentViewer/
      index.tsx                 // 메인 컴포넌트
      GeneralUserView.tsx      // 작업자/현장관리자 통합 뷰
      PartnerView.tsx          // 파트너사 뷰 (회사 필터링)
      AdminView.tsx            // 본사관리자 뷰 (승인 기능 포함)
      DocumentList.tsx         // 공통 리스트
      DocumentFilters.tsx      // 공통 필터
      DocumentActions.tsx      // 문서 액션
      ApprovalManager.tsx      // 승인 관리 (관리자 전용)
```

#### 2.2 통합 마킹 도구
```typescript
// 통합 마킹 엔진
components/
  marking-tools/
    UnifiedMarkingEngine/
      index.tsx                // 메인 엔진
      Canvas/
        KonvaCanvas.tsx        // Konva.js 기반 캔버스
        Tools/
          DrawingTool.tsx      // 도면 마킹
          PhotoGridTool.tsx    // 사진 그리드
          StampTool.tsx        // 스탬프
          TextTool.tsx         // 텍스트
      Toolbar/
        UnifiedToolbar.tsx     // 통합 도구바
      SaveManager/
        DocumentSaver.tsx      // 통합 저장 관리
```

#### 2.3 일관된 UI 패턴
- **공통 디자인 시스템**
  - 통일된 색상 팔레트
  - 일관된 아이콘 세트
  - 표준화된 버튼/폼 스타일
  - 반응형 레이아웃

- **공통 인터랙션 패턴**
  - 드래그 앤 드롭
  - 컨텍스트 메뉴
  - 단축키 체계
  - 알림/토스트 메시지

### Phase 3: 기능 고도화 (2-3주)

#### 3.1 실시간 협업
```typescript
// Supabase Realtime 활용
const documentChannel = supabase
  .channel(`document:${documentId}`)
  .on('presence', { event: 'sync' }, () => {
    // 실시간 사용자 표시
  })
  .on('broadcast', { event: 'cursor' }, (payload) => {
    // 실시간 커서 동기화
  })
  .on('broadcast', { event: 'changes' }, (payload) => {
    // 실시간 변경사항 동기화
  })
  .subscribe();
```

#### 3.2 워크플로우 엔진
```typescript
// 문서 승인 워크플로우
interface DocumentWorkflow {
  stages: WorkflowStage[];
  currentStage: string;
  history: WorkflowHistory[];
}

interface WorkflowStage {
  id: string;
  name: string;
  requiredRole: UserRole;
  actions: WorkflowAction[];
  nextStages: string[];
}
```

#### 3.3 버전 관리
```typescript
// 문서 버전 관리
interface DocumentVersion {
  versionNumber: number;
  changes: ChangeLog[];
  createdBy: string;
  createdAt: Date;
  snapshot: DocumentSnapshot;
}
```

### Phase 4: 마이그레이션 및 배포 (1주)

#### 4.1 데이터 마이그레이션 전략
```sql
-- 단계적 마이그레이션
-- Step 1: 데이터 복사
INSERT INTO unified_documents_v2 (...)
SELECT ... FROM markup_documents;

-- Step 2: 관계 재설정
UPDATE unified_documents_v2 
SET relationships = ...;

-- Step 3: 권한 마이그레이션
UPDATE unified_documents_v2
SET access_level = ..., allowed_roles = ...;
```

#### 4.2 배포 계획
1. **개발 환경 테스트** (3일)
2. **스테이징 환경 검증** (3일)
3. **프로덕션 단계적 롤아웃** (1일)
   - 10% 사용자 → 50% → 100%

---

## 📈 기대 효과

### 정량적 효과
- **개발 효율성**: 중복 코드 70% 감소
- **유지보수 시간**: 50% 단축
- **버그 발생률**: 60% 감소
- **사용자 만족도**: 30% 향상 예상

### 정성적 효과
- **일관된 사용자 경험**: 모든 역할에서 동일한 인터페이스
- **향상된 협업**: 현장 제약 없는 자유로운 문서 공유 및 실시간 편집
- **단순화된 권한**: 명확하고 간단한 역할 기반 접근 (작업자/현장관리자 통합)
- **강화된 보안**: 파트너사 격리 및 본사 중앙 승인 체계
- **확장 가능한 구조**: 새로운 문서 타입 쉽게 추가

---

## 🚀 실행 로드맵

### 2025년 1월 (준비 단계)
- [ ] 상세 기술 스펙 작성
- [ ] 데이터베이스 스키마 최종 설계
- [ ] UI/UX 목업 작성

### 2025년 2월 (Phase 1-2)
- [ ] 데이터베이스 통합 구현
- [ ] 통합 컴포넌트 개발
- [ ] 단위 테스트 작성

### 2025년 3월 (Phase 3-4)
- [ ] 고급 기능 구현
- [ ] 통합 테스트
- [ ] 데이터 마이그레이션
- [ ] 프로덕션 배포

### 2025년 4월 (안정화)
- [ ] 모니터링 및 최적화
- [ ] 사용자 피드백 수집
- [ ] 버그 수정 및 개선

---

## 📝 리스크 관리

### 주요 리스크
1. **데이터 마이그레이션 실패**
   - 대응: 완벽한 백업 및 롤백 계획
   
2. **사용자 저항**
   - 대응: 단계적 전환 및 충분한 교육

3. **성능 저하**
   - 대응: 캐싱 전략 및 최적화

4. **호환성 문제**
   - 대응: 레거시 API 유지

---

## 👥 담당 조직

- **프로젝트 리더**: 시스템 아키텍트
- **개발팀**: 풀스택 개발자 3명
- **UI/UX팀**: 디자이너 1명
- **QA팀**: 테스터 2명
- **DevOps**: 인프라 엔지니어 1명

---

*작성일: 2025년 1월 9일*
*버전: 1.0*