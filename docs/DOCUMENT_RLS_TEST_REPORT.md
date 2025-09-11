# 문서함 RLS (Row Level Security) 테스트 보고서

## 📋 테스트 개요

- **테스트 일시**: 2025년 9월 11일
- **테스트 목적**: 문서 업로드 권한 문제 해결 및 RLS 정책 검증
- **테스트 대상**: documents 테이블, Storage documents 버킷
- **문제 증상**: 현장관리자 화면에서 파일 업로드 시 500 에러 발생

## 🔍 문제 원인 분석

### 1. 초기 문제점
- **API 에러**: "Failed to upload file to storage"
- **근본 원인 1**: `document_type` 필드의 CHECK 제약조건
  - API에서 'general' 사용 → 허용된 값: ['personal', 'shared', 'blueprint', 'report', 'certificate', 'other']
- **근본 원인 2**: RLS 정책이 단일 정책으로 모든 작업을 처리하여 세밀한 제어 불가

### 2. 기존 RLS 정책 문제점
```sql
-- 기존: 단일 정책으로 모든 작업 처리
"documents_access_policy" FOR ALL
```
- SELECT/INSERT/UPDATE/DELETE가 동일한 조건 적용
- 문서 업로드 시 불필요한 제약 발생

## 🛠️ 해결 방안

### 1. API 코드 수정
```typescript
// 변경 전
document_type: documentType || 'general'

// 변경 후
document_type: documentType || 'other'
```

### 2. RLS 정책 세분화
작업별로 정책을 분리하여 세밀한 제어:

| 작업 | 정책 | 설명 |
|------|------|------|
| **SELECT** | `documents_select_policy` | 자신의 문서 또는 할당된 사이트의 공개 문서 조회 |
| **INSERT** | `documents_insert_policy` | 모든 인증된 사용자가 자신의 문서 업로드 가능 |
| **UPDATE** | `documents_update_policy` | 자신의 문서만 수정 (관리자 예외) |
| **DELETE** | `documents_delete_policy` | 자신의 문서만 삭제 (관리자 예외) |

## ✅ 테스트 결과

### 1. Storage 버킷 테스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 파일 업로드 | ✅ 성공 | documents 버킷 public=true |
| 파일 조회 | ✅ 성공 | Public URL 접근 가능 |
| 파일 삭제 | ✅ 성공 | 소유자만 삭제 가능 |

### 2. Documents 테이블 CRUD 테스트
| 작업 | 현장관리자 | 작업자 | 관리자 | 결과 |
|------|-----------|--------|--------|------|
| INSERT | ✅ 가능 | ✅ 가능 | ✅ 가능 | 성공 |
| SELECT (본인) | ✅ 가능 | ✅ 가능 | ✅ 가능 | 성공 |
| SELECT (타인) | ⚠️ 공개만 | ⚠️ 공개만 | ✅ 가능 | 정상 |
| UPDATE (본인) | ✅ 가능 | ✅ 가능 | ✅ 가능 | 성공 |
| UPDATE (타인) | ❌ 불가 | ❌ 불가 | ✅ 가능 | 정상 |
| DELETE (본인) | ✅ 가능 | ✅ 가능 | ✅ 가능 | 성공 |
| DELETE (타인) | ❌ 불가 | ❌ 불가 | ✅ 가능 | 정상 |

### 3. RLS 정책 효과성
- **보안성**: 각 사용자는 자신의 문서만 수정/삭제 가능
- **유연성**: 공개 문서는 사이트 할당된 사용자들이 조회 가능
- **관리성**: 관리자는 모든 문서에 대한 전체 권한 보유

## 📊 RLS 정책 요약

### Documents 테이블 정책
```sql
-- SELECT: 자신의 문서 또는 공개 문서
owner_id = auth.uid() OR (is_public AND site_assigned)

-- INSERT: 인증된 사용자는 자신의 문서 업로드
owner_id = auth.uid()

-- UPDATE/DELETE: 자신의 문서만 또는 관리자
owner_id = auth.uid() OR is_admin_user()
```

### Storage 버킷 설정
- **버킷명**: documents
- **공개 여부**: public = true
- **접근 제어**: 인증된 사용자만 업로드 가능

## 🔧 적용된 수정사항

1. **API 수정** (`/app/api/documents/route.ts:299`)
   - document_type 기본값을 'other'로 변경
   
2. **RLS 정책 개선**
   - 단일 정책을 4개의 세분화된 정책으로 분리
   - 각 작업별 적절한 권한 부여

3. **테스트 스크립트 추가**
   - `/scripts/test-document-upload-rls.ts`: 문제 진단
   - `/scripts/test-document-upload-fixed.ts`: 해결 확인

## 💡 권장사항

### 1. 추가 개선 필요
- [ ] Storage 버킷에 RLS 정책 추가 검토
- [ ] 문서 공유 기능 구현 시 별도 권한 테이블 추가
- [ ] 문서 버전 관리 기능 추가 시 RLS 확장

### 2. 모니터링
- [ ] 문서 업로드 실패율 모니터링
- [ ] 권한 오류 로그 수집 및 분석
- [ ] 정기적인 RLS 정책 검토

## ✅ 결론

문서함 RLS 정책이 성공적으로 개선되었습니다:
- ✅ 현장관리자의 문서 업로드 문제 해결
- ✅ 각 역할별 적절한 권한 부여
- ✅ 보안성과 유연성의 균형 달성

현장관리자를 포함한 모든 인증된 사용자가 문서를 업로드하고 관리할 수 있으며, 동시에 타인의 문서에 대한 무단 접근은 차단됩니다.

---
*테스트 수행: Claude Code Assistant*  
*관련 파일: `/app/api/documents/route.ts`, `/scripts/test-document-upload-*.ts`*