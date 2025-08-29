import { Page } from '@playwright/test'

/**
 * Test user credentials
 */
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test123!@#',
    role: 'admin',
  },
  worker: {
    email: process.env.TEST_WORKER_EMAIL || 'worker@test.com',
    password: process.env.TEST_WORKER_PASSWORD || 'Test123!@#',
    role: 'worker',
  },
  siteManager: {
    email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com',
    password: process.env.TEST_MANAGER_PASSWORD || 'Test123!@#',
    role: 'site_manager',
  },
  customer: {
    email: process.env.TEST_CUSTOMER_EMAIL || 'customer@test.com',
    password: process.env.TEST_CUSTOMER_PASSWORD || 'Test123!@#',
    role: 'customer_manager',
  },
}

/**
 * Login helper function
 */
export async function login(page: Page, userType: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userType]
  
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Look for logout button or menu
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")')
  if (await logoutButton.count() > 0) {
    await logoutButton.click()
  } else {
    // Try opening user menu first
    const userMenu = page.locator('[aria-label*="user"], [aria-label*="account"]')
    if (await userMenu.count() > 0) {
      await userMenu.click()
      await page.click('button:has-text("Logout"), a:has-text("Logout")')
    }
  }
  
  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 5000 })
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET'
) {
  return page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.request().method() === method &&
      response.status() === 200
  )
}

/**
 * Upload file helper
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
) {
  const fileInput = page.locator(selector)
  await fileInput.setInputFiles(filePath)
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    )
  }, selector)
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for any loading indicators to disappear
  const loadingIndicators = page.locator(
    '.loading, [aria-busy="true"], .spinner, .skeleton'
  )
  
  if (await loadingIndicators.count() > 0) {
    await loadingIndicators.first().waitFor({ state: 'hidden', timeout: 10000 })
  }
  
  // Also wait for network to be idle
  await page.waitForLoadState('networkidle')
}

/**
 * Fill form helper
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string | number | boolean>
) {
  for (const [field, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${field}"], textarea[name="${field}"]`)
    
    if (await input.count() > 0) {
      const inputType = await input.getAttribute('type')
      
      if (inputType === 'checkbox' || inputType === 'radio') {
        if (value === true || value === 'true') {
          await input.check()
        } else {
          await input.uncheck()
        }
      } else {
        await input.fill(String(value))
      }
    } else {
      // Try select element
      const select = page.locator(`select[name="${field}"]`)
      if (await select.count() > 0) {
        await select.selectOption(String(value))
      }
    }
  }
}

/**
 * Assert toast notification
 */
export async function assertToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
) {
  const toast = page.locator(
    `.toast-${type}, [role="alert"]:has-text("${message}")`
  )
  await toast.waitFor({ state: 'visible', timeout: 5000 })
  return toast
}