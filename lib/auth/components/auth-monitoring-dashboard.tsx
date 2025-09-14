/**
 * Auth Monitoring Dashboard
 *
 * Real-time monitoring dashboard for authentication metrics and performance
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { authMetrics } from '../monitoring/auth-metrics'
import { authLogger, LogLevel } from '../monitoring/auth-logger'
import { authPerformanceMonitor } from '../monitoring/performance-monitor'
import { useAuth } from '../context/auth-context'

interface DashboardTab {
  id: string
  label: string
  icon: string
}

const tabs: DashboardTab[] = [
  { id: 'overview', label: '개요', icon: '📊' },
  { id: 'metrics', label: '메트릭', icon: '📈' },
  { id: 'performance', label: '성능', icon: '⚡' },
  { id: 'logs', label: '로그', icon: '📜' },
  { id: 'alerts', label: '알림', icon: '🚨' },
]

export function AuthMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Only show to admins in development
  if (process.env.NODE_ENV !== 'development' && user?.role !== 'system_admin') {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">인증 시스템 모니터링</h2>
        <p className="text-sm text-gray-500 mt-1">실시간 인증 메트릭 및 성능 모니터링</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab key={refreshKey} />}
        {activeTab === 'metrics' && <MetricsTab key={refreshKey} />}
        {activeTab === 'performance' && <PerformanceTab key={refreshKey} />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'alerts' && <AlertsTab key={refreshKey} />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const counters = authMetrics.getCounters()
  const stats = authMetrics.getStatistics()
  const perfStats = authPerformanceMonitor.getStatistics()

  const cards = [
    {
      title: '로그인 성공률',
      value: `${stats.success_rate}%`,
      change: stats.success_rate >= 95 ? 'positive' : 'negative',
      description: `총 ${counters.loginAttempts}회 시도`,
    },
    {
      title: '평균 응답 시간',
      value: `${perfStats.averageDuration['auth.signIn'] || 0}ms`,
      change: perfStats.averageDuration['auth.signIn'] < 1000 ? 'positive' : 'negative',
      description: '로그인 처리 시간',
    },
    {
      title: '세션 갱신',
      value: counters.sessionRefresh.toString(),
      change: 'neutral',
      description: '자동 세션 갱신 횟수',
    },
    {
      title: '리다이렉트 루프',
      value: counters.redirectLoops.toString(),
      change: counters.redirectLoops === 0 ? 'positive' : 'negative',
      description: '감지된 무한 루프',
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">{card.title}</p>
            <p
              className={`text-2xl font-bold mb-1 ${
                card.change === 'positive'
                  ? 'text-green-600'
                  : card.change === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-900'
              }`}
            >
              {card.value}
            </p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 활동</h3>
        <RecentActivity />
      </div>
    </div>
  )
}

function MetricsTab() {
  const stats = authMetrics.getStatistics()
  const counters = authMetrics.getCounters()

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">누적 카운터</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="grid grid-cols-2 gap-4">
            {Object.entries(counters).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm text-gray-600">{formatCounterName(key)}</dt>
                <dd className="text-lg font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">통계</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="space-y-2">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-sm text-gray-600">{formatStatName(key)}</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {typeof value === 'number' ? value : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Export Button */}
      <div>
        <button
          onClick={() => downloadMetrics()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          메트릭 내보내기 (JSON)
        </button>
      </div>
    </div>
  )
}

