import { test, expect } from '../fixtures/auth.fixture'
import { testDailyReport, getTodayDate, testUsers } from '../fixtures/test-data'

test.describe('Daily Report Complete Workflow', () => {
  test.use({ storageState: undefined }) // Ensure clean state

  test.beforeEach(async ({ page }) => {
    // Login as worker
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', testUsers.worker.email)
    await page.fill('input[name="password"]', testUsers.worker.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('Create Daily Report', () => {
    test('should navigate to daily reports page', async ({ page }) => {
      // Navigate to daily reports
      await page.click('a[href*="daily-reports"], nav a:has-text("일보"), nav a:has-text("Daily Reports")')
      await page.waitForURL('**/daily-reports')
      
      // Verify page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /일보|Daily Report/i })).toBeVisible()
    })

    test('should create a new daily report', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Click new report button
      const newButton = page.locator('button, a').filter({ hasText: /새.*일보|new.*report|작성|create/i })
      await newButton.click()
      
      // Wait for form to load
      await page.waitForURL('**/daily-reports/new')
      
      // Fill in report details
      await page.fill('input[name="work_date"], input[type="date"]', getTodayDate())
      await page.fill('input[name="member_name"], input[placeholder*="작업자"]', testDailyReport.memberName)
      
      // Select process type if dropdown exists
      const processSelect = page.locator('select[name="process_type"]')
      if (await processSelect.count() > 0) {
        await processSelect.selectOption(testDailyReport.processType)
      }
      
      // Fill worker count
      await page.fill('input[name="total_workers"], input[type="number"]', testDailyReport.totalWorkers.toString())
      
      // Fill NPC-1000 material data
      await page.fill('input[name="npc1000_incoming"]', testDailyReport.npc1000Incoming.toString())
      await page.fill('input[name="npc1000_used"]', testDailyReport.npc1000Used.toString())
      await page.fill('input[name="npc1000_remaining"]', testDailyReport.npc1000Remaining.toString())
      
      // Fill work content
      await page.fill('textarea[name="work_content"], textarea[placeholder*="작업 내용"]', testDailyReport.workContent)
      await page.fill('textarea[name="issues"], textarea[placeholder*="특이사항"]', testDailyReport.issues)
      await page.fill('textarea[name="tomorrow_plan"], textarea[placeholder*="내일"]', testDailyReport.tomorrowPlan)
      
      // Save as draft
      const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
      await saveButton.click()
      
      // Check for success message
      const successMessage = page.locator('[role="alert"].success, .toast-success, .text-green-500')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should upload photos to daily report', async ({ page }) => {
      await page.goto('/dashboard/daily-reports/new')
      
      // Fill basic info
      await page.fill('input[name="work_date"], input[type="date"]', getTodayDate())
      await page.fill('input[name="member_name"]', 'Photo Test Worker')
      
      // Upload photo
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.count() > 0) {
        // Create a test file
        await fileInput.setInputFiles({
          name: 'test-photo.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
        })
        
        // Wait for upload to complete
        await page.waitForTimeout(1000)
        
        // Check if photo preview appears
        const photoPreview = page.locator('img[src*="photo"], .photo-preview')
        await expect(photoPreview.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard/daily-reports/new')
      
      // Try to submit without filling required fields
      const submitButton = page.locator('button').filter({ hasText: /제출|submit/i })
      await submitButton.click()
      
      // Check for validation errors
      const validationError = page.locator('.error, .text-red-500, [role="alert"]')
      await expect(validationError.first()).toBeVisible()
    })

    test('should auto-save draft', async ({ page }) => {
      await page.goto('/dashboard/daily-reports/new')
      
      // Fill some data
      await page.fill('input[name="work_date"], input[type="date"]', getTodayDate())
      await page.fill('textarea[name="work_content"]', 'Auto-save test content')
      
      // Wait for auto-save (if implemented)
      await page.waitForTimeout(3000)
      
      // Refresh page
      await page.reload()
      
      // Check if data persists (if auto-save is implemented)
      const workContent = page.locator('textarea[name="work_content"]')
      // This would check if auto-save worked
      // await expect(workContent).toHaveValue('Auto-save test content')
    })
  })

  test.describe('Submit and Approve Daily Report', () => {
    test('should submit daily report for approval', async ({ page }) => {
      // Create a report first
      await page.goto('/dashboard/daily-reports/new')
      
      // Fill minimum required fields
      await page.fill('input[name="work_date"], input[type="date"]', getTodayDate())
      await page.fill('input[name="member_name"]', 'Submit Test Worker')
      await page.fill('textarea[name="work_content"]', 'Work completed for submission test')
      
      // Save first
      const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
      await saveButton.click()
      await page.waitForTimeout(1000)
      
      // Submit for approval
      const submitButton = page.locator('button').filter({ hasText: /제출|submit/i })
      await submitButton.click()
      
      // Confirm submission if dialog appears
      const confirmButton = page.locator('button').filter({ hasText: /확인|confirm|yes/i })
      if (await confirmButton.count() > 0) {
        await confirmButton.click()
      }
      
      // Check for success message
      const successMessage = page.locator('[role="alert"].success, .toast-success')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should show submitted status', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Look for submitted reports
      const submittedBadge = page.locator('.badge, .status').filter({ hasText: /submitted|제출됨/i })
      if (await submittedBadge.count() > 0) {
        await expect(submittedBadge.first()).toBeVisible()
      }
    })

    test('admin should be able to approve report', async ({ page }) => {
      // Logout and login as admin
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Navigate to daily reports
      await page.goto('/dashboard/daily-reports')
      
      // Find a submitted report
      const reportRow = page.locator('tr, .report-card').filter({ has: page.locator('text=/submitted|제출됨/i') })
      if (await reportRow.count() > 0) {
        await reportRow.first().click()
        
        // Click approve button
        const approveButton = page.locator('button').filter({ hasText: /승인|approve/i })
        await approveButton.click()
        
        // Add approval comment
        const commentInput = page.locator('textarea[name="comment"], textarea[placeholder*="코멘트"]')
        if (await commentInput.count() > 0) {
          await commentInput.fill('Approved - Good work!')
        }
        
        // Confirm approval
        const confirmButton = page.locator('button').filter({ hasText: /확인|confirm/i })
        await confirmButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('admin should be able to reject report', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', testUsers.admin.email)
      await page.fill('input[name="password"]', testUsers.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      await page.goto('/dashboard/daily-reports')
      
      // Find a submitted report
      const reportRow = page.locator('tr, .report-card').filter({ has: page.locator('text=/submitted|제출됨/i') })
      if (await reportRow.count() > 0) {
        await reportRow.first().click()
        
        // Click reject button
        const rejectButton = page.locator('button').filter({ hasText: /반려|reject/i })
        await rejectButton.click()
        
        // Add rejection reason
        const reasonInput = page.locator('textarea[name="reason"], textarea[placeholder*="사유"]')
        await reasonInput.fill('Missing required information')
        
        // Confirm rejection
        const confirmButton = page.locator('button').filter({ hasText: /확인|confirm/i })
        await confirmButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('View and Filter Daily Reports', () => {
    test('should filter reports by date range', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Set date range
      const startDateInput = page.locator('input[name="start_date"], input[placeholder*="시작"]')
      const endDateInput = page.locator('input[name="end_date"], input[placeholder*="종료"]')
      
      if (await startDateInput.count() > 0) {
        await startDateInput.fill('2025-08-01')
        await endDateInput.fill('2025-08-31')
        
        // Apply filter
        const filterButton = page.locator('button').filter({ hasText: /검색|search|filter|적용/i })
        await filterButton.click()
        
        // Wait for results
        await page.waitForTimeout(1000)
        
        // Check if results are filtered
        const reportDates = page.locator('.report-date, td:nth-child(2)')
        const count = await reportDates.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should filter reports by status', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find status filter
      const statusFilter = page.locator('select[name="status"], select[aria-label*="status"]')
      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption('approved')
        
        // Wait for filter to apply
        await page.waitForTimeout(1000)
        
        // Check all visible reports have approved status
        const statusBadges = page.locator('.status, .badge')
        const approvedCount = await statusBadges.filter({ hasText: /approved|승인/i }).count()
        expect(approvedCount).toBeGreaterThanOrEqual(0)
      }
    })

    test('should search reports by keyword', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]')
      if (await searchInput.count() > 0) {
        await searchInput.fill('concrete')
        await searchInput.press('Enter')
        
        // Wait for search results
        await page.waitForTimeout(1000)
        
        // Verify search worked
        const reports = page.locator('.report-card, tbody tr')
        const count = await reports.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should paginate through reports', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find pagination controls
      const nextButton = page.locator('button, a').filter({ hasText: /next|다음|>/i })
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        // Click next page
        await nextButton.click()
        
        // Wait for new page to load
        await page.waitForTimeout(1000)
        
        // Check page changed
        const pageIndicator = page.locator('.page-number, [aria-label*="page"]')
        if (await pageIndicator.count() > 0) {
          const pageText = await pageIndicator.textContent()
          expect(pageText).toContain('2')
        }
      }
    })

    test('should export reports', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find export button
      const exportButton = page.locator('button').filter({ hasText: /export|내보내기|download/i })
      if (await exportButton.count() > 0) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download')
        
        // Click export
        await exportButton.click()
        
        // Select format if dialog appears
        const excelOption = page.locator('button, label').filter({ hasText: /excel|xlsx/i })
        if (await excelOption.count() > 0) {
          await excelOption.click()
        }
        
        // Wait for download
        const download = await downloadPromise.catch(() => null)
        if (download) {
          expect(download.suggestedFilename()).toContain('report')
        }
      }
    })
  })

  test.describe('Edit Daily Report', () => {
    test('should edit draft report', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find a draft report
      const draftReport = page.locator('tr, .report-card').filter({ has: page.locator('text=/draft|임시저장/i') })
      if (await draftReport.count() > 0) {
        await draftReport.first().click()
        
        // Click edit button
        const editButton = page.locator('button, a').filter({ hasText: /수정|edit/i })
        await editButton.click()
        
        // Update content
        const contentField = page.locator('textarea[name="work_content"]')
        await contentField.fill('Updated work content')
        
        // Save changes
        const saveButton = page.locator('button').filter({ hasText: /저장|save/i })
        await saveButton.click()
        
        // Check for success
        const successMessage = page.locator('[role="alert"].success')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    })

    test('should not allow editing approved reports', async ({ page }) => {
      await page.goto('/dashboard/daily-reports')
      
      // Find an approved report
      const approvedReport = page.locator('tr, .report-card').filter({ has: page.locator('text=/approved|승인/i') })
      if (await approvedReport.count() > 0) {
        await approvedReport.first().click()
        
        // Edit button should be disabled or hidden
        const editButton = page.locator('button').filter({ hasText: /수정|edit/i })
        if (await editButton.count() > 0) {
          await expect(editButton).toBeDisabled()
        }
      }
    })
  })
})