# DY260129 인증 요구사항 분석 및 구현 방안

## 1. 요구사항 정리

- **다단계 회원가입**: 회사(소속) 선택/검색 → 기본정보 입력 → 이메일/OTP 인증 → 관리자 승인 후 활성화.
- **비밀번호 분실/재설정**: 이메일 딥링크를 통해 앱/웹에서 즉시 열리고, 10~30분 내 만료되는 일회성 링크.
- **OTP/2차 인증**: 이메일 기반 일회성 코드 + Google Authenticator(TOTP) 기반 기본 채널, 모바일 자동 OTP 읽기 지원.
- **세션/토큰 수명 정책**: 만료·기기 변경·재로그인 조건 명확화, 만료 시 일관된 메시지와 재인증 플로우 제공.
- **로그인 실패 보호**: 실패 횟수 기반 지연(backoff)·차단, 메시지는 최소 정보만 노출.
- **세션 분리**: 인증 단계는 기존 세션과 분리, 미완료 인증 상태에서는 기존 세션 유지/승계 금지.
- **아이디 마스킹**: 인증 메일/화면에서 이메일을 마스킹해 표기.
- **인프라 보호**: WAF/Edge 단계에서 악성 트래픽 차단, 백엔드 부하 최소화.

## 2. 기술적 고려사항

1. **데이터 모델 확장**: `signup_requests`, `company_members`, `auth_factors`(TOTP), `auth_lockouts`(로그인 실패) 추가 필요.
2. **멀티 스텝 UI 흐름**: `app/auth/signup` 폴더 내 wizard 구성, 상태는 URL 쿼리 또는 서버 액션으로 유지.
3. **Supabase Auth 연동**: 이메일 OTP, 패스워드 리셋, 세션 만료 정책, MFA API 사용. Edge Function을 통해 추가 검증 로직 실행.
4. **이메일·알림 딥링크**: `app/mobile`에서도 열릴 수 있도록 `supabase.auth.resetPasswordForEmail` 호출 시 `redirectTo`를 커스텀 스킴(`inopnc://reset`, `https://wm.inopnc.com/reset`)으로 설정하고, Next.js 라우터에서 deep link를 처리.
5. **모바일 자동 OTP**: 입력 필드에 `inputMode="numeric"` + `autocomplete="one-time-code"`, PWA에서 Web OTP API(iOS 17+/Android Chrome) 사용.
6. **보안 메시지**: 오류 메시지는 추상화, 마스킹은 공용 util(`lib/auth/emailMask.ts`)로 제공.
7. **WAF/Edge**: Vercel Edge Middleware에서 `bot scoring`, `rate limiting`을 1차 수행하고, Cloudflare/WAF 룰 목록 문서화.

## 3. 구현 방안

### 3.1 데이터 모델 및 스키마

- `supabase/migrations`에 신규 테이블과 정책 추가.
  - `signup_requests`: `id`, `company_id`, `user_payload(jsonb)`, `contact_email`, `otp_verified_at`, `status(pending|approved|rejected)`, `expires_at`.
  - `company_members`: `profile_id`, `company_id`, `role`, `approved_at`, `approved_by`.
  - `auth_factors`: `profile_id`, `factor_type(email|totp)`, `secret`, `verified_at`, `last_used_at`.
  - `auth_lockouts`: `email`, `fail_count`, `locked_until`.
- RLS: 회사별 접근을 제한하고, 관리자 역할(`role = 'admin'`)만 승인/조회 가능하도록 정책 작성.

### 3.2 회원가입 흐름

1. **회사 검색/선택**
   - `/lib/supabase/server.ts`를 통해 `companies` 테이블 fuzzy search.
   - 회사 미등록 시 관리자 요청 링크 제공(요구사항 외, 단순 안내).
2. **사용자 정보 입력**
   - `Name`, `Title`, `Phone`, `Email`을 `server action`으로 유효성 검사.
   - 중복 이메일 여부 `supabase.auth.admin.listUsers` 또는 `profiles` 조회로 확인.
3. **이메일 OTP**
   - `supabase.auth.signInWithOtp`(email link) + `Flow ID`를 `signup_requests`에 저장.
   - 사용자가 받은 링크를 열면 `/auth/verify?requestId=`에서 `supabase.auth.exchangeCodeForSession` 실행 후 즉시 `supabase.auth.signOut`하여 세션을 분리하고, `otp_verified_at`만 체크.
4. **관리자 승인 대기**
   - `dashboard` 내 `가입요청 관리` 페이지(`app/dashboard/onboarding/requests`) 구현.
   - 승인 시 `supabase.auth.admin.createUser` 호출 후 `company_members`에 insert, `signup_requests.status = 'approved'`.
5. **승인 알림**
   - `supabase.functions.invoke('send-onboarding-email')` 또는 Supabase webhook으로 승인 결과 메일 전송.

### 3.3 비밀번호 분실/재설정

1. **요청**
   - `/app/auth/reset/request`에서 이메일 입력 → `auth.resetPasswordForEmail(email, { redirectTo })`.
   - `redirectTo`는 `https://wm.inopnc.com/auth/reset/confirm`(웹)과 PWA 내 커스텀 스킴을 모두 포함한 deep link 처리.
