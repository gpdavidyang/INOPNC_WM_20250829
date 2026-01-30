import { test } from '@playwright/test'

test('capture mobile notification settings screenshot', async ({ page }) => {
  // 1. Go to Login
  await page.goto('/auth/login')

  // 2. Login as Manager (Mocked or using simple auth if available in test env)
  // For this test script, we'll try to use the simple auth flow if possible,
  // or just navigate if the dev environment allows bypass (it might not).
  // Let's assume standard login flow:
  await page.fill('input[type="email"]', 'manager@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')

  // Wait for redirect
  await page.waitForURL('**/mobile')

  // 3. Navigate to Settings
  await page.goto('/mobile/settings')

  // 4. Capture Screenshot
  await page.screenshot({ path: 'public/screenshots/mobile-settings.png', fullPage: true })
})

test('capture admin dashboard screenshot', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')

  await page.screenshot({ path: 'public/screenshots/admin-dashboard.png', fullPage: true })
})
