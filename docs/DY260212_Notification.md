# DY260212 Notification Requirements & Implementation Plan

작성일: 2026-02-12  
대상: INOPNC Work Management System (모바일/PWA + 관리자)  
목적: 작업일지 리마인더 및 승인/반려 상태 변경 알림을 “모바일 상단 푸시(웹푸시) + 앱 내 알림센터”로 일관되게 제공

---

## 0. 범위/전제

### 0.1 범위

1. (리마인더) 작업일지가 `임시(draft)` 상태로 남아 있는 사용자에게 매일 **16:00(KST)** 리마인드 알림 발송
2. (상태 변경) 제출(`submitted`)된 작업일지가 **승인(approved)** 또는 **반려(rejected)** 로 변경되면 관련자에게 알림 발송

### 0.2 전제(현재 코드/인프라 기반)

- 작업일지 데이터는 `daily_reports` 테이블 기반으로 동작한다.
- 알림 히스토리/읽음 배지는 `notification_logs`(RLS 적용) 기반으로 동작한다.
  - 모바일 AppBar 배지: `GET /api/notifications/unread-count`
  - 모바일 알림 모달(알림센터): `GET/PATCH /api/notifications/history`
- 푸시는 Web Push(PWA)로 제공되며, 구독 정보는 **`profiles.push_subscription`** 을 주로 사용한다(`lib/notifications/server-push.ts`).
- 스케줄/크론 실행은 서버 라우트에서 `CRON_SECRET`으로 보호한다.

---

## 1. 용어 정의

- **임시 작업일지(draft)**: `daily_reports.status = 'draft'`
- **제출 작업일지(submitted)**: `daily_reports.status = 'submitted'`
- **승인 작업일지(approved)**: `daily_reports.status = 'approved'`
- **반려 작업일지(rejected)**: `daily_reports.status = 'rejected'`
- **미작성자(리마인더 대상)**: “16:00(KST) 시점에 당일 작업일지를 제출/승인 상태로 만들지 않은 사용자”
  - 기본 규칙: 당일(`work_date = 오늘(KST)`)에 대해, 본인(`created_by`)이 `submitted/approved` 상태의 작업일지가 **없으면 대상**
  - 확장 규칙(선택): `draft`가 존재하면 문구를 “임시 저장된 작업일지가 남아있습니다”로 변경

---

## 2. 알림 채널/표시 방식 요구사항

### 2.1 모바일 상단 푸시(웹푸시)

- 브라우저/OS 상단 알림으로 노출되는 Web Push를 기본 채널로 한다.
- 푸시 수신 조건(기술적):
  - PWA 설치(특히 iOS), 알림 권한 허용
  - `profiles.push_subscription` 저장 완료

### 2.2 앱 내 알림센터(필수)

- 푸시를 받지 못한 사용자(미구독/권한거부/오프라인)도 앱 내에서 알림을 확인할 수 있어야 한다.
- 최소 요구:
  - `notification_logs`에 알림 레코드가 남아야 한다.
  - AppBar 배지(unread) 및 `NotificationModal` 목록에서 확인 가능해야 한다.

### 2.3 사용자 설정 준수

- `profiles.notification_preferences`의 다음 설정을 존중한다(있는 경우):
  - `push_enabled`, `email_enabled`
  - 카테고리별 on/off(예: `daily_report_reminders`, `daily_report_updates`)
  - quiet hours(조용한 시간)

---

## 3. 요구사항 1: 임시(draft) 리마인더 (매일 16:00 KST)

### 3.1 사용자 스토리

- 작업자가 16:00에 아직 작업일지를 제출하지 못했을 때, 상단 푸시로 “오늘 작업일지 작성”을 안내받고 즉시 작성 화면으로 이동한다.
- 현장 관리자는 담당 현장에 대해 미제출 상태를 인지하고, 필요 시 확인/독려한다(옵션).

### 3.2 발송 시각/시간대

- 기준: **매일 16:00 (KST, UTC+9)**
- 서버 계산: UTC 기반 저장/조회 시, “오늘”과 “16:00”은 KST로 계산 후 UTC로 변환한다.

### 3.3 대상 선정 규칙(정의)

대상 역할(기본):

- `profiles.role in ('worker','site_manager')` + `profiles.status='active'` (존재 시)

당일 완료 기준:

- `daily_reports.work_date = 오늘(KST)`
- 본인(`created_by = profiles.id`) 기준으로
  - `status in ('submitted','approved')` 가 1건 이상이면 **리마인더 제외**
  - 그 외(없음 또는 draft만 존재 또는 rejected만 존재)면 **리마인더 대상**

