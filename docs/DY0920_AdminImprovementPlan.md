# 관리자 영역 개선 계획 (DY0920)

## 1. 현황 요약
- 다수의 관리자 라우트가 핵심 컴포넌트 import 없이 JSX만 선언되어 빌드 실패
- 주요 관리자 컴포넌트가 UI 요소 및 상태 훅 import 누락, 대부분 목(Mock) 데이터/랜덤 데이터 사용
- 통계 및 배정 관련 API 엔드포인트(`/api/admin/**`) 미구현
- 대규모 Lint 오류 (React JSX undefined, hooks dependency 등)로 CI 파이프라인 차단 예상

## 2. 개선 목표
1. **기본 동작 보장**: 모든 관리자 페이지가 최소한의 데이터로 정상 렌더링
2. **데이터 파이프라인 정비**: 관리자 대시보드 주요 지표 API 구축 및 더미 데이터 제거
3. **UI 구성요소 정리**: 공용 컴포넌트/아이콘 import 누락 해소 및 재사용 구조화
4. **품질 확보**: ESLint 경고 제거, 필수 테스트(페이지 로드, 주요 액션) 추가

## 3. 단계별 실행 계획
### Phase 1. 라우트/컴포넌트 안정화
- [ ] `app/dashboard/admin/**/page.tsx`에서 사용하는 컴포넌트 import 정리
- [ ] `components/admin/**` 전역 점검: React, UI 컴포넌트(shadcn), 아이콘, hook import 명시
- [ ] 더미 JSX 제거 또는 명확한 PLACEHOLDER UI로 대체 (추후 API 연동 전까지)
- [ ] 공통 Provider 구조 확인 (`<Providers>`) – FontSize/Touch/Contrast 컨텍스트 적용 확인

### Phase 2. API & 서비스 레이어 구축
- [ ] `/app/api/admin/assignment/dashboard` 등 필요한 관리자 API 목록 정의
- [ ] Supabase View/RPC 여부 검토 후, 임시 stub 데이터라도 route handler에 구현
- [ ] `admin-dashboard-content.tsx`, `AssignmentDashboard.tsx`, `AnalyticsDashboard.tsx` 등에서 fetch 대상 API를 실제 구현으로 교체
- [ ] 공용 fetch 유틸 분리 (`lib/admin/api.ts` 등)로 에러/로딩 핸들링 일관화

### Phase 3. UI/UX 개선
- [ ] 카드/표 컴포넌트에 TouchMode, FontSize, Contrast 연동 확인 및 스타일 통일
- [ ] 데이터 없을 때의 빈 상태/에러/로딩 컴포넌트 구현
- [ ] 관리자용 Global Search/Quick Action 설정 등 모달 UX 다듬기 (탭, 필터, 검색 UX 점검)
- [ ] 접근성 점검: alt 텍스트, 버튼 라벨, 키보드 포커스 흐름 정리

### Phase 4. 품질 보증
- [ ] ESLint 전역 검사 通과 (`npm run lint`)
- [ ] 핵심 페이지용 Playwright smoke test 또는 Vitest snapshot 추가
- [ ] 관리자 API용 통합 테스트(권한 체크 포함) 초안 작성
- [ ] 배포 전 체크리스트 문서화 (Rollback 전략, 모니터링 지표)

## 4. 산출물 및 일정 가이드
| 작업 | 예상 일정 | 산출물 |
| --- | --- | --- |
| Phase 1 | 1~2일 | 컴포넌트 import 정리, placeholder UI | 
| Phase 2 | 2~3일 | `/api/admin/**` route handlers, 데이터 모델 문서 |
| Phase 3 | 2일 | 관리자 UI 개선 스크린샷, UX 시나리오 |
| Phase 4 | 1일 | 테스트 스크립트, 배포 체크리스트 |

## 5. 리스크 및 대응
- **API 스펙 미확정**: 우선 mock → 실제 쿼리로 대체 가능한 인터페이스 설계(Repository pattern)
- **Supabase 스키마 의존**: DB schema 문서화/ERD 최신화 필요
- **리소스 부족**: Phase 우선순위 조정(1→2→4→3)으로 최소 기능 확보 후 UI 개선

---
담당: ✦ (배정 예정)
진행 상태는 `/docs/STATUS_ADMIN.md` 또는 Issue Tracker에서 추적 예정.
