import { test, expect } from '@playwright/test'

test.describe('Mobile-only large font mode', () => {
  test('toggles on mobile and does not leak to desktop/admin', async ({ page }) => {
    // Go to mobile home (dev auth bypass is enabled in .env.development)
    await page.goto('/mobile')

    // Ensure initial state has no large-font-mode
    await expect(async () => {
      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains('large-font-mode')
      )
      expect(hasClass).toBeFalsy()
    }).toPass()

    // Click the font size toggle in mobile AppBar
    await page
      .getByRole('button', { name: '글씨 크기' })
      .or(page.locator('#fontSizeBtn'))
      .first()
      .click()

    // Wait for class to be applied on html element
    await expect(async () => {
      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains('large-font-mode')
      )
      expect(hasClass).toBeTruthy()
    }).toPass()

    // Verify mobile-scoped storage key is set
    await expect(async () => {
      const saved = await page.evaluate(() => localStorage.getItem('inopnc-font-size-mobile'))
      expect(saved).toBe('large')
    }).toPass()

    // Navigate to an admin/desktop route; middleware may redirect to login, both are non-mobile
    await page.goto('/dashboard/admin')

    // large-font-mode must be removed on non-mobile screens
    await expect(async () => {
      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains('large-font-mode')
      )
      expect(hasClass).toBeFalsy()
    }).toPass()

    // Navigate back to mobile; preference should be applied again
    await page.goto('/mobile')
    await expect(async () => {
      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains('large-font-mode')
      )
      expect(hasClass).toBeTruthy()
    }).toPass()
  })
})
