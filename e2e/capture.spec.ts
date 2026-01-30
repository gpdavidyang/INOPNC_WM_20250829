import { test } from '@playwright/test'
const path = require('path')

test.describe('Screenshot Capture', () => {
  test('Mobile Notification Settings', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/auth/login')

    // 2. Perform Login (Manager)
    await page.fill('input[name="email"]', 'site_manager@example.com') // Using likely valid test user
    await page.fill('input[name="password"]', 'password123') // Common test password
    await page.click('button[type="submit"]')

    // 3. Wait for post-login redirect (Mobile Dashboard)
    await page.waitForURL('**/mobile')

    // 4. Go to Settings Page
    await page.goto('/mobile/settings')

    // 5. Wait for content
    await page.waitForSelector('text=알림 설정')

    // 6. Capture
    await page.screenshot({
      path: 'public/screenshots/mobile_notification_settings.png',
      fullPage: true,
    })
  })

  test('Admin Dashboard', async ({ page }) => {
    // 1. Logout if needed or fresh context
    await page.goto('/auth/login')

    // 2. Login (Admin)
    await page.fill('input[name="email"]', 'admin@inopnc.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // 3. Wait for Dashboard
    await page.waitForURL('**/dashboard')

    // 4. Capture
    await page.screenshot({ path: 'public/screenshots/admin_dashboard.png', fullPage: true })
  })
})