2. **만료 관리**
   - Supabase 기본 만료(60분)를 `supabase.auth.mfa.factors`처럼 맞추기 위해 Edge Function에서 별도 토큰 테이블(`password_reset_tokens`)을 두고 10~30분 TTL을 강제. 토큰이 만료되면 `delete`.
3. **재설정 화면**
   - 토큰 검증 후 `supabase.auth.updateUser({ password })` 호출.
   - 성공 시 모든 세션 무효화(`supabase.auth.signOut({ scope: 'global' })`) 후 로그인 화면으로 이동.

### 3.4 OTP/TOTP 및 자동 읽기

- **Email OTP**: 기본 수단. 입력창에 Web OTP API integration, OTP가 자동으로 채워지면 `server action` 호출.
- **TOTP (Google Authenticator)**:
  - `otplib`를 사용해 시크릿 생성 → QR 코드(`components/auth/TotpSetupQr.tsx`)로 제공.
  - 사용자 입력 코드로 검증 후 `auth_factors`에 `secret`(암호화) 저장.
  - 로그인 시 TOTP 활성 사용자에게 2차 입력 단계 제공. Supabase 세션은 `factor_verified` claim으로 구분.
- **자동 OTP 읽기 UX**:
  - 모바일 PWA에서 `navigator.credentials.get({ otp: { transport: ['sms', 'email'] } })` 사용.
  - 이메일 제목 규칙 `[INOPNC] Login code: 123456`로 통일하여 자동 인식률 극대화.

### 3.5 세션 및 토큰 정책

- **만료 시간**: Access token 1시간, Refresh token 2주. `supabase.auth.setSession`으로 연장.
- **기기 변경 감지**: `session_metadata`에 `device_id`와 `last_login_at` 저장, 다른 기기에서 로그인 시 기존 기기 세션 무효화 옵션 제공.
- **메시지 일관성**: 토큰 만료 시 응답 코드를 감지해 `authErrorToast('세션이 만료되었습니다. 다시 로그인해 주세요.')` 공통 훅(`hooks/useAuthErrors.ts`)에서 처리.
- **세션 분리**: 인증 단계별로 `supabase.auth.signOut()` 호출 후 상태만 서버 DB에 기록하여, 미완료 인증이 기존 세션을 사용하지 못하도록 함.

### 3.6 로그인 실패 백오프

- `auth_lockouts` 테이블에 실패 횟수 저장.
- 로그인 시도마다 Edge Middleware에서 IP + Email 조합으로 rate limit 후, 서버에서 추가 백오프 적용:
  - 3회 실패: 30초 대기
  - 5회 실패: 5분 잠금
  - 10회 이상: 관리자 검토 필요, 이메일 발송
- 오류 메시지는 고정 문구(`아이디 또는 비밀번호를 확인해 주세요.`)로 통일.
- Middleware에서 `Retry-After` 헤더 제공, UI에서 남은 시간 표시.

### 3.7 이메일 마스킹 및 알림

- `lib/auth/maskEmail.ts` 유틸 작성:
  ```ts
  export const maskEmail = (email: string) => {
    const [id, domain] = email.split('@')
    return `${id.slice(0, 2)}${'*'.repeat(Math.max(id.length - 2, 1))}@${domain}`
  }
  ```
- 인증 메일, 승인/거절 안내, 화면 표시 시 해당 함수 사용.
- 메일 템플릿은 `supabase/functions/sendEmail/templates`에 추가하고, React Email로 작성.

### 3.8 악성 트래픽 차단

- **Vercel Edge Middleware (`middleware.ts`)**:
  - `@upstash/ratelimit`로 1차 rate limit.
  - Known bot UA/ASN 차단 목록 적용.
  - Suspicious score 시 Captcha 페이지 전환.
- **인프라 레벨**:
  - Cloudflare/WAF 룰에 `/auth/*` 경로 우선 보호.
  - 관리자 승인 API는 사내 VPN/고정 IP만 허용하도록 추가 정책 작성.

## 4. 단계별 작업 계획

| 단계    | 주요 작업                                   | 산출물/경로                                                            |
| ------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Phase 1 | 스키마 정의, RLS 정책, 유틸 함수 작성       | `supabase/migrations`, `lib/auth/*`                                    |
| Phase 2 | 회원가입 UI/서버 액션, OTP 검증 Flow 구현   | `app/auth/signup`, `components/auth/*`                                 |
| Phase 3 | 관리자 승인 대시보드, 이메일 템플릿         | `app/dashboard/onboarding`, `supabase/functions/send-onboarding-email` |
| Phase 4 | 비밀번호 재설정/딥링크, 세션 만료 처리      | `app/auth/reset/*`, `hooks/useAuthErrors.ts`                           |
| Phase 5 | TOTP 설정/검증, 자동 OTP UX 개선            | `modules/mobile/auth`, `components/auth/Totp*`                         |
| Phase 6 | 로그인 백오프, Edge 보호, 모니터링 대시보드 | `middleware.ts`, `lib/edge/rateLimit.ts`, Grafana/Logs                 |

## 5. 추가 권고 사항

- QA 시나리오: 정상 가입, 만료된 OTP, 관리자 거절, TOTP 등록/해제, 백오프 해제까지의 e2e 테스트.
- 장애 대응: OTP 발송 실패/지연 시 대체 채널(전화) 안내 메시지 준비.
- 모니터링: 승인 대기 시간과 로그인 실패율을 Supabase Logflare/BigQuery로 수집, 월간 리포트 제공.
