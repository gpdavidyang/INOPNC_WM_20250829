# 📋 INOPNC WM 프론트엔드 재구축 실행 계획서

## 1. **프로젝트 현황 분석**

### 1.1 현재 상태

- **총 수정 파일**: 121개 (커밋되지 않은 상태)
- **빌드 오류**: `getProfile` 중복 정의 등 import 충돌
- **영향 범위**: 모바일 사용자 UI (작업자, 현장관리자, 파트너사)
- **소요 시간**: 24시간+ 디버깅 시도
- **상태**: 기술 부채 누적으로 재구축 필요

### 1.2 재사용 가능 자산 ✅

#### 백엔드 인프라 (100% 재사용)

```
Supabase DB
├── 94개 테이블 정상 동작
├── 모든 데이터 구조 완벽 보존
└── RLS 정책 및 인덱스 완료

API Routes
├── 51개 API 디렉토리 존재
├── admin, auth, daily-reports, materials 등
└── RESTful 엔드포인트 완전 동작

Server Actions
├── 29개 서버 액션 파일 존재
├── attendance.ts, daily-reports.ts 등
└── 비즈니스 로직 100% 완성

Environment
├── Supabase 연결 정상
├── 환경 변수 설정 완료
└── Vercel 배포 환경 준비됨
```

#### 관리자 UI (100% 재사용)

```
관리자 대시보드
├── /app/dashboard/admin/: 58개 파일
├── /components/admin/: 51개 컴포넌트
├── 독립적인 import 체계
└── 모바일 UI와 완전 분리됨

관리자 전용 기능
├── AdminDashboardLayout.tsx
├── AdminDataTable.tsx
├── AdminPermissionValidator.tsx
├── 사용자 관리, 현장 관리
├── 급여 시스템, 문서 관리
└── 시스템 설정 및 모니터링
```

#### 기존 비즈니스 로직 (참조용)

```
모바일 컴포넌트 (로직 추출)
├── attendance-tab.tsx (53KB - 출근관리)
├── daily-reports-tab-new.tsx (7KB - 일일보고서)
├── documents-tab.tsx (7KB - 문서함)
├── site-info-tab.tsx (현장정보)
├── home-tab-simple.tsx (21KB - 홈 대시보드)
└── work-logs-tab.tsx (작업 로그)

파트너사 컴포넌트
├── PartnerDashboard.tsx (2.4KB)
├── PartnerWorkLogDetailPage.tsx (24KB)
├── PartnerSidebar.tsx (9.4KB)
└── PartnerBottomNavigation.tsx (4.4KB)
```

## 2. **재구축 범위 정의**

### 2.1 Clean-up 범위 (삭제 대상)

```bash
❌ 삭제할 파일들
├── app/dashboard/*.tsx (admin 제외)
├── app/partner/*.tsx
├── components/dashboard/tabs/*.tsx
├── 121개 수정된 파일들 (import 충돌)
└── 혼재된 컴포넌트 의존성
```

### 2.2 신규 구축 범위

```bash
✅ 새로운 모듈 구조
├── modules/
│   ├── worker-site-manager/     # 작업자/현장관리자 통합
│   │   ├── pages/              # 페이지 컴포넌트
│   │   ├── components/         # 전용 UI 컴포넌트
│   │   ├── hooks/              # 커스텀 훅
│   │   └── types/              # 타입 정의
│   │
│   ├── partner/                # 파트너사 독립 모듈
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── shared/                 # 공용 컴포넌트
│       ├── ui/                 # 디자인 시스템 컴포넌트
│       ├── layouts/            # 레이아웃
│       ├── hooks/              # 공용 훅
│       └── utils/              # 유틸리티
│
└── styles/
    └── design-system/          # CSS 디자인 시스템
        ├── tokens.css          # CSS 변수
        ├── components.css      # 컴포넌트 스타일
        └── animations.css      # 애니메이션
```

## 3. **단계별 구현 계획**

### **Phase 0: Clean-up & 준비** ⏱️ 30분

