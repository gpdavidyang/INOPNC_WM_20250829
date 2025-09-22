# 📱 모바일 메뉴 구조별 해당 파일명

## **1. 하단 네비게이션 (Bottom Navigation)**

_파일: `/modules/shared/layouts/mobile-bottom-nav.tsx`_

| 메뉴명       | 경로                 | 페이지 파일                       | 컴포넌트 파일                                            |
| ------------ | -------------------- | --------------------------------- | -------------------------------------------------------- |
| **홈**       | `/mobile`            | `/app/mobile/page.tsx`            | `/modules/mobile/pages/home-page.tsx`                    |
| **출근**     | `/mobile/attendance` | `/app/mobile/attendance/page.tsx` | `/modules/mobile/pages/attendance-page.tsx`              |
| **작업일지** | `/mobile/worklog`    | `/app/mobile/worklog/page.tsx`    | `/modules/worker-site-manager/pages/WorkLogHomePage.tsx` |
| **현장정보** | `/mobile/sites`      | `/app/mobile/sites/page.tsx`      | `/modules/mobile/components/site/SiteInfoPage.tsx`       |
| **문서함**   | `/mobile/docs`       | `/app/mobile/documents/page.tsx`  | `/modules/mobile/pages/documents-page-v2.tsx`            |

## **2. 빠른메뉴 (Quick Menu)**

_파일: `/modules/mobile/components/home/QuickMenu.tsx`_

| 메뉴명       | 경로                                  | 페이지 파일                              | 컴포넌트 파일                                            |
| ------------ | ------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| **출력현황** | `/mobile/attendance/output`           | `/app/mobile/attendance/output/page.tsx` | (미확인)                                                 |
| **작업일지** | `/mobile/worklog`                     | `/app/mobile/worklog/page.tsx`           | `/modules/worker-site-manager/pages/WorkLogHomePage.tsx` |
| **현장정보** | `/mobile/sites`                       | `/app/mobile/sites/page.tsx`             | `/modules/mobile/components/site/SiteInfoPage.tsx`       |
| **문서함**   | `/mobile/documents`                   | `/app/mobile/documents/page.tsx`         | `/modules/mobile/pages/documents-page-v2.tsx`            |
| **본사요청** | `https://open.kakao.com/o/g6r8yDRh`   | (외부 링크)                              | (카카오톡 오픈채팅)                                      |
| **재고관리** | `/mobile/sites#npc-inventory-section` | `/app/mobile/sites/page.tsx`             | `/modules/mobile/components/site/SiteInfoPage.tsx`       |

## **3. 추가 발견된 페이지들**

_앱 구조에서 발견된 기타 페이지들_

| 페이지명          | 경로                    | 페이지 파일                          |
| ----------------- | ----------------------- | ------------------------------------ |
| **작업일지 작성** | `/mobile/worklog/new`   | `/app/mobile/worklog/new/page.tsx`   |
| **업무관리**      | `/mobile/tasks`         | `/app/mobile/tasks/page.tsx`         |
| **자재관리**      | `/mobile/materials`     | `/app/mobile/materials/page.tsx`     |
| **일일보고서**    | `/mobile/daily-reports` | `/app/mobile/daily-reports/page.tsx` |
| **알림**          | `/mobile/notifications` | `/app/mobile/notifications/page.tsx` |
| **요청사항**      | `/mobile/requests`      | `/app/mobile/requests/page.tsx`      |
| **마크업 도구**   | `/mobile/markup-tool`   | `/app/mobile/markup-tool/page.tsx`   |

## **4. 컴포넌트 구조 정리**

### **주요 레이아웃 컴포넌트:**

- **모바일 홈 래퍼**: `/modules/mobile/pages/mobile-home-wrapper.tsx`
- **하단 네비게이션**: `/modules/shared/layouts/mobile-bottom-nav.tsx`
- **빠른메뉴**: `/modules/mobile/components/home/QuickMenu.tsx`
- **인증 가드**: `/modules/mobile/components/auth/mobile-auth-guard.tsx`

