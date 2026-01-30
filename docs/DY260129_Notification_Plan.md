# Notification System Update Plan

## Goal Description

Implement daily reminders for missing work logs and real-time notifications for work log events (submit/approve/reject) using Web Push and Email fallbacks.

## Proposed Changes

### Database Schema

- **No new tables required** if reusing `scheduled_notifications` and `notifications`.
- Verify `notification_preferences` column in `profiles` table exists and has correct structure.

### Phase 1: Daily Reminder Infrastructure (Cron & Backend)

#### [NEW] `app/api/cron/daily-reminder/route.ts`

- **Purpose**: triggered by Vercel Cron at 16:00 KST.
- **Logic**:
  1. Identify active users who have NOT submitted a `daily_report` for today.
  2. Create `notifications` records for these users.
  3. Trigger `pushNotificationService.sendNotification`.

#### [MODIFY] `lib/notifications/push-service.ts`

- Ensure it handles batch sending efficiently.
- Add fallback logic to send Email if Push subscription is missing.

### Phase 2: Event-Driven Notifications

#### [MODIFY] `app/actions/daily-reports.ts` (or relevant server actions)

- In `submitDailyReport`: Trigger "Submission" notification to Site Manager.
- In `approveDailyReport` / `rejectDailyReport`: Trigger notification to Worker.

### Phase 3: User Settings & UI

#### [MODIFY] `modules/mobile/pages/notification-settings.tsx`

- Add toggles for "Daily Reminder" and "Email Notifications".

## Verification Plan

### Automated Tests

- Create a test script to mock the Cron job logic and verify it selects the correct users (those without reports).
- Test the `sendNotification` function with a mock PushSubscription.

### Manual Verification

- **Reminder**: Manually trigger the cron API route and check if a test user (who hasn't written a report) receives a notification.
- **Events**: Submit a report as User A, check if Admin B gets a notification. Approve it as Admin B, check if User A gets a notification.
