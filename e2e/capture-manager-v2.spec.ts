import { test } from '@playwright/test'
const path = require('path')

test.use({
  viewport: { width: 375, height: 812 }, // iPhone X viewport
  colorScheme: 'light',
})

test.describe('Screenshot Capture - Site Manager', () => {
  test('Capture All Site Manager Screens', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/auth/login')

    // 2. Perform Login (Manager Credentials)
    await page.fill('input[name="email"]', 'manager@inopnc.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button:has-text("로그인")')

    // 3. Wait for Mobile Home
    // Wait for URL but also handle potential slow redirect or "role selection" if any
    await page.waitForURL('**/mobile', { timeout: 10000 })

    // Relaxed selector - we just want ANY text indicative of dashboard
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'public/screenshots/manager_01_home.png', fullPage: true })

    // 4. Notification Settings
    try {
      await page.goto('/mobile/settings')
      // Wait for settings content
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'public/screenshots/manager_05_settings.png', fullPage: true })
    } catch (e) {
      console.log('Settings capture failed', e)
    }

    // 5. Daily Report Form
    try {
      await page.goto('/mobile/daily-reports/new')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await page.screenshot({
        path: 'public/screenshots/manager_03_report_new.png',
        fullPage: true,
      })
    } catch (e) {
      console.log('Report new capture failed', e)
    }

    // 6. Report List
    try {
      await page.goto('/mobile/daily-reports')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'public/screenshots/manager_02_report_list.png',
        fullPage: true,
      })
    } catch (e) {
      console.log('Report list capture failed', e)
    }

    // 7. Site List
    try {
      await page.goto('/mobile/sites')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'public/screenshots/manager_04_site_list.png', fullPage: true })
    } catch (e) {
      console.log('Site list capture failed', e)
    }
  })
})
