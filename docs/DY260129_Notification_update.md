# 260129 알림 기능 요구사항 및 구현 계획

## 1. 요구사항 요약

1. **미작성 작업일지 리마인더**
   - 매일 16:00(KST) 정시에 당일 작업일지를 작성하지 않은 사용자에게 알림을 발송.
   - 채널은 웹푸시(PWA 상단 알림), 추후 필요 시 이메일/알림톡 확장.
2. **작업일지 주요 이벤트 알림**
   - 제출, 승인, 반려 시 관계자(작성자, 승인자, 현장 관리자 등)에게 즉시 알림 전달.
   - 승인/반려 결과와 이동 경로(`/dashboard/daily-reports/{id}` 혹은 모바일 페이지)를 포함.
3. **채널 운영 조건**
   - 우선 웹푸시(기존 PWA 알림 시스템)로 구현하고, 구독하지 않은 사용자에게는 이메일을 보조 채널로 사용.
   - 카카오 알림톡/문자는 별도 프로젝트로 후속 추진.
4. **사용자 제어**
   - `notification_preferences`의 quiet hours, 채널 허용/차단 옵션을 존중.
   - 알림 로그(`notification_logs`)와 읽음 상태 유지.

## 2. 구현 계획

> **미작성 작업일지 정의**: 본 문서에서의 “미작성”은 상태값이 `draft`(임시저장)인 작업일지를 의미하며, 아직 제출하지 않은 건만 리마인더 대상으로 삼는다.

### 2.1 웹푸시 인프라 재활성화

- Vercel Cron(또는 Supabase Scheduler)을 이용해 매일 16:00 KST에 `/api/daily-reports/reminder/schedule`를 실행하고, `/api/notifications/process-scheduled`를 5~10분 주기로 호출해 큐를 소진.
- cron 호출 시 `CRON_SECRET` 검증을 활성화하고, 실행 실패/성공 로그를 `notification_jobs`(신규)나 Logflare에 기록.

### 2.2 미작성 리마인더 워크플로우

1. **스케줄 생성**
   - `scheduled_notifications` 테이블에 KST 기준 매일 16:00 실행 레코드를 저장.
   - `notification_type = 'daily_report_reminder'`, 대상 site_ids/organization_id, payload URL(`/mobile/daily-reports/new`).
2. **대상 계산**
   - `scheduled_notifications` 실행 시점에 `work_records`와 `daily_reports`를 비교해 오늘 미작성자를 쿼리.
   - 쿼리 결과를 `user_ids` 필드에 주입 후 푸시 발송.
3. **알림 발송**
   - `pushNotificationService.sendNotification`을 통해 브라우저 푸시 트리거.
   - 푸시 미구독자는 이메일 템플릿(`/components/admin/legacy/EmailNotifications`)을 재사용해 “미작성 리마인더” 메일 발송(선택).

### 2.3 제출/승인/반려 이벤트 알림

1. **서버 액션 연동**
   - `notifyDailyReportSubmitted/Approved/Rejected` 함수에 `pushNotificationService.sendNotification` 호출을 추가.
   - payload에는 알림 제목·본문·이동 URL(`/dashboard/daily-reports/{id}` 또는 `/mobile/worklog/{id}`)을 포함.
2. **관계자 매핑**
   - 제출 시: 현장 관리자(`profiles.site_ids`)와 승인자 큐에 발송.
   - 승인/반려 시: 작성자 + 담당 관리자에게 발송.
3. **알림 리스트 반영**
   - 기존처럼 `notifications` 테이블에 insert하여 앱 내 알림 센터에서도 확인 가능하게 유지.

### 2.4 사용자 설정 및 UI

1. **알림 센터**
   - 상단 종 아이콘 배지와 `/mobile/notifications` 페이지에서 새 이벤트가 바로 표시되도록 `notification_logs` insert 후 실시간 업데이트(현재 Supabase 채널 활용).
2. **설정 화면**
   - `components/settings/notification-settings-page.tsx`에서 리마인더 on/off, 조용한 시간 설정을 노출.
3. **테스트**
   - `components/admin/legacy/notification-tester.tsx`에 “미작성 리마인더” 시나리오 버튼 추가.
   - Playwright/E2E에서 푸시 모킹(`lib/test-utils/mocks/pwa.mock.ts`)을 활용해 알림 수신 여부 검증.

### 2.5 후속 작업(선택)

1. **카카오 알림톡 연동**
   - Biz Message API 연동, 템플릿 승인, `kakao_notification_logs` 테이블 설계.
2. **알림 대시보드**
   - `/dashboard/admin/notifications`에서 리마인더 발송 통계, 실패 로그 확인.
3. **모바일 앱 뱃지/딥링크**
   - `lib/deep-linking.ts`에 `daily_report_reminder` → `/mobile/worklog/new` 링크 추가.

## 3. 일정/우선순위

1. **Phase 1 (1~2일)**: cron 연결, 미작성 쿼리, push 발송 파이프라인 구현.
2. **Phase 2 (1일)**: 제출/승인/반려 이벤트 푸시 연동 및 이메일 백업.
3. **Phase 3 (선택)**: 설정 UI, 통계/로그, 알림톡 확장.

> 참고: 기존 `notificationHelpers`·`scheduled_notifications` 스키마를 재사용하면 추가 인프라 없이 단기간에 요구사항을 충족할 수 있습니다.\*\*\*
