📋 네비게이션 리팩토링 & 코드베이스 Clean-up 구현 계획서

  1. 프로젝트 개요

  1.1 현재 상황

  - 문제: React Error #185 (무한 순환 참조) 지속 발생
  - 원인: 복잡한 네비게이션 시스템의 순환 의존성
  - 영향: 프로덕션 환경에서 documents 탭 접근 시 앱 크래시

  1.2 목표

  - React Error #185 완전 해결
  - 네비게이션 시스템 단순화
  - 코드베이스 30% 축소
  - 성능 및 유지보수성 향상

  2. 기술 아키텍처 변경사항

  2.1 Before (현재)

  ┌─────────────────────────────────────┐
  │         Dashboard Layout             │
  │  ┌─────────────────────────────┐    │
  │  │  Hash Navigation (#docs)     │    │
  │  │  Path Navigation (/docs)     │    │
  │  │  State Management (activeTab)│    │
  │  └─────────────────────────────┘    │
  │              ↓↑ 순환참조             │
  │  ┌─────────────────────────────┐    │
  │  │  DocumentsTabUnified         │    │
  │  │  - onTabChange prop          │    │
  │  │  - Internal state            │    │
  │  └─────────────────────────────┘    │
  └─────────────────────────────────────┘

  2.2 After (목표)

  ┌─────────────────────────────────────┐
  │         Dashboard Layout             │
  │  ┌─────────────────────────────┐    │
  │  │  URL-based Navigation Only   │    │
  │  │  (/dashboard/documents)      │    │
  │  └─────────────────────────────┘    │
  └─────────────────────────────────────┘
                   ↓ 단방향
  ┌─────────────────────────────────────┐
  │     Documents Page (독립)            │
  │  ┌─────────────────────────────┐    │
  │  │  Query Params (?tab=personal)│    │
  │  │  Internal State Only         │    │
  │  └─────────────────────────────┘    │
  └─────────────────────────────────────┘

  3. 상세 구현 계획

  Phase 1: 긴급 수정 (Day 1)

  목표: React Error #185 즉시 해결

  Task 1.1: Documents 페이지 독립화

  // /app/dashboard/documents/page.tsx
  - 서버 리다이렉트 제거
  - 클라이언트 컴포넌트로 전환
  - 자체 레이아웃 구현
  - DocumentsTabUnified 직접 렌더링

  Task 1.2: 순환 의존성 제거

  // /components/dashboard/tabs/documents-tab-unified.tsx
  - onTabChange prop 완전 제거
  - useSearchParams() 사용으로 전환
  - 내부 상태만으로 관리

  Task 1.3: Navigation 컴포넌트 수정

  // /components/ui/bottom-navigation.tsx
  - React.cloneElement 제거
  - 안전한 직접 렌더링 구현

  // /components/dashboard/sidebar.tsx  
  - Hash 네비게이션 로직 제거
  - 직접 path 라우팅으로 변경

  Task 1.4: Dashboard Layout 정리

  // /components/dashboard/dashboard-layout.tsx
  - documents-unified 케이스 제거
  - hashchange 리스너 제거
  - useEffect 통합 (2개 → 1개)

  Phase 2: 코드 정리 (Day 2-3)

  Task 2.1: 디버깅 코드 제거

  # Console.log 일괄 제거 스크립트
  - 243개 파일에서 1,149개 console.log 제거
  - 프로덕션 빌드용 babel 플러그인 설정

  Task 2.2: 사용하지 않는 파일 삭제

  # 정리 대상
  - /components/daily-reports/.deprecated/* (7개 파일)
  - *.bak, *.backup 파일
  - 중복 컴포넌트들

  Task 2.3: 컴포넌트 통합

  | 현재 (중복)                                      | 통합 후                  |
  |----------------------------------------------|-----------------------|
  | documents-tab.tsx, documents-tab-unified.tsx | documents-page.tsx    |
  | my-documents.tsx, my-documents-improved.tsx  | my-documents.tsx      |
  | daily-report-form 변종 5개                      | daily-report-form.tsx |

  Task 2.4: Import 정리

  // ESLint 규칙 추가
  "no-unused-vars": "error",
  "no-unused-imports": "error",
  "import/order": ["error", {
    "groups": ["builtin", "external", "internal"]
  }]

  Phase 3: 최적화 (Day 4-5)

  Task 3.1: 번들 분석 및 최적화

  # 번들 분석
  npm run analyze

  # 최적화 목표
  - Tree shaking 개선
  - Dynamic imports 추가
  - 불필요한 의존성 제거

  Task 3.2: 성능 최적화

  // React 최적화
  - React.memo 적용 (15개 주요 컴포넌트)
  - useMemo/useCallback 활용
  - 컴포넌트 lazy loading 확대

  Task 3.3: 타입 안전성 강화

  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }

  4. 테스트 계획

  4.1 단위 테스트

  // 새로운 테스트 추가
  - navigation-state.test.ts
  - documents-page.test.tsx
  - error-boundary.test.tsx

  4.2 통합 테스트

  // E2E 테스트 시나리오
  1. Dashboard → Documents 네비게이션
  2. Documents 내부 탭 전환
  3. 모바일/데스크톱 반응형 테스트
  4. 에러 복구 시나리오

  4.3 성능 테스트

  - Lighthouse 점수 측정
  - 번들 크기 비교
  - 초기 로딩 시간 측정
  - 메모리 사용량 모니터링

  5. 위험 관리

  5.1 잠재 위험

  | 위험            | 영향도 | 대응 방안       |
  |---------------|-----|-------------|
  | 기존 북마크 URL 깨짐 | 중   | 리다이렉트 규칙 추가 |
  | 사용자 워크플로우 변경  | 중   | 단계별 배포      |
  | 예상치 못한 의존성    | 높   | 철저한 테스트     |

  5.2 롤백 계획

  # Git 태그 기반 롤백
  git tag pre-refactor-backup
  git push origin pre-refactor-backup

  # 문제 발생 시
  git revert --no-commit HEAD~5..HEAD

  6. 일정 계획

  전체 일정: 5일

  | 일차    | 작업 내용                   | 완료 기준          |
  |-------|-------------------------|----------------|
  | Day 1 | Phase 1 (긴급 수정)         | Error #185 해결  |
  | Day 2 | Phase 2.1-2.2 (코드 정리)   | Console.log 제거 |
  | Day 3 | Phase 2.3-2.4 (컴포넌트 통합) | 중복 제거 완료       |
  | Day 4 | Phase 3 (최적화)           | 번들 25% 감소      |
  | Day 5 | 테스트 & 배포                | 프로덕션 배포        |

  7. 예상 결과

  7.1 정량적 지표

  - 코드 라인 수: 30% 감소 (약 10,000줄)
  - 번들 크기: 25% 감소 (2.5MB → 1.9MB)
  - 빌드 시간: 40% 단축 (3분 → 1.8분)
  - Lighthouse 점수: 85 → 95

  7.2 정성적 개선

  - 네비게이션 로직 단순화
  - 유지보수성 향상
  - 개발자 경험 개선
  - 버그 발생 가능성 감소

  8. 팀 커뮤니케이션

  8.1 이해관계자 통보

  - PM: 일정 및 영향 범위 공유
  - QA: 테스트 계획 협의
  - DevOps: 배포 일정 조율

  8.2 문서화

  - 변경사항 문서 작성
  - 마이그레이션 가이드 제공
  - API 변경사항 공지

  9. 성공 기준

  ✅ React Error #185 완전 해결✅ 모든 테스트 통과✅ 성능 지표 목표 달성✅ 프로덕션 배포
  후 24시간 안정성 확인✅ 사용자 피드백 긍정적

  10. 참고 자료

  - https://react.dev/errors/185
  - https://nextjs.org/docs/app
  - https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer

  ---
  작성일: 2024년 9월 11일작성자: Claude Assistant승인 대기: 프로젝트 관리자