### **핵심 발견사항:**

1. **작업일지**는 `/modules/worker-site-manager/pages/WorkLogHomePage.tsx` 컴포넌트를 사용 (HTML 참조 파일과 95% 일치)
2. **하단 네비게이션**과 **빠른메뉴**에서 중복된 메뉴들이 있음 (작업일지, 현장정보, 문서함)
3. **재고관리**는 현장정보 페이지의 특정 섹션으로 연결됨
4. 모든 모바일 페이지는 **MobileAuthGuard**로 권한 검증을 수행함

다음은 라우팅과 구현 시 혼선을 일으킬 수 있는 소스 파일들을 정리한 목록입니다:

🚨 작업일지/Work Report 관련 중복 파일들

⚠️ 핵심 혼선 파일들:

- /modules/worker-site-manager/pages/WorkLogHomePage.tsx ← 현재 사용 중
- /app/mobile/worklog/page.tsx ← 현재 라우팅
- /app/mobile/work-report/page.tsx ← 중복 라우팅!
- /modules/work-report/pages/WorkReportHomePage.tsx ← 중복 컴포넌트!

Legacy HTML 파일들:

- /references/html-templates/work_report_home.html
- /references/html-templates/work_report_photo_grid.html
- /references/html-templates/work_report_view.html

📁 문서함/Documents 관련 중복 파일들

⚠️ 경로 혼선:

- 하단 네비: /mobile/docs ← 다른 경로
- 빠른메뉴: /mobile/documents ← 다른 경로
- 실제 페이지: /app/mobile/documents/page.tsx

컴포넌트 버전 중복:

- /modules/mobile/pages/documents-page.tsx ← V1
- /modules/mobile/pages/documents-page-v2.tsx ← V2 (현재 사용)
- /modules/mobile/pages/documents-page-v2.css ← 스타일

🏢 현장정보/Site Info 관련 중복 파일들

⚠️ 다중 구현체:

- /modules/mobile/components/site/SiteInfoPage.tsx ← 모바일용
- /components/site-info/SiteInfoPageClient.tsx ← 데스크톱용
- /components/site-info/SiteInfoPageNew.tsx ← 새 버전?
- /components/site-info/SimpleSiteInfo.tsx ← 간단 버전?
- /components/site-info/TodaySiteInfo.tsx ← 오늘 정보?

⏰ 출근/Attendance 관련 중복 파일들

⚠️ 컴포넌트 분산:

- /modules/mobile/pages/attendance-page.tsx ← 모바일용
- /components/attendance/attendance-page-client.tsx ← 클라이언트용
- /components/attendance/attendance-calendar-page-client.tsx ← 캘린더용
- /components/attendance/attendance-check.tsx ← 체크용
- /components/attendance/attendance-view.tsx ← 뷰용

📊 Actions 파일 중복들

⚠️ 기능별 분산:

- /app/actions/sites.ts ← 일반 사이트
- /app/actions/admin/sites.ts ← 관리자용
- /app/actions/site-info.ts ← 정보
- /app/actions/site-info-client.ts ← 클라이언트
- /app/actions/site-info-direct.ts ← 직접
- /app/actions/site-info-fallback.ts ← 폴백
- /app/actions/force-site-refresh.ts ← 강제 새로고침

🎯 가장 위험한 혼선 포인트들

1. Work Report vs WorkLog - 같은 기능, 다른 이름
2. Documents 경로 이중화 - /docs vs /documents
3. SiteInfo 구현체 4개 - 어떤 걸 써야 할지 모호
4. Actions 파일 분산 - 기능별로 너무 세분화

이런 파일들이 구현할 때 "어떤 걸 써야 하지?"라는 혼선을 만들어내는 주범들입니다.

---

_생성일: 2025-09-17_
_작성자: Claude Code Assistant_
