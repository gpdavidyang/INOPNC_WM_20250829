import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'manager@inopnc.com'
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD || 'password123'

// Helper to ensure we always start from a clean session
async function clearSessionStorage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

test.describe('Ultra Simple Auth flows', () => {
  test('unauthenticated access to protected page redirects to login', async ({ page }) => {
    await clearSessionStorage(page)

    await page.goto('/mobile')
    await page.waitForURL('**/auth/login**')

    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/login')
    expect(currentUrl).toContain('redirectTo=%2Fmobile')
  })

  test('manager user signs in and lands on mobile track', async ({ page }) => {
    await clearSessionStorage(page)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', MANAGER_EMAIL)
    await page.fill('input[name="password"]', MANAGER_PASSWORD)
    await Promise.all([
      page.waitForURL('**/mobile**', { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ])

    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/mobile/)

    const cookies = await page.context().cookies()
    const hasSupabaseSession = cookies.some(cookie => {
      if (!cookie.name) return false
      return (
        cookie.name === 'sb-access-token' ||
        cookie.name === 'sb-refresh-token' ||
        (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'))
      )
    })

    expect(hasSupabaseSession).toBeTruthy()

    const uiTrackCookie = cookies.find(cookie => cookie.name === 'ui-track')
    expect(uiTrackCookie).toBeDefined()
    expect(uiTrackCookie?.httpOnly).toBeFalsy()
    expect(uiTrackCookie?.value).toContain('/mobile')
  })
})
