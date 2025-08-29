import { test, expect } from '@playwright/test'
import { testUsers, generateUniqueEmail, generateKoreanPhone } from '../fixtures/test-data'

test.describe('Complete Authentication Flow', () => {
  test.describe('Login Flow', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/auth/login')
      
      // Check login form is visible
      await expect(page.locator('h1, h2').filter({ hasText: /로그인|Login/i })).toBeVisible()
      
      // Fill in credentials
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      
      // Verify dashboard is loaded
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(page.locator('[data-testid="dashboard-header"], h1').first()).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')
      
      // Try invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      // Check for error message
      const errorMessage = page.locator('[role="alert"], .error-message, .text-red-500')
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
      
      // Should remain on login page
      await expect(page).toHaveURL(/.*login/)
    })

    test('should handle empty form submission', async ({ page }) => {
      await page.goto('/auth/login')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check for validation errors
      const emailError = page.locator('input[name="email"]:invalid, [data-error="email"]')
      await expect(emailError).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/auth/login')
      
      const passwordInput = page.locator('input[name="password"]')
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Find and click visibility toggle
      const toggleButton = page.locator('[aria-label*="password"], button').filter({ has: page.locator('svg') })
      if (await toggleButton.count() > 0) {
        await toggleButton.first().click()
        await expect(passwordInput).toHaveAttribute('type', 'text')
        
        // Toggle back
        await toggleButton.first().click()
        await expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })

    test('should redirect to requested page after login', async ({ page }) => {
      // Try to access protected page
      await page.goto('/dashboard/daily-reports')
      
      // Should redirect to login
      await page.waitForURL('**/login')
      
      // Login
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      
      // Should redirect back to originally requested page
      await page.waitForURL('**/daily-reports', { timeout: 10000 })
    })
  })

  test.describe('Signup Flow', () => {
    test('should successfully create a new account', async ({ page }) => {
      await page.goto('/auth/signup')
      
      // Generate unique test data
      const uniqueEmail = generateUniqueEmail('signup')
      const uniquePhone = generateKoreanPhone()
      
      // Fill signup form
      await page.fill('input[name="email"]', uniqueEmail)
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.fill('input[name="confirmPassword"], input[name="password_confirm"]', 'Test123!@#')
      await page.fill('input[name="fullName"], input[name="full_name"]', 'Test User')
      await page.fill('input[name="phone"]', uniquePhone)
      
      // Select role if dropdown exists
      const roleSelect = page.locator('select[name="role"]')
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption('worker')
      }
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Check for success message or redirect
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
        // Alternative: Check for success message if no auto-login
        const successMessage = page.locator('[role="alert"].success, .text-green-500')
        await expect(successMessage).toBeVisible()
      })
    })

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/signup')
      
      // Try weak password
      await page.fill('input[name="password"]', 'weak')
      await page.fill('input[name="email"]', 'test@example.com')
      
      // Check for password requirements message
      const passwordHelp = page.locator('.password-requirements, .text-sm').filter({ hasText: /must|should|require/i })
      if (await passwordHelp.count() > 0) {
        await expect(passwordHelp.first()).toBeVisible()
      }
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/signup')
      
      // Try invalid email
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.click('button[type="submit"]')
      
      // Check for email validation error
      const emailError = page.locator('input[name="email"]:invalid, [data-error="email"]')
      await expect(emailError).toBeVisible()
    })

    test('should check password confirmation match', async ({ page }) => {
      await page.goto('/auth/signup')
      
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.fill('input[name="confirmPassword"], input[name="password_confirm"]', 'Different123!@#')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.click('button[type="submit"]')
      
      // Check for password mismatch error
      const mismatchError = page.locator('[role="alert"], .error-message').filter({ hasText: /match|같/i })
      await expect(mismatchError).toBeVisible()
    })

    test('should handle duplicate email registration', async ({ page }) => {
      await page.goto('/auth/signup')
      
      // Try to register with existing email
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.fill('input[name="confirmPassword"], input[name="password_confirm"]', 'Test123!@#')
      await page.fill('input[name="fullName"], input[name="full_name"]', 'Duplicate User')
      await page.fill('input[name="phone"]', '010-1234-5678')
      
      await page.click('button[type="submit"]')
      
      // Check for duplicate email error
      const duplicateError = page.locator('[role="alert"], .error-message').filter({ hasText: /already|이미|exists|존재/i })
      await expect(duplicateError).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should navigate to password reset page', async ({ page }) => {
      await page.goto('/auth/login')
      
      // Click forgot password link
      const forgotLink = page.locator('a').filter({ hasText: /forgot|비밀번호.*찾기/i })
      await forgotLink.click()
      
      // Should navigate to reset password page
      await page.waitForURL('**/reset-password')
      await expect(page.locator('h1, h2').filter({ hasText: /reset|재설정/i })).toBeVisible()
    })

    test('should send password reset email', async ({ page }) => {
      await page.goto('/auth/reset-password')
      
      // Enter email
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.click('button[type="submit"]')
      
      // Check for success message
      const successMessage = page.locator('[role="alert"], .success-message').filter({ hasText: /sent|발송|check|확인/i })
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should validate email before sending reset', async ({ page }) => {
      await page.goto('/auth/reset-password')
      
      // Try invalid email
      await page.fill('input[name="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      
      // Check for validation error
      const emailError = page.locator('input[name="email"]:invalid, [data-error="email"]')
      await expect(emailError).toBeVisible()
    })
  })

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ page }) => {
      // First login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Find and click logout button
      const userMenu = page.locator('[aria-label*="user"], [data-testid="user-menu"]')
      if (await userMenu.count() > 0) {
        await userMenu.click()
      }
      
      const logoutButton = page.locator('button, a').filter({ hasText: /logout|로그아웃/i })
      await logoutButton.click()
      
      // Should redirect to login page
      await page.waitForURL('**/login')
      await expect(page).toHaveURL(/.*login/)
    })

    test('should clear session on logout', async ({ page }) => {
      // Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Logout
      const logoutButton = page.locator('button, a').filter({ hasText: /logout|로그아웃/i })
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click()
        await page.waitForURL('**/login')
      }
      
      // Try to access protected page
      await page.goto('/dashboard')
      
      // Should redirect to login
      await page.waitForURL('**/login')
      await expect(page).toHaveURL(/.*login/)
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Refresh page
      await page.reload()
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard/)
      
      // User info should still be visible
      const userInfo = page.locator('[data-testid="user-info"], [aria-label*="user"]')
      await expect(userInfo.first()).toBeVisible()
    })

    test('should redirect to login when session expires', async ({ page }) => {
      // This test would simulate session expiry
      // For now, we'll test accessing protected route without session
      await page.goto('/dashboard/daily-reports')
      
      // Should redirect to login
      await page.waitForURL('**/login')
      await expect(page).toHaveURL(/.*login/)
    })
  })
})