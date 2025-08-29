/**
 * Test Helper Utilities Examples
 * 
 * This file demonstrates how to use the test helper utilities including
 * auth helpers, render helpers, async helpers, and test data builders.
 */

import React from 'react'
import { screen, waitFor, userEvent } from '@testing-library/react'
import {
  // Auth helpers
  mockAuthState,
  createMockProfile,
  authScenarios,
  
  // Render helpers
  renderWithProviders,
  renderForWorker,
  renderForManager,
  renderForAdmin,
  renderUnauthenticated,
  
  // Async helpers
  waitForLoadingToFinish,
  waitForElement,
  waitForFormSubmission,
  asyncTestUtils,
  
  // Test data builders
  ProfileBuilder,
  TestScenarioBuilder,
  quickBuilders
} from '@/lib/test-utils'

// Example 1: Testing with different auth states
export function testAuthStates() {
  describe('Authentication States', () => {
    it('should handle authenticated worker', () => {
      const auth = authScenarios.workerAuthenticated()
      
      expect(auth.user).toBeDefined()
      expect(auth.profile?.role).toBe('worker')
      expect(auth.loading).toBe(false)
    })

    it('should handle unauthenticated state', () => {
      const auth = authScenarios.unauthenticated()
      
      expect(auth.user).toBeNull()
      expect(auth.profile).toBeNull()
      expect(auth.loading).toBe(false)
    })

    it('should handle loading state', () => {
      const auth = authScenarios.loading()
      
      expect(auth.loading).toBe(true)
      expect(auth.user).toBeNull()
    })

    it('should handle auth errors', () => {
      const auth = authScenarios.authError('Custom error message')
      
      expect(auth.user).toBeNull()
      expect(auth.loading).toBe(false)
    })
  })
}

// Example 2: Testing components with render helpers
export function testComponentWithProviders() {
  // Mock component for testing
  const TestComponent = () => {
    return (
      <div>
        <h1>Test Component</h1>
        <div data-testid="auth-info">
          Authentication status
        </div>
      </div>
    )
  }

  describe('Component with Providers', () => {
    it('should render with authenticated worker context', () => {
      const { getByText, getByTestId, authContext } = renderForWorker(<TestComponent />)
      
      expect(getByText('Test Component')).toBeInTheDocument()
      expect(getByTestId('auth-info')).toBeInTheDocument()
      expect(authContext.profile?.role).toBe('worker')
    })

    it('should render with manager context', () => {
      const { authContext } = renderForManager(<TestComponent />)
      
      expect(authContext.profile?.role).toBe('site_manager')
    })

    it('should render with admin context', () => {
      const { authContext } = renderForAdmin(<TestComponent />)
      
      expect(authContext.profile?.role).toBe('admin')
    })

    it('should render unauthenticated', () => {
      const { authContext } = renderUnauthenticated(<TestComponent />)
      
      expect(authContext.user).toBeNull()
      expect(authContext.profile).toBeNull()
    })

    it('should allow custom auth state', () => {
      const customAuth = mockAuthState('authenticated', {
        profile: createMockProfile('customer_manager', {
          name: 'Custom Customer Manager'
        })
      })

      const { authContext } = renderWithProviders(<TestComponent />, {
        authContext: customAuth
      })
      
      expect(authContext.profile?.name).toBe('Custom Customer Manager')
      expect(authContext.profile?.role).toBe('customer_manager')
    })
  })
}