문구 분기(권장):

- draft 존재: “임시 저장된 작업일지가 남아있습니다. 제출을 완료해 주세요.”
- draft 없음: “오늘 작업일지를 작성해 주세요.”

### 3.4 알림 콘텐츠(초안)

- notification_type: `daily_report_reminder`
- title: `작업일지 작성 리마인더`
- body(예시):
  - `오늘 작업일지를 작성해 주세요.`
  - 또는 `임시 저장된 작업일지가 남아있습니다. 제출을 완료해 주세요.`
- deep link:
  - 모바일 작성/홈: `/mobile` 또는 `/mobile/worklog` 또는 “신규 작성” 화면(`/mobile/daily-reports/new`가 존재한다면 그 경로)
  - 현재 서비스워커(`public/sw.js`)는 기본적으로 `/dashboard`로 딥링크 되는 케이스가 있어 **푸시 payload에 `url`을 top-level로 포함**하도록 한다.

### 3.5 중복 발송 방지(필수)

- 동일 사용자에게 동일 날짜에 리마인더는 **1회만 발송**
- 권장 dedupe 키:
  - `(user_id, notification_type, work_date)`
- 구현 방식(택1):
  1. (권장) `notification_logs`에 work_date를 metadata로 저장하고, 사전 조회 후 미발송자만 전송
  2. (강화) DB에 유니크 제약/인덱스 추가로 중복 insert 자체를 차단

### 3.6 장애/오류 처리

- cron 실행 실패 시:
  - HTTP 500 + 로그 출력(서버 로그)
  - 재시도는 크론 플랫폼(Vercel Cron) 정책에 따름
- 일부 사용자 push 실패(구독 만료 404/410):
  - 기존 로직대로 `profiles.push_subscription = null`로 정리
  - 알림 로그는 실패로 남기되, 앱 내 알림센터는 “전달 실패”를 숨기거나(현재 unread-count에서 failed 제외) 별도 필터 제공

---

## 4. 요구사항 2: 승인/반려 상태 변경 알림

### 4.1 트리거 조건(정의)

- 대상 레코드: `daily_reports`
- 상태 전이:
  - `submitted -> approved`
  - `submitted -> rejected`

### 4.2 “관련자” 정의(명확화)

필수 수신자:

- **작성자**: `daily_reports.created_by`

권장 수신자(업무 관점, 선택 구현):

- **현장 관리자**: 해당 현장(`daily_reports.site_id`) 담당 `site_manager`
  - (스키마에 따라) `profiles.site_id = site_id` 또는 `profiles.site_ids contains site_id`
- **투입 작업자**: `daily_report_workers.worker_id` 또는 `worker_assignments.profile_id` 등 사용자 ID를 식별할 수 있는 경우
- **승인/반려 처리자**는 기본 제외(본인이 수행했으므로)하되, 운영 정책에 따라 포함 가능

### 4.3 알림 콘텐츠(초안)

승인:

- notification_type: `daily_report_approval`
- title: `작업일지 승인`
- body: `YYYY-MM-DD 작업일지가 승인되었습니다.`
- url:
  - 작성자: `/mobile/worklog`(목록 필터로 해당 날짜/현장) 또는 상세 화면이 있으면 `/mobile/daily-reports/{id}`

반려:

- notification_type: `daily_report_rejection`
- title: `작업일지 반려`
- body: `반려되었습니다. 사유: {reason}` (reason 없으면 사유 문구 생략)
- url:
  - 작성자: 수정 화면(`/mobile/.../edit`) 또는 작업일지 홈으로 이동 후 재제출 안내

### 4.4 중복 발송 방지

- 동일 작업일지에 대해 동일 상태 변경 알림은 관련자별 1회
- dedupe 키(예시):
  - `(user_id, notification_type, report_id)`

---

## 5. 구현 계획(권장 아키텍처)

### 5.1 공통: 알림 단일 소스(로그) 정리

목표:

- “푸시를 받았든 못 받았든” 앱 내 알림센터에서 확인 가능하도록 `notification_logs`를 단일 소스로 사용

정리 포인트:

- `sendPushToUsers`는 push/email 발송 및 `notification_logs` 기록을 수행하나, **미구독 + 이메일 미사용** 사용자는 로그가 남지 않을 수 있다.  
  → 리마인더/승인/반려는 최소한 **in-app 로그 생성**을 보장하는 경로를 포함해야 한다.

권장 구현:

- “로그 insert(모든 대상)” → “푸시 발송(구독자만)”의 2단계로 구성
- 또는 `sendPushToUsers` 내부에 “push 대상이 아니어도 notification_logs insert” 옵션(`skipPrefs`/`forceLog`) 추가

