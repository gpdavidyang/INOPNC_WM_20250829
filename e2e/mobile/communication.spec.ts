import { test, expect } from '@playwright/test'
import { login } from '../utils/test-helpers'

test.describe('Mobile Communication Logs', () => {
  test('renders logs list with stubbed data', async ({ page }) => {
    await login(page as any, 'siteManager')

    await page.route('**/api/communication/logs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          logs: [
            {
              id: 'log-1',
              title: '테스트 공지',
              body: '모바일 전달 로그 확인',
              status: 'delivered',
              sent_at: new Date().toISOString(),
              target_role: 'site_manager',
              target_site_name: '현장 A',
              notification_type: 'site_announcement',
            },
          ],
        }),
      })
    })

    await page.goto('/mobile/communication/logs')
    await expect(page.getByRole('heading', { name: '전달 로그' })).toBeVisible()
    await expect(page.getByText('테스트 공지')).toBeVisible()
    await expect(page.getByText('현장 A')).toBeVisible()
  })
})
