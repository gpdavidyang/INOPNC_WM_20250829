import { test, expect } from '@playwright/test'

test.describe('Dark mode UI surfaces', () => {
  test('document hub selects have dark backgrounds', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('inopnc_theme', 'dark')
      } catch {
        void 0
      }
    })
    await page.goto('/documents/hub')

    // Wait for filters to appear
    await page.locator('.doc-container .filters').first().waitFor({ state: 'visible' })

    const bg = await page.evaluate(() => {
      const el = document.querySelector('.doc-container select.select') as HTMLElement | null
      if (!el) return null
      return window.getComputedStyle(el).backgroundColor
    })

    // Should not be white in dark mode
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })
})