### 5.2 요구사항 1 구현(16:00 리마인더)

권장 경로: **Vercel Cron → `app/api/cron/daily-reminder/route.ts`**

1. 스케줄

- Vercel cron을 16:00 KST(= 07:00 UTC)로 설정
- 엔드포인트는 `CRON_SECRET`으로 보호

2. 대상 조회(쿼리)

- 오늘(KST) 날짜 계산
- 대상 사용자 목록 조회: `profiles`에서 role/status 필터
- 오늘 제출/승인 완료자 조회:
  - `daily_reports` where `work_date=today` and `status in ('submitted','approved')`
  - `created_by` 집합을 만들고, 제외 처리
- (옵션) draft 존재자 조회:
  - `daily_reports` where `work_date=today` and `status='draft'`

3. dedupe

- `notification_logs`에서 `(user_id, notification_type='daily_report_reminder', metadata.work_date=today)` 존재 여부 확인 후 제외

4. 발송

- `notification_logs` 기록 생성(필수)
- web push 발송(구독자만)
- (선택) email 발송(설정 사용 시)

5. 딥링크(payload 규격)

- `public/sw.js`가 `notificationData.url`(top-level)을 사용하므로, push payload는 다음을 포함:
  - `title`, `body`, `type`(예: `DAILY_REPORT_REMINDER`), `url`(예: `/mobile`)
  - `data`: `{ workDate, siteId?, reportId? }`

### 5.3 요구사항 2 구현(승인/반려 상태 변경)

권장 경로: **서버 액션/관리자 액션에서 이미 호출 중인 트리거 함수 확장**

현황:

- `approveDailyReport`에서 `notifyDailyReportApproved/Rejected` 호출이 이미 존재한다:
  - `app/actions/mobile/daily-reports.ts`
  - `app/actions/admin/daily-reports.ts`

추가 구현:

1. 관련자 집계 로직 추가

- 작성자 + 현장관리자 + 투입작업자(가능 시) 목록을 수집
- 중복 제거 및 “본인 수행 알림 제외” 정책 적용

2. 알림 로그 + 푸시 발송

- 관련자 각각에 대해 `notification_logs` insert + push
- 반려 사유는 `reason`/`comments`에서 표준화된 필드로 전달(권장: `daily_reports.rejection_reason` 컬럼 또는 metadata에 저장)

3. 딥링크

- 작성자: 수정 가능한 경로로 유도
- 관리자/현장관리자: 상세 조회 경로(권한/라우팅 고려)

### 5.4 데이터/스키마 보강(필요 시)

- dedupe를 강제하기 위한 유니크 인덱스(표현식 인덱스 포함) 또는 별도 `notification_dedupe` 테이블 도입
- `profiles.notification_preferences`에서 카테고리 키 표준화:
  - reminders: `daily_report_reminders`
  - updates: `daily_report_updates` (승인/반려 포함)

---

## 6. 검증(테스트) 계획

### 6.1 리마인더(16:00) 시나리오

- A: 당일 `submitted/approved` 존재 → 미발송
- B: 당일 `draft`만 존재 → 발송(문구 분기 확인)
- C: 당일 레코드 없음 → 발송
- D: 이미 같은 날짜에 리마인더 로그가 존재 → 중복 미발송
- E: push 구독 만료(404/410) → subscription 제거 + 실패 로그 기록

### 6.2 승인/반려 시나리오

- submitted → approved: 작성자 수신 + (옵션) 현장관리자/투입작업자 수신
- submitted → rejected: 작성자 수신 + 사유 포함 + 수정 동선 링크 확인
- 중복 승인 호출 방지(상태 조건으로 자연 차단되는지 확인)

### 6.3 수동 검증 도구

- `NotificationModal`에서 수신 로그가 즉시 보이는지 확인
- AppBar 배지 카운트 증가/읽음 처리(PATCH history) 확인
- PWA 설치 상태에서 OS 상단 푸시 및 클릭 시 딥링크 확인

---

## 7. 오픈 이슈(확인 필요)

1. “미작성자”의 범위가 **draft만**인지, **아예 생성 안 한 사용자까지 포함**인지 최종 확정 필요
2. “관련자”에 **현장 관리자/투입 작업자**를 포함할지 운영 정책 확정 필요
3. 서비스워커(`public/sw.js`)의 푸시 payload 형식과 서버 발송(payload) 형식이 완전히 일치하도록 표준화 필요
4. `scheduled_notifications` 테이블의 실제 스키마/운영 여부(마이그레이션 관리 포함) 점검 필요
