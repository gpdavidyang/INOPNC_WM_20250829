'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Here you could send error to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
              오류가 발생했습니다
            </h1>
            <p className="mt-2 text-sm text-center text-gray-600">
              죄송합니다. 예상치 못한 오류가 발생했습니다.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                페이지 새로고침
              </Button>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  대시보드로 이동
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