// Example 3: Testing async operations
export function testAsyncOperations() {
  // Mock component with loading and form
  const AsyncComponent = () => {
    const [loading, setLoading] = React.useState(true)
    const [submitted, setSubmitted] = React.useState(false)

    React.useEffect(() => {
      setTimeout(() => setLoading(false), 200)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitted(true)
    }

    if (loading) {
      return <div data-testid="loading">로딩 중...</div>
    }

    return (
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="입력하세요" />
        <button type="submit">제출</button>
        {submitted && <div data-testid="success">제출 완료!</div>}
      </form>
    )
  }

  describe('Async Operations', () => {
    it('should wait for loading to finish', async () => {
      renderWithProviders(<AsyncComponent />)
      
      // Initially loading
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      
      // Wait for loading to finish
      await waitForLoadingToFinish()
      
      // Content should be loaded
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('should wait for Korean loading text to disappear', async () => {
      renderWithProviders(<AsyncComponent />)
      
      await asyncTestUtils.waitForKoreanLoadingToFinish()
      
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should wait for form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AsyncComponent />)
      
      // Wait for loading first
      await waitForLoadingToFinish()
      
      // Fill and submit form
      const input = screen.getByPlaceholderText('입력하세요')
      const button = screen.getByRole('button', { name: '제출' })
      
      await user.type(input, 'test input')
      await user.click(button)
      
      // Wait for success message
      await waitForElement('[data-testid="success"]', { 
        shouldBeVisible: false 
      })
      
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })
  })
}

// Example 4: Testing with test data builders
export function testWithDataBuilders() {
  describe('Test Data Builders', () => {
    it('should create test scenario with builders', () => {
      const scenario = new TestScenarioBuilder()
        .withOrganization(org => 
          org.withName('테스트 건설회사')
            .withBusinessNumber('123-45-67890')
        )
        .addSite(site => 
          site.withName('테스트 현장')
            .withStatus('active')
        )
        .addProfile(profile => 
          profile.withRole('site_manager')
            .withName('김현장장')
            .withPosition('현장소장')
        )
        .addProfile(profile => 
          profile.withRole('worker')
            .withName('이작업자')
            .withPosition('철근공')
        )
        .build()

      expect(scenario.organization.name).toBe('테스트 건설회사')
      expect(scenario.sites).toHaveLength(1)
      expect(scenario.sites[0].name).toBe('테스트 현장')
      expect(scenario.getManagers()).toHaveLength(1)
      expect(scenario.getWorkers()).toHaveLength(1)
      expect(scenario.getManagers()[0].name).toBe('김현장장')
    })

    it('should use predefined scenarios', () => {
      const constructionCompany = TestScenarioBuilder.constructionCompany().build()
      
      expect(constructionCompany.organization.name).toBe('대한건설(주)')
      expect(constructionCompany.sites.length).toBeGreaterThan(0)
      expect(constructionCompany.getAdmin()).toBeDefined()
    })

    it('should use quick builders', () => {
      const worker = quickBuilders.worker()
      const manager = quickBuilders.manager()
      const activeSite = quickBuilders.activeSite()
      
      expect(worker.role).toBe('worker')
      expect(manager.role).toBe('site_manager')
      expect(activeSite.status).toBe('active')
      expect(activeSite.name).toContain('현장')
    })

    it('should generate work data', () => {
      const profileId = quickBuilders.worker().id
      
      const monthlyWork = quickBuilders.monthlyWork(profileId)
      const overtimeWork = quickBuilders.overtimeWork(profileId)
      
      expect(monthlyWork.length).toBeGreaterThan(0)
      expect(overtimeWork).toHaveLength(7)
      
      monthlyWork.forEach(record => {
        expect(record.profile_id).toBe(profileId)
        expect(record.labor_hours).toBeGreaterThan(0)
      })
    })
  })
}

// Example 5: Complete integration test
export function testCompleteIntegration() {
  const CompleteDashboard = () => {
    const [loading, setLoading] = React.useState(true)
    const [data, setData] = React.useState<any[]>([])

    React.useEffect(() => {
      // Simulate data loading
      setTimeout(() => {
        setData([
          { id: 1, name: '일일보고서 1', type: 'daily_report' },
          { id: 2, name: '승인요청 1', type: 'approval' },
          { id: 3, name: '자재관리 1', type: 'material' }
        ])
        setLoading(false)
      }, 300)
    }, [])

    if (loading) {
      return <div data-testid="loading">데이터 로딩 중...</div>
    }

    return (
      <div>
        <h1>대시보드</h1>
        <div data-testid="data-container">
          {data.map(item => (
            <div key={item.id} data-testid="data-item">
              {item.name} ({item.type})
            </div>
          ))}
        </div>
      </div>
    )
  }

  describe('Complete Integration', () => {
    it('should test complete workflow with real scenario', async () => {
      // Create a realistic test scenario
      const scenario = TestScenarioBuilder.constructionCompany().build()
      const manager = scenario.getManagers()[0]
      
      // Get auth context for the manager
      const authContext = scenario.getAuthContextFor(manager.id)
      
      // Render component with manager context
      const { getByText, getByTestId } = renderWithProviders(<CompleteDashboard />, {
        authContext: authContext!
      })
      
      // Wait for loading to finish
      await waitForLoadingToFinish()
      
      // Verify dashboard loaded
      expect(getByText('대시보드')).toBeInTheDocument()
      
      // Wait for data to load
      const container = getByTestId('data-container')
      await waitFor(() => {
        const items = container.querySelectorAll('[data-testid="data-item"]')
        expect(items.length).toBe(3)
      })
      
      // Verify data items
      expect(getByText(/일일보고서 1/)).toBeInTheDocument()
      expect(getByText(/승인요청 1/)).toBeInTheDocument()
      expect(getByText(/자재관리 1/)).toBeInTheDocument()
    })

    it('should handle different user roles', async () => {
      const scenarios = [
        { role: 'worker', builder: () => quickBuilders.worker() },
        { role: 'manager', builder: () => quickBuilders.manager() },
        { role: 'admin', builder: () => quickBuilders.admin() }
      ]

      for (const { role, builder } of scenarios) {
        const profile = builder()
        const auth = mockAuthState('authenticated', { profile })
        
        const { getByText } = renderWithProviders(<CompleteDashboard />, {
          authContext: auth
        })
        
        await waitForLoadingToFinish()
        
        expect(getByText('대시보드')).toBeInTheDocument()
        
        // Different roles might see different data
        // This is where you'd test role-specific functionality
      }
    })
  })
}

// Export all test examples
export const helperExamples = {
  testAuthStates,
  testComponentWithProviders,
  testAsyncOperations,
  testWithDataBuilders,
  testCompleteIntegration
}