function PerformanceTab() {
  const stats = authPerformanceMonitor.getStatistics()

  return (
    <div className="space-y-6">
      {/* Average Duration */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">평균 처리 시간</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="space-y-2">
            {Object.entries(stats.averageDuration).map(([operation, duration]) => (
              <div key={operation} className="flex justify-between items-center">
                <dt className="text-sm text-gray-600">{operation}</dt>
                <dd
                  className={`text-sm font-medium ${duration > 1000 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {duration}ms
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Success Rate */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">성공률</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="space-y-2">
            {Object.entries(stats.successRate).map(([operation, rate]) => (
              <div key={operation} className="flex justify-between items-center">
                <dt className="text-sm text-gray-600">{operation}</dt>
                <dd
                  className={`text-sm font-medium ${rate >= 95 ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {rate}%
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Slowest Operations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">가장 느린 작업 (Top 10)</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {stats.slowestOperations.map((op, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {index + 1}. {op.operation}
                </span>
                <span
                  className={`text-sm font-medium ${op.duration > 2000 ? 'text-red-600' : 'text-orange-600'}`}
                >
                  {op.duration}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogsTab() {
  const [logs, setLogs] = useState(authLogger.getLogs())
  const [filter, setFilter] = useState<LogLevel | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = authLogger.subscribe(entry => {
      setLogs(prev => [...prev.slice(-99), entry])
    })

    return unsubscribe
  }, [])

  const filteredLogs = filter !== undefined ? logs.filter(log => log.level >= filter) : logs

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-3 py-1 text-xs rounded ${
            filter === undefined ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter(LogLevel.ERROR)}
          className={`px-3 py-1 text-xs rounded ${
            filter === LogLevel.ERROR ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          에러
        </button>
        <button
          onClick={() => setFilter(LogLevel.WARN)}
          className={`px-3 py-1 text-xs rounded ${
            filter === LogLevel.WARN ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          경고
        </button>
        <button
          onClick={() => setFilter(LogLevel.INFO)}
          className={`px-3 py-1 text-xs rounded ${
            filter === LogLevel.INFO ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          정보
        </button>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
        <div className="space-y-1 font-mono text-xs">
          {filteredLogs
            .slice()
            .reverse()
            .map((log, index) => (
              <div
                key={index}
                className={`${
                  log.level === LogLevel.ERROR
                    ? 'text-red-400'
                    : log.level === LogLevel.WARN
                      ? 'text-yellow-400'
                      : log.level === LogLevel.INFO
                        ? 'text-blue-400'
                        : 'text-gray-400'
                }`}
              >
                <span className="text-gray-500">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                <span className="font-semibold">[{LogLevel[log.level]}]</span>{' '}
                <span>{log.event}</span>
                {log.error && (
                  <div className="ml-4 text-red-300">
                    Error: {typeof log.error === 'string' ? log.error : log.error.message}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => authLogger.clearLogs()}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          로그 지우기
        </button>
        <button
          onClick={() => downloadLogs()}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          로그 내보내기
        </button>
      </div>
    </div>
  )
}

function AlertsTab() {
  const counters = authMetrics.getCounters()
  const recentPaths = authMetrics.getRecentRedirectPaths()

  const alerts = []

  // Check for redirect loops
  if (counters.redirectLoops > 0) {
    alerts.push({
      type: 'error',
      title: '리다이렉트 루프 감지',
      message: `${counters.redirectLoops}개의 무한 루프가 감지되었습니다.`,
      details: recentPaths.length > 0 ? `최근 경로: ${recentPaths.join(', ')}` : undefined,
    })
  }

  // Check for high failure rate
  const failureRate = authMetrics.getFailureRate()
  if (failureRate > 20) {
    alerts.push({
      type: 'warning',
      title: '높은 로그인 실패율',
      message: `로그인 실패율이 ${failureRate}%입니다.`,
      details: '인증 설정을 확인해 주세요.',
    })
  }

  // Check for auth errors
  if (counters.authErrors > 10) {
    alerts.push({
      type: 'error',
      title: '다수의 인증 오류',
      message: `${counters.authErrors}개의 인증 오류가 발생했습니다.`,
      details: '시스템 로그를 확인해 주세요.',
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-green-500 text-4xl mb-2">✅</div>
        <p className="text-gray-600">현재 알림이 없습니다</p>
        <p className="text-sm text-gray-500 mt-1">시스템이 정상적으로 작동 중입니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`rounded-lg p-4 ${
            alert.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {alert.type === 'error' ? (
                <span className="text-red-500 text-xl">⚠️</span>
              ) : (
                <span className="text-yellow-500 text-xl">⚡</span>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h4
                className={`text-sm font-semibold ${
                  alert.type === 'error' ? 'text-red-900' : 'text-yellow-900'
                }`}
              >
                {alert.title}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  alert.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {alert.message}
              </p>
              {alert.details && (
                <p
                  className={`text-xs mt-1 ${
                    alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                >
                  {alert.details}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentActivity() {
  const metrics = authMetrics.getMetrics(Date.now() - 5 * 60 * 1000) // Last 5 minutes

  if (metrics.length === 0) {
    return <p className="text-sm text-gray-500">최근 5분간 활동이 없습니다</p>
  }

  return (
    <div className="space-y-2">
      {metrics
        .slice(-5)
        .reverse()
        .map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{new Date(metric.timestamp).toLocaleTimeString()}</span>
            <span
              className={`font-medium ${
                metric.type === 'login_success'
                  ? 'text-green-600'
                  : metric.type === 'login_failure'
                    ? 'text-red-600'
                    : 'text-gray-700'
              }`}
            >
              {formatMetricType(metric.type)}
            </span>
          </div>
        ))}
    </div>
  )
}

// Helper functions
function formatCounterName(key: string): string {
  const names: Record<string, string> = {
    loginAttempts: '로그인 시도',
    loginSuccess: '로그인 성공',
    loginFailure: '로그인 실패',
    sessionRefresh: '세션 갱신',
    redirectLoops: '리다이렉트 루프',
    authErrors: '인증 오류',
  }
  return names[key] || key
}

function formatStatName(key: string): string {
  const names: Record<string, string> = {
    total_metrics: '전체 메트릭',
    login_attempts: '로그인 시도',
    login_success: '로그인 성공',
    login_failure: '로그인 실패',
    session_refreshes: '세션 갱신',
    redirect_loops: '리다이렉트 루프',
    auth_errors: '인증 오류',
    success_rate: '성공률',
    failure_rate: '실패율',
    last_error: '마지막 오류',
  }
  return names[key] || key
}

function formatMetricType(type: string): string {
  const types: Record<string, string> = {
    login_attempt: '로그인 시도',
    login_success: '로그인 성공',
    login_failure: '로그인 실패',
    session_refresh: '세션 갱신',
    redirect_loop: '리다이렉트 루프',
    auth_error: '인증 오류',
  }
  return types[type] || type
}

function downloadMetrics() {
  const data = authMetrics.exportMetrics()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `auth-metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadLogs() {
  const data = authLogger.exportLogs()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `auth-logs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default AuthMonitoringDashboard