```bash
□ Git 백업
  git stash save "backup-before-frontend-rebuild-$(date)"

□ 새 브랜치 생성
  git checkout -b feature/frontend-rebuild

□ 문제 파일들 정리
  # 121개 수정 파일 롤백
  git reset --hard HEAD

  # 문제가 있는 모바일 UI 삭제
  rm -rf app/dashboard/!(admin)
  rm -rf app/partner/
  rm -rf components/dashboard/tabs/

□ 폴더 구조 생성
  mkdir -p modules/{worker-site-manager,partner,shared}/{pages,components,hooks,types}
  mkdir -p modules/shared/{ui,layouts}
  mkdir -p styles/design-system

□ 기본 설정 확인
  npm run build  # 에러 해결 확인
```

### **Phase 1: 디자인 시스템 구축** ⏱️ 1시간

```css
□ CSS 변수 시스템 구현 (디자인CSS규칙.txt 기반)
/* styles/design-system/tokens.css */
:root {
  /* Colors */
  --bg: #f6f9ff;
  --card: #ffffff;
  --text: #1a1a1a;
  --brand: #1a254f;
  --gray-btn: #99a4be;
  --sky-btn: #00bcd4;
  --accent: #0068fe;
  --accent-cyan: #00bcd4;
  --warn: #ea3829;

  /* Typography */
  --font-sans: 'Noto Sans KR', system-ui, sans-serif;
  --font-brand: 'Poppins', var(--font-sans);
  --fs-title: 24px;
  --fs-h2: 18px;
  --fs-body: 15px;

  /* Sizes */
  --r: 14px;
  --pad: 14px;
  --btn-h: 44px;
  --gap: 12px;
}
```

```tsx
□ 기본 컴포넌트 구현
// modules/shared/ui/Button.tsx
type ButtonProps = {
  variant?: 'primary' | 'gray' | 'sky' | 'outline' | 'ghost' | 'danger'
  size?: 'default' | 'sm' | 'lg'
  children: React.ReactNode
}

// modules/shared/ui/Card.tsx
// modules/shared/ui/Chip.tsx
// modules/shared/ui/Input.tsx
// modules/shared/ui/Notification.tsx
```

### **Phase 2: 작업자/현장관리자 모듈** ⏱️ 3시간

```tsx
□ 레이아웃 구성
// modules/shared/layouts/MobileLayout.tsx
- HeaderBar (사이트 정보, 알림, 프로필)
- 메인 콘텐츠 영역
- BottomNavigation (홈, 출근, 보고서, 문서함, 더보기)

// modules/shared/layouts/BottomNavigation.tsx
const tabs = [
  { icon: Home, label: '홈', path: '/dashboard' },
  { icon: Clock, label: '출근', path: '/dashboard/attendance' },
  { icon: FileText, label: '보고서', path: '/dashboard/reports' },
  { icon: Folder, label: '문서함', path: '/dashboard/documents' },
  { icon: MoreHorizontal, label: '더보기', path: '/dashboard/more' }
]
```

```tsx
□ 핵심 페이지 구현 (기존 로직 재사용)
// modules/worker-site-manager/pages/HomePage.tsx
- 현장 정보 카드 (site.html 참조)
- 최근 출근 현황
- 공지사항 및 알림
- 오늘의 작업 현황

// modules/worker-site-manager/pages/AttendancePage.tsx
- 기존 attendance-tab.tsx 로직 이전
- QR 체크인/체크아웃
- 출근 기록 조회
- 위치 기반 출근 확인

// modules/worker-site-manager/pages/DailyReportPage.tsx
- 기존 daily-reports-tab-new.tsx 로직 이전
- 일일 작업 보고서 작성
- 사진 첨부 및 코멘트
- 작업 현황 입력

// modules/worker-site-manager/pages/DocumentsPage.tsx (doc.html 참조)
- 기존 documents-tab.tsx 로직 이전
- 문서 목록 및 검색
- 필수 서류 제출
- 파일 업로드/다운로드

// modules/worker-site-manager/pages/SiteInfoPage.tsx
- 기존 site-info-tab.tsx 로직 이전
- 현장 상세 정보
- 작업 지시사항
- 안전 수칙 및 공지
```

```tsx
□ 상태 관리 설정
// modules/worker-site-manager/hooks/useAuth.ts
// modules/worker-site-manager/hooks/useSiteInfo.ts
// modules/worker-site-manager/hooks/useAttendance.ts

// stores/authStore.ts (Zustand)
interface AuthStore {
  user: User | null
  profile: Profile | null
  currentSite: Site | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
```

### **Phase 3: 파트너사 모듈** ⏱️ 2시간

