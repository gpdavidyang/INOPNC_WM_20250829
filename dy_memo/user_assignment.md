📋 현재 상태 분석

    1. 기존 인프라 확인 ✅

    - 데이터베이스 스키마: site_assignments 테이블과 관련 함수들이 이미
    구현되어 있음
    - 백엔드 Action: app/actions/admin/sites.ts에 배정 관련 함수들 존재
      - getSiteAssignments() - 현장 배정 조회
      - assignUserToSite() - 사용자 현장 배정
      - removeUserFromSite() - 사용자 현장 해제
    - 컴포넌트 구조: SiteUnifiedManagement.tsx에 WorkerAssignmentTab
    placeholder 존재
    - 타입 정의: types/index.ts에 SiteAssignment, SiteAssignmentRole 등 정의됨

    2. 현재 문제점

    - WorkerAssignmentTab 컴포넌트가 기본적인 목록 표시만 구현됨
    - 사용자 검색/필터링 기능 없음
    - 배정/해제 UI 없음
    - 역할별 권한 관리 미구현

    🚀 구현 계획

    Phase 1: 핵심 워커 배정 UI 구현

    1. 사용자 검색 및 필터링 시스템
      - 이름/이메일로 사용자 검색
      - 역할별 필터링 (worker, site_manager, customer_manager)
      - 페이지네이션 지원
    2. 배정된 사용자 목록 개선
      - 카드형 레이아웃으로 사용자 정보 표시
      - 역할 배지, 배정일, 연락처 정보 표시
      - 해제 버튼 및 역할 변경 기능
    3. 새로운 사용자 배정 모달
      - 사용자 검색 및 선택 인터페이스
      - 역할 선택 (worker, site_manager, supervisor)
      - 배정 타입 선택 (permanent, temporary, substitute)
      - 배정 메모 입력

    Phase 2: 고급 기능 구현

    1. 일괄 배정/해제 기능
      - 여러 사용자 선택하여 한 번에 배정
      - 일괄 해제 기능
      - 진행 상황 표시
    2. 배정 이력 관리
      - 사용자별 배정 이력 조회
      - 배정 변경 로그 표시
      - 엑셀 내보내기 기능
    3. 권한 기반 접근 제어
      - 역할별 다른 배정 권한
      - 자기 현장만 관리할 수 있는 site_manager
      - 전체 관리 가능한 admin

    Phase 3: 성능 최적화 및 UX 개선

    1. 실시간 업데이트
      - 배정 변경 시 실시간 목록 갱신
      - 알림 시스템 연동
    2. 모바일 최적화
      - 반응형 디자인 적용
      - 터치 친화적 인터페이스

    🔧 구현할 파일들

    1. 핵심 컴포넌트 업데이트

    - components/admin/SiteUnifiedManagement.tsx - WorkerAssignmentTab 전면
    재구현
    - components/admin/WorkerAssignmentManager.tsx - 새로운 전용 컴포넌트 생성

    2. 모달 컴포넌트 생성

    - components/admin/modals/AssignWorkerModal.tsx - 사용자 배정 모달
    - components/admin/modals/ChangeRoleModal.tsx - 역할 변경 모달
    - components/admin/modals/BulkAssignModal.tsx - 일괄 배정 모달

    3. 백엔드 액션 확장

    - app/actions/admin/sites.ts - 기존 함수 개선
    - app/actions/admin/users.ts - 사용자 검색 함수 추가

    4. 타입 정의 보완

    - types/index.ts - 필요한 인터페이스 추가

    ⚠️ 주요 고려사항

    1. 보안 및 권한

    - RLS 정책 준수
    - 관리자만 배정/해제 가능
    - 개인정보 보호 (전화번호, 이메일 마스킹)

    2. 사용자 경험

    - 직관적인 드래그 앤 드롭 인터페이스 고려
    - 실수 방지를 위한 확인 다이얼로그
    - 로딩 상태 및 에러 처리

    3. 성능 고려

    - 대량 데이터 처리를 위한 가상화
    - 검색 결과 캐싱
    - 무한 스크롤 구현

    📈 예상 개발 시간

    - Phase 1: 6-8시간 (핵심 기능)
    - Phase 2: 4-6시간 (고급 기능)
    - Phase 3: 2-4시간 (최적화)

    이 계획을 통해 현장관리자가 효율적으로 작업자를 배정하고, 각 사용자의
    현장별 권한을 체계적으로 관리할 수 있는 완전한 시스템을 구축하겠습니다.


    현장관리의 작업자 배정 기능을 성공적으로 구현했습니다!

🎉 구현 완료된 기능들:

1. 백엔드 확장 ✅

- searchAvailableUsers() - 현장에 배정 가능한 사용자 검색
- updateSiteAssignmentRole() - 사용자 역할 변경
- 기존 assignUserToSite(), removeUserFromSite() 함수 활용

2. AssignWorkerModal 컴포넌트 ✅

- 사용자 검색: 이름/이메일로 실시간 검색
- 역할 필터링: 작업자, 현장관리자, 시공업체 담당자로 필터
- 일괄 선택: 여러 사용자를 한 번에 배정 가능
- 페이지네이션: 무한 스크롤 지원
- 배정 역할 선택: worker, site_manager, supervisor 중 선택
- 조직 정보 표시: 사용자의 소속 및 현재 배정 현황

3. WorkerAssignmentTab 전면 재구현 ✅

- 통계 대시보드: 전체/역할별 배정자 현황
- 개선된 사용자 목록: 카드형 레이아웃, 역할 배지
- 역할 변경: 인라인 역할 변경 모달
- 사용자 해제: 확인 다이얼로그와 함께 안전한 해제
- 빈 상태 처리: 배정된 작업자가 없을 때 안내

4. 핵심 UX 개선 ✅

- 직관적인 인터페이스: 명확한 아이콘과 색상 구분
- 실시간 피드백: 토스트 메시지로 작업 결과 즉시 표시
- 로딩 상태: 모든 비동기 작업에 대한 로딩 인디케이터
- 에러 처리: 포괄적인 에러 핸들링과 사용자 친화적 메시지

이제 시스템관리자는 현장별로 작업자를 효율적으로 배정하고 관리할 수 있으며,
각 사용자의 현장별 권한이 적절히 제어됩니다. 배정된 사용자들은 자신이 배정된
현장의 데이터만 볼 수 있게 됩니다.
