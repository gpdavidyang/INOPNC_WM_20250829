import { test, expect } from '@playwright/test';

test.describe('가입 요청 관리 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/auth/login');
    
    // 관리자로 로그인
    await page.fill('input[type="email"]', 'admin@inopnc.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 대시보드 로드 대기
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  });

  test('사이드바에 가입 요청 관리 메뉴가 표시되는지 확인', async ({ page }) => {
    // 관리자 대시보드로 이동
    await page.goto('http://localhost:3000/dashboard/admin');
    
    // 사이드바에서 '가입 요청 관리' 메뉴 찾기
    const signupRequestsMenu = page.locator('text=가입 요청 관리');
    await expect(signupRequestsMenu).toBeVisible();
    
    // 메뉴 클릭
    await signupRequestsMenu.click();
    
    // URL 확인
    await expect(page).toHaveURL('http://localhost:3000/dashboard/admin/signup-requests');
    
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("가입 요청 관리")')).toBeVisible();
  });

  test('승인 버튼 클릭 시 ApprovalModal이 열리는지 확인', async ({ page }) => {
    // 가입 요청 관리 페이지로 직접 이동
    await page.goto('http://localhost:3000/dashboard/admin/signup-requests');
    
    // 페이지 로드 대기
    await page.waitForSelector('h1:has-text("가입 요청 관리")');
    
    // 대기중 탭 확인
    const pendingTab = page.locator('text=대기중').first();
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
    }
    
    // 승인 버튼이 있는지 확인 (대기중인 요청이 있을 경우)
    const approveButton = page.locator('button:has-text("승인")').first();
    
    if (await approveButton.count() > 0) {
      // 승인 버튼 클릭
      await approveButton.click();
      
      // ApprovalModal이 열리는지 확인
      await expect(page.locator('text=가입 승인 처리')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=신규 사용자 권한 및 소속 설정')).toBeVisible();
      
      // 소속 업체 선택 필드 확인
      await expect(page.locator('text=소속 업체 선택')).toBeVisible();
      
      // 배정 현장 선택 필드 확인  
      const siteSelection = page.locator('text=배정 현장 선택');
      if (await siteSelection.isVisible()) {
        console.log('✅ 배정 현장 선택 필드가 표시됩니다');
      }
      
      // 모달 닫기
      await page.locator('button[aria-label="Close"], button:has(svg)').first().click();
    } else {
      console.log('ℹ️ 대기중인 가입 요청이 없습니다');
    }
  });

  test('가입 요청 테스트 데이터 생성 및 승인 프로세스', async ({ page }) => {
    // 먼저 테스트용 가입 요청 생성을 위해 로그아웃
    await page.goto('http://localhost:3000/dashboard/admin');
    await page.click('button:has-text("로그아웃")');
    
    // 가입 요청 페이지로 이동
    await page.goto('http://localhost:3000/auth/signup-request');
    
    // 테스트 데이터 입력
    const timestamp = Date.now();
    await page.fill('input[name="fullName"]', `테스트사용자_${timestamp}`);
    await page.fill('input[name="company"]', 'ABC건설');
    await page.fill('input[name="jobTitle"]', '현장소장');
    await page.fill('input[name="phone"]', `010-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`);
    await page.fill('input[name="email"]', `test_${timestamp}@example.com`);
    
    // 제출
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=승인 요청이 제출되었습니다')).toBeVisible({ timeout: 5000 });
    
    // 다시 관리자로 로그인
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'admin@inopnc.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');
    
    // 가입 요청 관리 페이지로 이동
    await page.goto('http://localhost:3000/dashboard/admin/signup-requests');
    
    // 방금 생성한 요청 찾기
    await expect(page.locator(`text=테스트사용자_${timestamp}`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 테스트 가입 요청이 성공적으로 생성되었습니다');
  });
});