```tsx
□ 파트너 레이아웃
// modules/partner/layouts/PartnerLayout.tsx
- 기존 PartnerSidebar.tsx 로직 활용
- 데스크톱 중심 UI
- 네비게이션 메뉴

□ 파트너 페이지 구현
// modules/partner/pages/PartnerDashboard.tsx
- 기존 컴포넌트 로직 재사용
- 현장별 작업 현황
- 인력 배치 현황

// modules/partner/pages/WorkLogPage.tsx (worklog.html 참조)
- 기존 PartnerWorkLogDetailPage.tsx 활용
- 작업 일지 관리
- 현장별 진행률

// modules/partner/pages/SiteManagementPage.tsx
- 현장 관리 기능
- 작업자 배정

// modules/partner/pages/WorkerManagementPage.tsx
- 작업자 관리
- 급여 및 성과 관리
```

### **Phase 4: 백엔드 연결** ⏱️ 1시간

```tsx
□ API 연결 설정
// lib/api-client.ts
- 기존 Server Actions 연동
- 에러 핸들링 표준화
- 로딩 상태 관리

□ 데이터 페칭 최적화
// hooks/useQuery.ts (SWR 기반)
const useAttendanceRecords = () => {
  return useSWR('/api/attendance', fetcher, {
    refreshInterval: 30000, // 30초마다 갱신
    revalidateOnFocus: false
  })
}

□ 실시간 업데이트
// hooks/useRealtime.ts (Supabase Realtime)
- 출근 상태 실시간 업데이트
- 새 공지사항 알림
- 작업 지시사항 변경
```

### **Phase 5: 테스트 & 최적화** ⏱️ 1시간

```bash
□ 기능 테스트
- 로그인/로그아웃 플로우
- 역할별 접근 권한 (worker, site_manager, customer_manager)
- 데이터 CRUD 동작
- 파일 업로드/다운로드
- 실시간 알림

□ 성능 최적화
- Next.js 코드 스플리팅
- 이미지 최적화 (next/image)
- 번들 분석 및 크기 최적화
- 메모리 누수 점검

□ UI/UX 검증
- 모바일 반응형 확인
- 터치 인터랙션 테스트
- 로딩 상태 UX
- 에러 상태 처리
```

### **Phase 6: 배포** ⏱️ 30분

```bash
□ 빌드 검증
npm run build    # 빌드 에러 0개 확인
npm run lint     # 린트 에러 해결
npm run type-check  # 타입 에러 해결

□ 환경 설정
- Vercel 환경변수 동기화
- Supabase 연결 테스트
- 도메인 설정 확인

□ 배포 실행
vercel --prod

□ 배포 후 검증
- 로그인 테스트
- 핵심 기능 동작 확인
- 성능 모니터링 설정
```

## 4. **기술 스택**

### Frontend Framework

```typescript
- Next.js 14 (App Router)
- TypeScript 5.0+
- React 18 (Server Components)
```

### 스타일링

```css
- CSS Modules + CSS Variables (디자인 시스템)
- Tailwind CSS (유틸리티 클래스)
- Framer Motion (애니메이션)
```

### 상태 관리

```typescript
- Zustand (글로벌 상태)
- React Context (컴포넌트 로컬 상태)
- SWR (서버 상태 관리)
```

### 백엔드 연동

```typescript
- Supabase (Database, Auth, Realtime)
- Next.js Server Actions
- SWR (데이터 페칭 & 캐싱)
```

### 개발 도구

```json
- ESLint + Prettier (코드 품질)
- Husky (Git hooks)
- TypeScript (타입 안전성)
```

## 5. **리스크 관리 및 대응 방안**

| 리스크           | 확률 | 영향도 | 대응 방안                            |
| ---------------- | ---- | ------ | ------------------------------------ |
| API 호환성 문제  | 낮음 | 높음   | 기존 Server Actions 그대로 사용      |
| 인증 플로우 깨짐 | 낮음 | 높음   | `/lib/supabase/` 보호된 파일 보존    |
| 디자인 불일치    | 중간 | 중간   | HTML 템플릿 픽셀 단위 참조 구현      |
| 데이터 손실      | 낮음 | 높음   | Git stash 백업 + 데이터베이스 무변경 |
| 일정 지연        | 중간 | 중간   | 단계별 MVP 우선 구현                 |
| 성능 저하        | 낮음 | 중간   | 코드 스플리팅 + SWR 캐싱             |

### 백업 및 복구 계획

