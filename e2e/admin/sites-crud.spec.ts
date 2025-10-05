import { test, expect } from '@playwright/test'
import { login, waitForAPIResponse } from '../utils/test-helpers'

test.describe('Admin Sites CRUD', () => {
  test('Create → Edit status → Delete flow', async ({ page }) => {
    // Login as admin
    await login(page as any, 'admin' as any)

    // Create new site
    const name = `E2E 테스트 현장 ${Date.now()}`
    await page.goto('/dashboard/admin/sites/new')
    await page.fill('#site-name', name)
    await page.fill('#site-address', '서울특별시 중구 을지로 100')
    await page.fill('#site-start', '2025-01-01')

    const createResp = page.waitForResponse(
      res =>
        res.url().includes('/api/admin/sites') &&
        res.request().method() === 'POST' &&
        res.status() === 200
    )
    await page.getByRole('button', { name: '현장 생성' }).click()
    await createResp

    // Should navigate to detail page
    await page.waitForURL('**/dashboard/admin/sites/**', { timeout: 15000 })
    await expect(page.getByRole('heading', { name: '현장 상세' })).toBeVisible()

    // Change status to inactive (중단)
    const patchResp = page.waitForResponse(
      res =>
        res.url().includes('/api/admin/sites/') &&
        res.request().method() === 'PATCH' &&
        res.status() === 200
    )
    await page.getByRole('button', { name: /상태 변경/ }).click()
    await page.getByRole('menuitem', { name: '중단' }).click()
    await patchResp
    // Verify status text updated (detail shows raw status value)
    await expect(page.getByText('inactive')).toBeVisible()

    // Delete site (opens confirm dialog)
    const deleteResp = page.waitForResponse(
      res =>
        res.url().includes('/api/admin/sites/') &&
        res.request().method() === 'DELETE' &&
        res.status() === 200
    )
    await page.getByRole('button', { name: '삭제' }).first().click()
    await page.getByRole('button', { name: '삭제' }).last().click()
    await deleteResp

    // Back to list
    await page.waitForURL('**/dashboard/admin/sites**', { timeout: 15000 })
    await expect(page.getByText('현장 관리')).toBeVisible()
  })
})
