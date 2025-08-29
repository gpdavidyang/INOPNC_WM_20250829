import { test, expect } from '../fixtures/auth.fixture'
import { testSites, testUsers } from '../fixtures/test-data'

test.describe('Site Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', testUsers.admin.email)
    await page.fill('input[name="password"]', testUsers.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('Site CRUD Operations', () => {
    test('should navigate to site management', async ({ page }) => {
      // Navigate through menu
      const adminMenu = page.locator('a[href*="admin"], nav a:has-text("관리자"), nav a:has-text("Admin")')
      await adminMenu.click()
      
      const sitesLink = page.locator('a[href*="sites"], a:has-text("현장"), a:has-text("Sites")')
      await sitesLink.click()
      
      await page.waitForURL('**/admin/sites')
      await expect(page.locator('h1, h2').filter({ hasText: /현장.*관리|Site.*Management/i })).toBeVisible()
    })

    test('should create a new site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Click new site button
      const newButton = page.locator('button, a').filter({ hasText: /새.*현장|new.*site|추가|add/i })
      await newButton.click()
      
      // Fill site details
      await page.fill('input[name="name"], input[placeholder*="현장명"]', 'Test Construction Site')
      await page.fill('input[name="code"], input[placeholder*="코드"]', 'TEST-001')
      await page.fill('input[name="address"], input[placeholder*="주소"]', '서울시 강남구 테스트로 123')
      
      // Set dates
      await page.fill('input[name="start_date"]', '2025-09-01')
      await page.fill('input[name="end_date"]', '2026-08-31')
      
      // Add project manager
      await page.fill('input[name="project_manager"], input[placeholder*="관리자"]', 'Test Manager')
      await page.fill('input[name="contact_phone"], input[placeholder*="연락처"]', '010-1234-5678')
      await page.fill('input[name="contact_email"], input[placeholder*="이메일"]', 'manager@test.com')
      
      // Select status
      const statusSelect = page.locator('select[name="status"]')
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('active')
      }
      
      // Save site
      const saveButton = page.locator('button').filter({ hasText: /저장|save|create/i })
      await saveButton.click()
      
      // Check for success
      const successMessage = page.locator('[role="alert"].success, .toast-success')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should edit existing site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Find and click on a site
      const siteRow = page.locator('tr, .site-card').first()
      if (await siteRow.count() > 0) {
        await siteRow.click()
        
        // Click edit button
        const editButton = page.locator('button, a').filter({ hasText: /수정|edit/i })
        await editButton.click()
        
        // Update site name
        const nameInput = page.locator('input[name="name"]')
        await nameInput.fill('Updated Site Name')
        
        // Update status
        const statusSelect = page.locator('select[name="status"]')
        if (await statusSelect.count() > 0) {
          await statusSelect.selectOption('completed')
        }
        
        // Save changes
        const saveButton = page.locator('button').filter({ hasText: /저장|save|update/i })
        await saveButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard/admin/sites/new')
      
      // Try to save without required fields
      const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
      await saveButton.click()
      
      // Check for validation errors
      const errors = page.locator('.error, .text-red-500, [aria-invalid="true"]')
      await expect(errors.first()).toBeVisible()
    })

    test('should delete a site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Find a site to delete
      const siteRow = page.locator('tr, .site-card').filter({ hasText: /test|테스트/i })
      if (await siteRow.count() > 0) {
        await siteRow.first().click()
        
        // Click delete button
        const deleteButton = page.locator('button').filter({ hasText: /삭제|delete/i })
        await deleteButton.click()
        
        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /확인|confirm|yes/i })
        await confirmButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Worker Assignment', () => {
    test('should assign workers to site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Select a site
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to workers tab/section
      const workersTab = page.locator('button, a').filter({ hasText: /작업자|workers|인원/i })
      if (await workersTab.count() > 0) {
        await workersTab.click()
      }
      
      // Click assign worker button
      const assignButton = page.locator('button').filter({ hasText: /배정|assign|추가/i })
      await assignButton.click()
      
      // Search for worker
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]')
      await searchInput.fill('worker')
      
      // Select worker from list
      const workerCheckbox = page.locator('input[type="checkbox"]').first()
      await workerCheckbox.check()
      
      // Confirm assignment
      const confirmButton = page.locator('button').filter({ hasText: /확인|assign|배정/i })
      await confirmButton.click()
      
      // Check for success
      const successMessage = page.locator('[role="alert"].success')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should remove worker from site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Select a site with workers
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to workers section
      const workersTab = page.locator('button, a').filter({ hasText: /작업자|workers/i })
      if (await workersTab.count() > 0) {
        await workersTab.click()
      }
      
      // Find a worker to remove
      const workerRow = page.locator('.worker-row, tr').filter({ hasText: /worker/i })
      if (await workerRow.count() > 0) {
        // Click remove button
        const removeButton = workerRow.locator('button').filter({ hasText: /제거|remove|해제/i })
        await removeButton.click()
        
        // Confirm removal
        const confirmButton = page.locator('button').filter({ hasText: /확인|confirm/i })
        await confirmButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('should bulk assign workers', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to workers section
      const workersTab = page.locator('button, a').filter({ hasText: /작업자|workers/i })
      if (await workersTab.count() > 0) {
        await workersTab.click()
      }
      
      // Click bulk assign
      const bulkButton = page.locator('button').filter({ hasText: /일괄|bulk|multiple/i })
      if (await bulkButton.count() > 0) {
        await bulkButton.click()
        
        // Select multiple workers
        const checkboxes = page.locator('input[type="checkbox"]')
        for (let i = 0; i < Math.min(3, await checkboxes.count()); i++) {
          await checkboxes.nth(i).check()
        }
        
        // Assign all
        const assignButton = page.locator('button').filter({ hasText: /배정|assign/i })
        await assignButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Site Documents', () => {
    test('should upload documents to site', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Select a site
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to documents section
      const docsTab = page.locator('button, a').filter({ hasText: /문서|documents|서류/i })
      if (await docsTab.count() > 0) {
        await docsTab.click()
      }
      
      // Upload document
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'test-document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake-pdf-data'),
        })
        
        // Add description
        const descInput = page.locator('input[name="description"], textarea[name="description"]')
        if (await descInput.count() > 0) {
          await descInput.fill('Test document for site')
        }
        
        // Upload
        const uploadButton = page.locator('button').filter({ hasText: /업로드|upload/i })
        await uploadButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('should categorize documents', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to documents
      const docsTab = page.locator('button, a').filter({ hasText: /문서|documents/i })
      if (await docsTab.count() > 0) {
        await docsTab.click()
        
        // Find a document
        const docRow = page.locator('.document-row, tr').first()
        if (await docRow.count() > 0) {
          // Change category
          const categorySelect = docRow.locator('select')
          if (await categorySelect.count() > 0) {
            await categorySelect.selectOption('drawing')
            
            // Check if updated
            await page.waitForTimeout(1000)
          }
        }
      }
    })
  })

  test.describe('Site Statistics', () => {
    test('should view site dashboard', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      // Select a site
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Check dashboard elements
      await expect(page.locator('.stat-card, .statistics').first()).toBeVisible()
      
      // Check for key metrics
      const metrics = ['작업자', 'workers', '일보', 'reports', '진행률', 'progress']
      for (const metric of metrics) {
        const element = page.locator(`text=/${metric}/i`)
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible()
        }
      }
    })

    test('should view site timeline', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to timeline
      const timelineTab = page.locator('button, a').filter({ hasText: /일정|timeline|schedule/i })
      if (await timelineTab.count() > 0) {
        await timelineTab.click()
        
        // Check timeline elements
        const timeline = page.locator('.timeline, .schedule-chart')
        await expect(timeline.first()).toBeVisible()
      }
    })

    test('should export site report', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Find export button
      const exportButton = page.locator('button').filter({ hasText: /export|내보내기|report/i })
      if (await exportButton.count() > 0) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download')
        
        // Click export
        await exportButton.click()
        
        // Wait for download
        const download = await downloadPromise.catch(() => null)
        if (download) {
          expect(download.suggestedFilename()).toContain('site')
        }
      }
    })
  })

  test.describe('Site Settings', () => {
    test('should configure site notifications', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to settings
      const settingsTab = page.locator('button, a').filter({ hasText: /설정|settings/i })
      if (await settingsTab.count() > 0) {
        await settingsTab.click()
        
        // Toggle notifications
        const notificationSwitch = page.locator('input[type="checkbox"], .switch').filter({ hasText: /알림|notification/i })
        if (await notificationSwitch.count() > 0) {
          await notificationSwitch.click()
          
          // Save settings
          const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
          await saveButton.click()
          
          // Check for success
          const successMessage = page.locator('[role="alert"].success')
          await expect(successMessage).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should set site working hours', async ({ page }) => {
      await page.goto('/dashboard/admin/sites')
      
      const siteRow = page.locator('tr, .site-card').first()
      await siteRow.click()
      
      // Navigate to settings
      const settingsTab = page.locator('button, a').filter({ hasText: /설정|settings/i })
      if (await settingsTab.count() > 0) {
        await settingsTab.click()
        
        // Set working hours
        const startTime = page.locator('input[name="work_start_time"]')
        const endTime = page.locator('input[name="work_end_time"]')
        
        if (await startTime.count() > 0) {
          await startTime.fill('08:00')
          await endTime.fill('17:00')
          
          // Save
          const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
          await saveButton.click()
          
          // Check for success
          const successMessage = page.locator('[role="alert"].success')
          await expect(successMessage).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })
})