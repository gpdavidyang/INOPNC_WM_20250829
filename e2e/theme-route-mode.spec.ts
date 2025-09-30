import { test, expect } from '@playwright/test'

test.describe('Route-based theme behavior', () => {
  test('mobile respects dark preference; partner desktop forced light', async ({ page }) => {
    // Prefer dark on mobile
    await page.addInitScript(() => {
      try {
        localStorage.setItem('inopnc_theme', 'dark')
      } catch {
        void 0
      }
    })
    await page.goto('/mobile')

    // data-theme should be dark and .dark class present
    await expect(async () => {
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(theme).toBe('dark')
      expect(hasDark).toBeTruthy()
    }).toPass()

    // Desktop partner route should force light regardless of saved preference
    await page.addInitScript(() => {
      try {
        localStorage.setItem('inopnc_theme', 'dark')
      } catch {
        void 0
      }
    })
    await page.goto('/partner/sites')

    await expect(async () => {
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(theme).toBe('light')
      expect(hasDark).toBeFalsy()
    }).toPass()
  })
})
