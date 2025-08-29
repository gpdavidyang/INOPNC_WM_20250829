import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form', async ({ page }) => {
    // Check if login form elements are visible
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use test credentials from environment
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
    const password = process.env.TEST_ADMIN_PASSWORD || 'Test123!@#'
    
    // Fill in valid credentials
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Look for visibility toggle button
    const toggleButton = page.locator('button[aria-label*="password"]')
    if (await toggleButton.count() > 0) {
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Toggle back
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  test('should navigate to signup page', async ({ page }) => {
    // Look for signup link
    const signupLink = page.locator('a[href*="signup"]')
    if (await signupLink.count() > 0) {
      await signupLink.click()
      await expect(page).toHaveURL(/.*signup/)
    }
  })

  test('should navigate to forgot password', async ({ page }) => {
    // Look for forgot password link
    const forgotLink = page.locator('a[href*="reset"]')
    if (await forgotLink.count() > 0) {
      await forgotLink.click()
      await expect(page).toHaveURL(/.*reset/)
    }
  })
})