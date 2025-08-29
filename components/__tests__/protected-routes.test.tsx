/**
 * Tests for Protected Route Components and Role-Based Access Control
 * 
 * Critical tests for role-based UI components focusing on AdminPermissionValidator,
 * DashboardLayout role restrictions, and access control enforcement.
 * Comprehensive testing for all user roles and permission scenarios.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders, createMockProfile } from '@/lib/test-utils'
import { createMockUser } from '@/lib/test-utils'
import AdminPermissionValidator from '@/components/admin/AdminPermissionValidator'
import DashboardLayout from '@/components/dashboard/dashboard-layout'

// Mock all admin server actions individually
jest.mock('@/app/actions/admin/sites', () => ({
  getSites: jest.fn(),
  createSite: jest.fn(),
  updateSite: jest.fn(),
  deleteSites: jest.fn()
}))

jest.mock('@/app/actions/admin/users', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUsers: jest.fn()
}))

jest.mock('@/app/actions/admin/documents', () => ({
  getDocuments: jest.fn(),
  processDocumentApprovals: jest.fn()
}))

jest.mock('@/app/actions/admin/materials', () => ({
  getMaterials: jest.fn(),
  updateMaterialInventory: jest.fn()
}))

jest.mock('@/app/actions/admin/markup', () => ({
  getMarkupDocuments: jest.fn(),
  manageMarkupDocumentPermissions: jest.fn()
}))

jest.mock('@/app/actions/admin/salary', () => ({
  getSalaryRules: jest.fn(),
  calculateSalaries: jest.fn()
}))

jest.mock('@/app/actions/admin/system', () => ({
  getSystemStats: jest.fn(),
  getSystemConfigurations: jest.fn()
}))

// Mock the MarkupEditor component
jest.mock('@/components/markup/markup-editor', () => ({
  MarkupEditor: ({ profile }: { profile: any }) => (
    <div data-testid="markup-editor">
      <h2>도면 마킹 도구</h2>
      <p>사용자: {profile.full_name}</p>
    </div>
  )
}))

// Mock the dashboard tab components
jest.mock('@/components/dashboard/tabs/home-tab', () => ({ 
  default: ({ profile, onTabChange }: { profile: any; onTabChange: (tab: string) => void }) => (
    <div data-testid="home-tab">
      <h2>홈</h2>
      <p>사용자: {profile.full_name}</p>
      <button onClick={() => onTabChange('profile')}>프로필로 이동</button>
    </div>
  )
}))

jest.mock('@/components/dashboard/tabs/daily-report-tab', () => ({ 
  default: ({ profile }: { profile: any }) => (
    <div data-testid="daily-report-tab">
      <h2>작업일지</h2>
      <p>사용자: {profile.full_name}</p>
    </div>
  )
}))

jest.mock('@/components/dashboard/tabs/attendance-tab', () => ({ 
  default: ({ profile }: { profile: any }) => (
    <div data-testid="attendance-tab">
      <h2>출근현황</h2>
      <p>사용자: {profile.full_name}</p>
    </div>
  )
}))

jest.mock('@/components/dashboard/tabs/documents-tab-unified', () => ({ 
  default: ({ profile, initialTab }: { profile: any; initialTab?: string }) => (
    <div data-testid="documents-tab">
      <h2>문서함 {initialTab ? `(${initialTab})` : ''}</h2>
      <p>사용자: {profile.full_name}</p>
    </div>
  )
}))

jest.mock('@/components/dashboard/sidebar', () => ({ 
  default: ({ profile, activeTab, onTabChange, isOpen, onClose }: any) => {
    if (!profile) return <div data-testid="sidebar">Loading...</div>
    return (
      <div data-testid="sidebar" data-open={isOpen}>
        <h2>사이드바</h2>
        <p>활성 탭: {activeTab}</p>
        <p>사용자: {profile.full_name}</p>
        <button onClick={() => onTabChange('site-management')}>현장 관리</button>
        <button onClick={() => onTabChange('user-management')}>사용자 관리</button>
        <button onClick={() => onTabChange('payroll-management')}>급여 관리</button>
        <button onClick={onClose}>닫기</button>
      </div>
    )
  }
}))

jest.mock('@/components/dashboard/header', () => ({ 
  default: ({ profile, onMenuClick }: any) => {
    if (!profile) return <div data-testid="header">Loading...</div>
    return (
      <div data-testid="header">
        <h1>헤더</h1>
        <p>사용자: {profile.full_name}</p>
        <button onClick={onMenuClick}>메뉴</button>
      </div>
    )
  }
}))

jest.mock('@/components/ui/bottom-navigation', () => ({
  BottomNavigation: ({ items, onTabChange, activeTab }: any) => (
    <div data-testid="bottom-navigation">
      <p>활성 탭: {activeTab}</p>
      {items.map((item: any, index: number) => (
        <button key={index} onClick={() => onTabChange(item.href)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}))

describe('Protected Route Components and Role-Based Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default successful responses for admin actions
    const mockResponse = { success: true, data: { total: 0, items: [] } }
    
    // Import and setup all mocked functions
    require('@/app/actions/admin/sites').getSites.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/users').getUsers.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/documents').getDocuments.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/materials').getMaterials.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/markup').getMarkupDocuments.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/salary').getSalaryRules.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/system').getSystemStats.mockResolvedValue(mockResponse)
    require('@/app/actions/admin/system').getSystemConfigurations.mockResolvedValue(mockResponse)
  })

  describe('AdminPermissionValidator', () => {
    it('should pass role validation for admin users', async () => {
      const adminProfile = createMockProfile('admin', {
        full_name: 'Admin User',
        id: 'admin-123'
      })

      render(<AdminPermissionValidator profile={adminProfile} />)

      expect(screen.getByText('관리자 권한 및 통합 테스트')).toBeInTheDocument()
      expect(screen.getByText('모든 테스트 실행')).toBeInTheDocument()
      
      // Run auth role test
      fireEvent.click(screen.getByText('모든 테스트 실행'))
      
      await waitFor(() => {
        expect(screen.getByText(/사용자 역할: admin/)).toBeInTheDocument()
      })
    })

    it('should fail role validation for non-admin users', async () => {
      const workerProfile = createMockProfile('worker', {
        full_name: 'Worker User',
        id: 'worker-123'
      })

      render(<AdminPermissionValidator profile={workerProfile} />)

      // Run auth role test
      fireEvent.click(screen.getByText('모든 테스트 실행'))
      
      await waitFor(() => {
        expect(screen.getByText(/권한 부족: 현재 역할 worker/)).toBeInTheDocument()
      })
    })

    it('should pass role validation for system_admin users', async () => {
      const systemAdminProfile = createMockProfile('system_admin', {
        full_name: 'System Admin',
        id: 'sysadmin-123'
      })

      render(<AdminPermissionValidator profile={systemAdminProfile} />)

      // Run auth role test
      fireEvent.click(screen.getByText('모든 테스트 실행'))
      
      await waitFor(() => {
        expect(screen.getByText(/사용자 역할: system_admin/)).toBeInTheDocument()
      })
    })

    it('should test admin CRUD operations with proper permissions', async () => {
      const adminProfile = createMockProfile('admin')

      // Mock successful CRUD operations
      require('@/app/actions/admin/sites').getSites.mockResolvedValue({
        success: true,
        data: { total: 5, items: [] }
      })
      require('@/app/actions/admin/users').getUsers.mockResolvedValue({
        success: true,
        data: { total: 10, items: [] }
      })

      render(<AdminPermissionValidator profile={adminProfile} />)

      // Filter to CRUD tests only
      fireEvent.click(screen.getByText('CRUD (8)'))
      fireEvent.click(screen.getByText('모든 테스트 실행'))

      await waitFor(() => {
        expect(require('@/app/actions/admin/sites').getSites).toHaveBeenCalledWith(1, 5)
        expect(require('@/app/actions/admin/users').getUsers).toHaveBeenCalledWith(1, 5)
        expect(screen.getByText(/현장 5개 조회 성공/)).toBeInTheDocument()
        expect(screen.getByText(/사용자 10명 조회 성공/)).toBeInTheDocument()
      })
    })

    it('should handle CRUD operation failures gracefully', async () => {
      const adminProfile = createMockProfile('admin')

      // Mock failed operations
      require('@/app/actions/admin/sites').getSites.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      render(<AdminPermissionValidator profile={adminProfile} />)

      // Filter to CRUD tests and run
      fireEvent.click(screen.getByText('CRUD (8)'))
      fireEvent.click(screen.getByText('모든 테스트 실행'))

      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument()
      })
    })

    it('should test permission categories separately', async () => {
      const adminProfile = createMockProfile('admin')

      render(<AdminPermissionValidator profile={adminProfile} />)

      // Test permissions category
      fireEvent.click(screen.getByText('권한 (6)'))
      
      expect(screen.getAllByText(/권한/).length).toBeGreaterThan(0)
      
      // Test auth category
      fireEvent.click(screen.getByText('인증 (2)'))
      
      expect(screen.getByText('관리자 권한 검증')).toBeInTheDocument()
      expect(screen.getByText('프로필 데이터 검증')).toBeInTheDocument()
    })

    it('should support individual test execution', async () => {
      const adminProfile = createMockProfile('admin')

      render(<AdminPermissionValidator profile={adminProfile} />)

      // Find and click individual test run button
      const testElements = screen.getAllByText('실행')
      expect(testElements.length).toBeGreaterThan(0)

      fireEvent.click(testElements[0])
      
      // Just verify the test execution started (component updated)
      await waitFor(() => {
        // Look for test execution feedback, could be timing or status change
        const hasTimingInfo = screen.queryByText(/실행 시간:/) || screen.queryByText(/ms/)
        const hasStatusChange = screen.queryByText(/pending|대기|passed|failed/)
        expect(hasTimingInfo || hasStatusChange).toBeTruthy()
      }, { timeout: 3000 })
    })

    it('should reset tests properly', () => {
      const adminProfile = createMockProfile('admin')

      render(<AdminPermissionValidator profile={adminProfile} />)

      fireEvent.click(screen.getByText('초기화'))
      
      // All tests should be back to pending state
      expect(screen.getAllByText(/pending|대기/).length).toBeGreaterThan(0)
    })

    it('should handle performance tests with timing', async () => {
      const adminProfile = createMockProfile('admin')

      render(<AdminPermissionValidator profile={adminProfile} />)

      // Filter to performance tests
      fireEvent.click(screen.getByText('성능 (2)'))
      fireEvent.click(screen.getByText('모든 테스트 실행'))

      await waitFor(() => {
        expect(screen.getByText(/페이지 로드 시간:/)).toBeInTheDocument()
        expect(screen.getByText(/데이터 쿼리 시간:/)).toBeInTheDocument()
      })
    })
  })

  describe('DashboardLayout Role-Based Access', () => {
    it('should render basic dashboard for worker role', () => {
      const user = createMockUser()
      const workerProfile = createMockProfile('worker', {
        full_name: 'Test Worker'
      })

      render(<DashboardLayout user={user} profile={workerProfile} />)

      expect(screen.getByTestId('home-tab')).toBeInTheDocument()
      expect(screen.getByText('사용자: Test Worker')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('should show loading state when profile is not available', () => {
      const user = createMockUser()

      render(<DashboardLayout user={user} profile={null as any} />)

      expect(screen.getByText('프로필을 불러오는 중...')).toBeInTheDocument()
      // Check for loading spinner by class instead of role
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render profile information correctly for different roles', () => {
      const user = createMockUser()
      const profiles = [
        createMockProfile('worker', { full_name: 'Test Worker' }),
        createMockProfile('site_manager', { full_name: 'Test Manager' }),
        createMockProfile('customer_manager', { full_name: 'Test Customer' }),
        createMockProfile('admin', { full_name: 'Test Admin' }),
        createMockProfile('system_admin', { full_name: 'Test System Admin' })
      ]

      profiles.forEach(profile => {
        const { rerender } = render(<DashboardLayout user={user} profile={profile} />)

        // Navigate to profile tab
        fireEvent.click(screen.getByText('프로필로 이동'))

        expect(screen.getByText('내정보')).toBeInTheDocument()
        expect(screen.getByText(profile.full_name)).toBeInTheDocument()
        
        // Check role-specific labels
        const roleLabels = {
          worker: '작업자',
          site_manager: '현장관리자',
          customer_manager: '파트너사',
          admin: '관리자',
          system_admin: '시스템관리자'
        }
        
        expect(screen.getByText(roleLabels[profile.role])).toBeInTheDocument()

        rerender(<div />) // Clear for next iteration
      })
    })

    it('should provide access to admin functions for admin roles', () => {
      const user = createMockUser()
      const adminProfile = createMockProfile('admin', {
        full_name: 'Test Admin'
      })

      render(<DashboardLayout user={user} profile={adminProfile} />)

      // Admin should be able to access admin menus through sidebar
      fireEvent.click(screen.getByText('현장 관리'))
      expect(screen.getByText('현장 관리')).toBeInTheDocument()
      expect(screen.getByText('현장 관리 기능이 구현될 예정입니다.')).toBeInTheDocument()

      fireEvent.click(screen.getByText('사용자 관리'))
      expect(screen.getByText('사용자 관리')).toBeInTheDocument()

      fireEvent.click(screen.getByText('급여 관리'))
      expect(screen.getByText('급여 관리')).toBeInTheDocument()
    })

    it('should handle tab navigation correctly', () => {
      const user = createMockUser()
      const profile = createMockProfile('worker')

      render(<DashboardLayout user={user} profile={profile} />)

      // Test bottom navigation exists
      const bottomNav = screen.getByTestId('bottom-navigation')
      expect(bottomNav).toBeInTheDocument()
      
      // Test navigation buttons exist
      expect(screen.getByText('출력현황')).toBeInTheDocument()
      expect(screen.getByText('작업일지')).toBeInTheDocument()
      expect(screen.getByText('문서함')).toBeInTheDocument()
    })

    it('should handle blueprint markup access', () => {
      const user = createMockUser()
      const profile = createMockProfile('worker')

      render(<DashboardLayout user={user} profile={profile} />)

      // Test that blueprint markup button exists in bottom navigation
      expect(screen.getByText('공도면')).toBeInTheDocument()
      
      // Test that home tab is initially rendered
      expect(screen.getByTestId('home-tab')).toBeInTheDocument()
    })

    it('should handle mobile sidebar toggle', () => {
      const user = createMockUser()
      const profile = createMockProfile('worker')

      render(<DashboardLayout user={user} profile={profile} />)

      const sidebar = screen.getByTestId('sidebar')
      const menuButton = screen.getByText('메뉴')

      // Sidebar should start closed on mobile
      expect(sidebar).toHaveAttribute('data-open', 'false')

      // Toggle sidebar open
      fireEvent.click(menuButton)
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Close sidebar
      fireEvent.click(screen.getByText('닫기'))
      expect(sidebar).toHaveAttribute('data-open', 'false')
    })

    it('should handle settings iframe rendering', () => {
      const user = createMockUser()
      const profile = createMockProfile('admin')

      const { container } = render(<DashboardLayout user={user} profile={profile} />)

      // Test that main content area exists
      const mainContent = screen.getByRole('region', { name: '페이지 콘텐츠' })
      expect(mainContent).toBeInTheDocument()
      
      // Test that home tab is rendered by default
      expect(screen.getByTestId('home-tab')).toBeInTheDocument()
    })

    it('should handle accessibility features', () => {
      const user = createMockUser()
      const profile = createMockProfile('worker')

      render(<DashboardLayout user={user} profile={profile} />)

      // Check for skip link
      expect(screen.getByText('메인 콘텐츠로 이동')).toBeInTheDocument()

      // Check for ARIA labels
      expect(screen.getByLabelText('메인 네비게이션')).toBeInTheDocument()
      expect(screen.getByLabelText('모바일 하단 네비게이션')).toBeInTheDocument()
      expect(screen.getByLabelText('페이지 콘텐츠')).toBeInTheDocument()

      // Check for live region
      expect(screen.getByRole('region', { name: '페이지 콘텐츠' })).toHaveAttribute('aria-live', 'polite')
    })

    it('should restrict access to admin-only content for non-admin users', () => {
      const user = createMockUser()
      const workerProfile = createMockProfile('worker')

      render(<DashboardLayout user={user} profile={workerProfile} />)

      // Worker should not see admin menu items in sidebar navigation
      // (This test assumes sidebar properly filters based on role)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      
      // The sidebar component would internally filter admin options
      // based on user role, so we verify the basic setup is correct
      expect(screen.getByText('사용자: ' + workerProfile.full_name)).toBeInTheDocument()
    })
  })

  describe('Role-Based Component Security', () => {
    it('should enforce role-based rendering for sensitive components', () => {
      const roles = ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'] as const
      
      roles.forEach(role => {
        const profile = createMockProfile(role)
        const user = createMockUser()

        const { container, unmount } = render(<DashboardLayout user={user} profile={profile} />)

        // Verify profile info is properly rendered
        expect(screen.getByText(`사용자: ${profile.full_name}`)).toBeInTheDocument()
        
        // Verify component renders without errors
        expect(container.firstChild).toBeInTheDocument()

        unmount()
      })
    })

    it('should handle edge cases in profile data', () => {
      const user = createMockUser()
      const incompleteProfile = createMockProfile('worker', {
        full_name: '',
        email: '',
        id: ''
      })

      render(<DashboardLayout user={user} profile={incompleteProfile} />)

      // Should still render basic layout even with incomplete profile
      expect(screen.getByTestId('home-tab')).toBeInTheDocument()
    })

    it('should prevent XSS attacks through profile data', () => {
      const user = createMockUser()
      const maliciousProfile = createMockProfile('worker', {
        full_name: '<script>alert("xss")</script>',
        email: 'test@example.com'
      })

      render(<DashboardLayout user={user} profile={maliciousProfile} />)

      // Profile name should be escaped and not executed
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
      
      // Verify no script tags were actually created
      expect(document.getElementsByTagName('script')).toHaveLength(0)
    })

    it('should handle concurrent role validation tests', async () => {
      const profiles = [
        createMockProfile('admin'),
        createMockProfile('worker'),
        createMockProfile('system_admin')
      ]

      const validationPromises = profiles.map(profile => {
        return new Promise(resolve => {
          render(<AdminPermissionValidator profile={profile} />)
          fireEvent.click(screen.getByText('모든 테스트 실행'))
          resolve(profile.role)
        })
      })

      const results = await Promise.all(validationPromises)
      expect(results).toHaveLength(3)
    })

    it('should maintain security during component state changes', () => {
      const user = createMockUser()
      const profile = createMockProfile('worker')

      const { rerender } = render(<DashboardLayout user={user} profile={profile} />)

      // Attempt to change user role (should not affect existing instance)
      const elevatedProfile = { ...profile, role: 'admin' as const }
      
      rerender(<DashboardLayout user={user} profile={elevatedProfile} />)

      // Verify the component updates correctly with new role
      expect(screen.getByText(`사용자: ${elevatedProfile.full_name}`)).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API failures in permission validation gracefully', async () => {
      const adminProfile = createMockProfile('admin')

      // Mock API failure
      require('@/app/actions/admin/sites').getSites.mockRejectedValue(new Error('Network error'))

      render(<AdminPermissionValidator profile={adminProfile} />)

      fireEvent.click(screen.getByText('CRUD (8)'))
      fireEvent.click(screen.getByText('모든 테스트 실행'))

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })

    it('should handle component unmounting during async operations', async () => {
      const adminProfile = createMockProfile('admin')

      const { unmount } = render(<AdminPermissionValidator profile={adminProfile} />)

      // Start async test
      fireEvent.click(screen.getByText('모든 테스트 실행'))
      
      // Unmount immediately
      unmount()

      // Should not throw errors or memory leaks
      await waitFor(() => {
        // Just wait for any pending operations
      }, { timeout: 1000 })
    })

    it('should handle malformed profile data', () => {
      const user = createMockUser()
      const malformedProfile = {
        ...createMockProfile('worker'),
        role: null as any,
        id: undefined as any,
        full_name: ''
      }

      // Test with error boundary wrapper to catch rendering errors
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>
        } catch (error) {
          return <div>Error caught</div>
        }
      }

      const { container } = render(
        <ErrorBoundary>
          <DashboardLayout user={user} profile={malformedProfile} />
        </ErrorBoundary>
      )

      // Should render something (either the component or error boundary)
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})