```bash
# 백업
git stash save "pre-rebuild-backup-$(date +%Y%m%d-%H%M%S)"

# 문제 발생시 복구
git stash pop           # 백업된 상태로 복구
git checkout main       # 안정된 브랜치로 복귀
```

## 6. **예상 결과 및 성공 지표**

### 6.1 기술적 성공 지표

- ✅ **빌드 에러 0개**: TypeScript 컴파일 성공
- ✅ **ESLint 경고 0개**: 코드 품질 기준 충족
- ✅ **번들 크기**: 2MB 이하 (gzipped)
- ✅ **로딩 성능**: First Contentful Paint < 2초
- ✅ **접근성**: WCAG 2.1 AA 준수

### 6.2 기능적 성공 지표

- ✅ **로그인/인증**: 모든 사용자 역할 정상 동작
- ✅ **CRUD 기능**: 출근, 보고서, 문서 관리 완전 동작
- ✅ **실시간 기능**: 알림, 상태 업데이트 정상
- ✅ **파일 처리**: 업로드/다운로드 안정적 동작
- ✅ **모바일 UX**: 터치 인터랙션 및 반응형 완벽

### 6.3 사용자 경험 지표

- ✅ **디자인 일치도**: HTML 템플릿 100% 재현
- ✅ **사용성**: 기존 워크플로우 동일하게 유지
- ✅ **안정성**: 크래시 0건, 에러율 < 0.1%
- ✅ **성능**: 인터랙션 응답시간 < 100ms

## 7. **실행 시나리오**

### 7.1 즉시 실행 명령어

```bash
# 1. 현재 상태 백업
git stash save "backup-before-rebuild-$(date +%Y%m%d-%H%M%S)"
echo "✅ 백업 완료: $(git stash list | head -1)"

# 2. 새 브랜치 생성
git checkout -b feature/frontend-rebuild
echo "✅ 브랜치 생성: feature/frontend-rebuild"

# 3. 문제 파일 정리
git reset --hard HEAD
rm -rf app/dashboard/!(admin)
rm -rf app/partner/
rm -rf components/dashboard/tabs/
echo "✅ 문제 파일 정리 완료"

# 4. 폴더 구조 생성
mkdir -p modules/{worker-site-manager,partner,shared}/{pages,components,hooks,types}
mkdir -p modules/shared/{ui,layouts}
mkdir -p styles/design-system
echo "✅ 모듈 구조 생성 완료"

# 5. 빌드 테스트
npm run build
echo "✅ 빌드 확인 완료"
```

### 7.2 단계별 체크포인트

```markdown
□ Phase 0 완료 → 빌드 에러 해결됨
□ Phase 1 완료 → 디자인 시스템 동작 확인
□ Phase 2 완료 → 작업자 모듈 기본 기능
□ Phase 3 완료 → 파트너사 모듈 기본 기능  
□ Phase 4 완료 → 백엔드 연동 및 데이터 표시
□ Phase 5 완료 → 전체 기능 테스트 통과
□ Phase 6 완료 → 배포 성공 및 운영 시작
```

## 8. **예상 소요 시간**

| Phase   | 작업 내용              | 예상 시간 | 누적 시간 |
| ------- | ---------------------- | --------- | --------- |
| Phase 0 | Clean-up & 준비        | 30분      | 30분      |
| Phase 1 | 디자인 시스템 구축     | 1시간     | 1.5시간   |
| Phase 2 | 작업자/현장관리자 모듈 | 3시간     | 4.5시간   |
| Phase 3 | 파트너사 모듈          | 2시간     | 6.5시간   |
| Phase 4 | 백엔드 연결            | 1시간     | 7.5시간   |
| Phase 5 | 테스트 & 최적화        | 1시간     | 8.5시간   |
| Phase 6 | 배포                   | 30분      | **9시간** |

**총 예상 시간: 8-10시간 (집중 작업 기준)**

---

## 9. **시작 준비**

이 문서를 기반으로 다음 단계로 진행하시겠습니까?

1. **Phase 0 시작**: Clean-up 및 프로젝트 구조 재정리
2. **디자인 시스템 우선 구현**: 안정적인 UI 기반 구축
3. **단계별 점진적 구현**: 각 단계별 검증 후 다음 단계 진행

**실행 명령어가 준비되었습니다. 언제든지 시작하실 수 있습니다! 🚀**
