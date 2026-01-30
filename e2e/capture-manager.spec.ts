import { test } from '@playwright/test'
const path = require('path')

test.describe('Screenshot Capture - Site Manager', () => {
  test('Capture All Site Manager Screens', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/auth/login')

    // 2. Perform Login (Manager Credentials)
    await page.fill('input[name="email"]', 'manager@inopnc.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 3. Wait for Mobile Home
    await page.waitForURL('**/mobile')
    await page.waitForSelector('text=현장') // Ensure content loaded
    await page.screenshot({ path: 'public/screenshots/manager_home.png', fullPage: true })

    // 4. Notification Settings
    await page.goto('/mobile/settings')
    await page.waitForSelector('text=알림 설정')
    // Ensure toggles are visible
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'public/screenshots/manager_settings.png', fullPage: true })

    // 5. Daily Report Form (New)
    await page.goto('/mobile/daily-reports/new')
    await page.waitForTimeout(2000) // Wait for form init
    await page.screenshot({
      path: 'public/screenshots/manager_daily_report_new.png',
      fullPage: true,
    })

    // 6. Report List
    await page.goto('/mobile/daily-reports')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: 'public/screenshots/manager_daily_report_list.png',
      fullPage: true,
    })

    // 7. Site List
    await page.goto('/mobile/sites')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'public/screenshots/manager_site_list.png', fullPage: true })
  })
})
