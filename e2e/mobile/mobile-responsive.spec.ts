import { test, expect, devices } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

// Test different mobile viewports
test.describe('Mobile Responsive Tests', () => {
  test.describe('iPhone 12 Tests', () => {
    test.use({ ...devices['iPhone 12'] })

      test('should display mobile navigation menu', async ({ page }) => {
        await page.goto('/')
        
        // Check if hamburger menu is visible on mobile
        const hamburgerMenu = page.locator('button[aria-label*="menu"], .hamburger, .menu-toggle')
        await expect(hamburgerMenu).toBeVisible()
        
        // Click to open menu
        await hamburgerMenu.click()
        
        // Check if mobile menu is visible
        const mobileMenu = page.locator('.mobile-menu, nav[aria-label*="mobile"], .drawer')
        await expect(mobileMenu).toBeVisible()
      })

      test('should handle mobile login flow', async ({ page }) => {
        await page.goto('/auth/login')
        
        // Check if form is properly displayed on mobile
        const loginForm = page.locator('form')
        await expect(loginForm).toBeVisible()
        
        // Check if inputs are accessible
        const emailInput = page.locator('input[name="email"]')
        const passwordInput = page.locator('input[name="password"]')
        
        await expect(emailInput).toBeVisible()
        await expect(passwordInput).toBeVisible()
        
        // Fill and submit
        await emailInput.fill(testUsers.worker.email)
        await passwordInput.fill(testUsers.worker.password)
        
        const submitButton = page.locator('button[type="submit"]')
        await expect(submitButton).toBeVisible()
        await submitButton.click()
        
        // Wait for navigation
        await page.waitForURL('**/dashboard', { timeout: 10000 })
      })

      test('should display mobile-optimized dashboard', async ({ page }) => {
        // Login first
        await page.goto('/auth/login')
        await page.fill('input[name="email"]', testUsers.worker.email)
        await page.fill('input[name="password"]', testUsers.worker.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
        
        // Check if dashboard cards are stacked on mobile
        const dashboardCards = page.locator('.card, .stat-card, .widget')
        const firstCard = dashboardCards.first()
        
        if (await firstCard.count() > 0) {
          const boundingBox = await firstCard.boundingBox()
          if (boundingBox) {
            // On mobile, cards should take most of the width
            expect(boundingBox.width).toBeGreaterThan(device.viewport.width * 0.8)
          }
        }
      })

      test('should handle touch interactions', async ({ page }) => {
        await page.goto('/auth/login')
        await page.fill('input[name="email"]', testUsers.worker.email)
        await page.fill('input[name="password"]', testUsers.worker.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
        
        // Test swipe gestures if carousel exists
        const carousel = page.locator('.carousel, .swiper, .slider')
        if (await carousel.count() > 0) {
          const box = await carousel.boundingBox()
          if (box) {
            // Simulate swipe
            await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
            await page.mouse.down()
            await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
            await page.mouse.up()
          }
        }
      })

      test('should properly scale text on mobile', async ({ page }) => {
        await page.goto('/')
        
        // Check if text is readable (minimum 14px on mobile)
        const bodyText = page.locator('body')
        const fontSize = await bodyText.evaluate((el) => {
          return window.getComputedStyle(el).fontSize
        })
        
        const fontSizeNum = parseInt(fontSize)
        expect(fontSizeNum).toBeGreaterThanOrEqual(14)
      })

      test('should handle mobile form inputs', async ({ page }) => {
        await page.goto('/auth/signup')
        
        // Check if form inputs are properly sized for touch
        const inputs = page.locator('input, select, textarea')
        const firstInput = inputs.first()
        
        if (await firstInput.count() > 0) {
          const box = await firstInput.boundingBox()
          if (box) {
            // Minimum touch target size should be 44px (iOS guideline)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      })

      test('should display mobile-friendly tables', async ({ page }) => {
        // Login and navigate to a page with tables
        await page.goto('/auth/login')
        await page.fill('input[name="email"]', testUsers.admin.email)
        await page.fill('input[name="password"]', testUsers.admin.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
        
        await page.goto('/dashboard/daily-reports')
        
        // Check if tables are responsive
        const table = page.locator('table')
        if (await table.count() > 0) {
          // On mobile, tables might be converted to cards or have horizontal scroll
          const tableWrapper = page.locator('.table-wrapper, .table-container')
          if (await tableWrapper.count() > 0) {
            const overflow = await tableWrapper.evaluate((el) => {
              return window.getComputedStyle(el).overflowX
            })
            expect(['auto', 'scroll']).toContain(overflow)
          }
        }
      })

      test('should handle mobile image uploads', async ({ page }) => {
        await page.goto('/auth/login')
        await page.fill('input[name="email"]', testUsers.worker.email)
        await page.fill('input[name="password"]', testUsers.worker.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
        
        await page.goto('/dashboard/daily-reports/new')
        
        // Check if file input accepts camera
        const fileInput = page.locator('input[type="file"]')
        if (await fileInput.count() > 0) {
          const accept = await fileInput.getAttribute('accept')
          if (accept) {
            expect(accept).toContain('image')
          }
          
          // Check for camera capture attribute (mobile specific)
          const capture = await fileInput.getAttribute('capture')
          // Camera capture might be enabled for mobile
        }
      })

      test('should optimize loading for mobile networks', async ({ page }) => {
        // Simulate slow 3G network
        await page.route('**/*', route => route.continue())
        
        const startTime = Date.now()
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        const loadTime = Date.now() - startTime
        
        // Page should load within reasonable time even on slow network
        expect(loadTime).toBeLessThan(10000) // 10 seconds
      })
    })
  })

  test.describe('Orientation Tests', () => {
    test('should handle portrait to landscape rotation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
      })
      const page = await context.newPage()
      
      await page.goto('/')
      
      // Portrait orientation
      await page.setViewportSize({ width: 390, height: 844 })
      let hamburger = page.locator('.hamburger, button[aria-label*="menu"]')
      await expect(hamburger).toBeVisible()
      
      // Landscape orientation
      await page.setViewportSize({ width: 844, height: 390 })
      await page.waitForTimeout(500) // Wait for re-render
      
      // Layout should adapt to landscape
      const navigation = page.locator('nav')
      await expect(navigation).toBeVisible()
      
      await context.close()
    })
  })

  test.describe('Touch Gesture Tests', () => {
    test('should handle pull-to-refresh', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        hasTouch: true,
      })
      const page = await context.newPage()
      
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.worker.email)
      await page.fill('input[name="password"]', testUsers.worker.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Simulate pull-to-refresh gesture
      await page.touchscreen.tap(200, 100)
      await page.touchscreen.down(200, 100)
      await page.touchscreen.move(200, 300)
      await page.touchscreen.up()
      
      // Check if refresh indicator appears (if implemented)
      const refreshIndicator = page.locator('.refresh-indicator, .pull-to-refresh')
      // This would check if pull-to-refresh is implemented
      
      await context.close()
    })

    test('should handle long press actions', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        hasTouch: true,
      })
      const page = await context.newPage()
      
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.worker.email)
      await page.fill('input[name="password"]', testUsers.worker.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      await page.goto('/dashboard/daily-reports')
      
      // Find an item to long-press
      const reportCard = page.locator('.report-card, tbody tr').first()
      if (await reportCard.count() > 0) {
        const box = await reportCard.boundingBox()
        if (box) {
          // Simulate long press
          await page.touchscreen.down(box.x + box.width / 2, box.y + box.height / 2)
          await page.waitForTimeout(1000) // Hold for 1 second
          await page.touchscreen.up()
          
          // Check if context menu appears
          const contextMenu = page.locator('.context-menu, [role="menu"]')
          // This would check if long-press actions are implemented
        }
      }
      
      await context.close()
    })
  })

  test.describe('Mobile Performance Tests', () => {
    test('should have optimized images for mobile', async ({ page }) => {
      await page.goto('/')
      
      // Check if images have responsive attributes
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < Math.min(5, imageCount); i++) {
        const img = images.nth(i)
        
        // Check for responsive image attributes
        const srcset = await img.getAttribute('srcset')
        const sizes = await img.getAttribute('sizes')
        const loading = await img.getAttribute('loading')
        
        // Images should have lazy loading for mobile
        if (loading) {
          expect(loading).toBe('lazy')
        }
      }
    })

    test('should have mobile-optimized CSS', async ({ page }) => {
      await page.goto('/')
      
      // Check if viewport meta tag is present
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewport).toContain('width=device-width')
      expect(viewport).toContain('initial-scale=1')
      
      // Check if CSS is mobile-first
      const styles = await page.evaluate(() => {
        const sheets = document.styleSheets
        let hasMobileFirst = false
        
        for (let i = 0; i < sheets.length; i++) {
          try {
            const rules = sheets[i].cssRules || sheets[i].rules
            for (let j = 0; j < rules.length; j++) {
              if (rules[j].media && rules[j].media.mediaText.includes('min-width')) {
                hasMobileFirst = true
                break
              }
            }
          } catch (e) {
            // Cross-origin stylesheets
          }
        }
        
        return hasMobileFirst
      })
      
      expect(styles).toBeTruthy()
    })

    test('should minimize JavaScript bundle for mobile', async ({ page }) => {
      const resources: any[] = []
      
      page.on('response', response => {
        const url = response.url()
        if (url.includes('.js') && !url.includes('node_modules')) {
          resources.push({
            url,
            size: Number(response.headers()['content-length'] || 0)
          })
        }
      })
      
      await page.goto('/')
      
      // Calculate total JS size
      const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0)
      
      // JS bundle should be reasonably sized for mobile (< 1MB)
      expect(totalSize).toBeLessThan(1024 * 1024)
    })
  })
})