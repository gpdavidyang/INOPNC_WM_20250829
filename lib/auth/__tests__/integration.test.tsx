/**
 * Integration tests for the new auth system
 */

import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { MockAuthProvider } from '@/lib/auth/providers/mock-provider'

// Test component that uses auth
function TestComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Not authenticated</div>

  return (
    <div>
      <div>User: {user?.email}</div>
      <div>Role: {user?.role}</div>
    </div>
  )
}

describe('Auth System Integration', () => {
  it('should render loading state initially', () => {
    const mockProvider = new MockAuthProvider()

    render(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show not authenticated when no session', async () => {
    const mockProvider = new MockAuthProvider()

    render(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  it('should show user info after sign in', async () => {
    const mockProvider = new MockAuthProvider()

    const { rerender } = render(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    // Sign in
    await mockProvider.signIn({
      email: 'admin@test.com',
      password: 'admin123',
    })

    // Force re-render to pick up auth changes
    rerender(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('User: admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('Role: admin')).toBeInTheDocument()
    })
  })

  it('should clear session after sign out', async () => {
    const mockProvider = new MockAuthProvider()

    // Sign in first
    await mockProvider.signIn({
      email: 'admin@test.com',
      password: 'admin123',
    })

    const { rerender } = render(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('User: admin@test.com')).toBeInTheDocument()
    })

    // Sign out
    await mockProvider.signOut()

    // Force re-render
    rerender(
      <AuthProvider provider={mockProvider}>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })
})
