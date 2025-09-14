/**
 * Auth Error Boundary Component
 *
 * Catches and handles authentication-related errors in the component tree
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { authMetrics } from '../monitoring/auth-metrics'
import { authLogger, AuthEventType } from '../monitoring/auth-logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

export class AuthErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('[AUTH-ERROR-BOUNDARY] Caught error:', error, errorInfo)

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Check if this is an auth-related error
    const isAuthError = this.isAuthError(error)

    if (isAuthError) {
      // Record in metrics
      authMetrics.recordAuthError(error, {
        component_stack: errorInfo.componentStack,
        error_boundary: true,
      })

      // Log to auth logger
      authLogger.error(AuthEventType.ERROR_GENERAL, {
        error: error.message,
        metadata: {
          stack: error.stack,
          component_stack: errorInfo.componentStack,
        },
      })
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send to external error tracking (e.g., Sentry)
    this.reportToErrorTracking(error, errorInfo)

    // Auto-reset after multiple errors (circuit breaker pattern)
    if (this.state.errorCount >= 3) {
      this.scheduleReset()
    }
  }

  private isAuthError(error: Error): boolean {
    const authKeywords = [
      'auth',
      'session',
      'login',
      'logout',
      'token',
      'permission',
      'unauthorized',
      'forbidden',
      'credential',
    ]

    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''

    return authKeywords.some(
      keyword => errorMessage.includes(keyword) || errorStack.includes(keyword)
    )
  }

  private reportToErrorTracking(error: Error, errorInfo: ErrorInfo) {
    // Sentry integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.withScope((scope: any) => {
        scope.setContext('error_boundary', {
          componentStack: errorInfo.componentStack,
          isAuthError: this.isAuthError(error),
          errorCount: this.state.errorCount,
        })
        ;(window as any).Sentry.captureException(error)
      })
    }

    // Custom error reporting endpoint
    if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(err => console.error('Failed to report error:', err))
    }
  }

  private scheduleReset() {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    // Schedule automatic reset after 10 seconds
    this.resetTimeoutId = setTimeout(() => {
      this.handleReset()
    }, 10000)
  }

  private handleReset = () => {
    // Clear the timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    // Reset state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    })

    // Log the reset
    authLogger.info(AuthEventType.ERROR_GENERAL, {
      metadata: { action: 'error_boundary_reset' },
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoToLogin = () => {
    window.location.href = '/auth/login'
  }

  componentWillUnmount() {
    // Clear any pending timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const { error, errorInfo, errorCount } = this.state
      const isAuthError = error && this.isAuthError(error)

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {isAuthError ? '인증 오류가 발생했습니다' : '오류가 발생했습니다'}
            </h2>

            <p className="text-sm text-gray-600 text-center mb-4">
              {isAuthError
                ? '로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.'
                : '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  오류 상세 정보 (개발 모드)
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-mono text-red-600 mb-2">{error.message}</p>
                  {error.stack && (
                    <pre className="text-gray-600 overflow-auto max-h-32">{error.stack}</pre>
                  )}
                  {errorCount > 1 && (
                    <p className="mt-2 text-orange-600">오류 발생 횟수: {errorCount}</p>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              {isAuthError ? (
                <>
                  <button
                    onClick={this.handleGoToLogin}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    다시 로그인
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    다시 시도
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={this.handleReset}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    페이지 새로고침
                  </button>
                </>
              )}
            </div>

            {errorCount >= 3 && (
              <p className="mt-3 text-xs text-center text-orange-600">
                반복적인 오류가 감지되었습니다. 10초 후 자동으로 재시도됩니다.
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithAuthErrorBoundaryComponent(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    )
  }
}

export default AuthErrorBoundary
