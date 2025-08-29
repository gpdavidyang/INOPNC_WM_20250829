import { test as base } from '@playwright/test'

// Define custom fixtures for authentication
export type AuthFixtures = {
  authenticatedPage: any
  adminAuth: any
  workerAuth: any
  managerAuth: any
}

export const test = base.extend<AuthFixtures>({
  // Fixture for authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/auth/login')
    
    // Perform login
    await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'Test123!@#')
    await page.click('button[type="submit"]')
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Use the authenticated page
    await use(page)
    
    // Cleanup - logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")')
    if (await logoutButton.count() > 0) {
      await logoutButton.click()
    }
  },

  // Admin authentication fixture
  adminAuth: async ({ page }, use) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@inopnc.com')
    await page.fill('input[name="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await use(page)
  },

  // Worker authentication fixture
  workerAuth: async ({ page }, use) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'worker@inopnc.com')
    await page.fill('input[name="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await use(page)
  },

  // Site Manager authentication fixture
  managerAuth: async ({ page }, use) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'manager@inopnc.com')
    await page.fill('input[name="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await use(page)
  },
})

export { expect } from '@playwright/test'