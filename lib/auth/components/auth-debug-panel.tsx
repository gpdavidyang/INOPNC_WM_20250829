/**
 * Auth Debug Panel
 *
 * Development tool for monitoring auth state and debugging issues
 * Only renders in development mode
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/auth-context'
import { usePermissions } from '../hooks/use-permissions'
import { authLogger, AuthLogEntry, LogLevel } from '../monitoring/auth-logger'
import { useAuthMigrationStatus } from '../migration/auth-provider-adapter'

export function AuthDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<AuthLogEntry[]>([])
  const [activeTab, setActiveTab] = useState<'state' | 'logs' | 'permissions'>('state')

  const auth = useAuth()
  const permissions = usePermissions()
  const migrationStatus = useAuthMigrationStatus()

  useEffect(() => {
    // Subscribe to auth logs
    const unsubscribe = authLogger.subscribe(entry => {
      setLogs(prev => [...prev.slice(-99), entry])
    })

    // Load existing logs
    setLogs(authLogger.getLogs())

    return unsubscribe
  }, [])

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const clearLogs = () => {
    authLogger.clearLogs()
    setLogs([])
  }

  const exportLogs = () => {
    const data = authLogger.exportLogs()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-logs-${Date.now()}.json`
    a.click()
  }

  const stats = authLogger.getStats()

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors text-xs font-mono"
      >
        🔐 Auth Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Auth Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('state')}
          className={`px-4 py-2 text-xs font-medium ${
            activeTab === 'state'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          State
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-medium ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-xs font-medium ${
            activeTab === 'permissions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Permissions
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'state' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Auth State
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                <div>isAuthenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
                <div>isLoading: {auth.isLoading ? '⏳' : '✅'}</div>
                <div>user: {auth.user?.email || 'null'}</div>
                <div>role: {auth.user?.role || 'null'}</div>
                <div>userId: {auth.user?.id?.slice(0, 8) || 'null'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Session
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                <div>hasSession: {auth.session ? '✅' : '❌'}</div>
                <div>
                  expiresAt:{' '}
                  {auth.session?.expiresAt
                    ? new Date(auth.session.expiresAt * 1000).toLocaleTimeString()
                    : 'null'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Migration Status
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                <div>newAuth: {migrationStatus.isUsingNewAuth ? '✅' : '❌'}</div>
                <div>legacyAuth: {migrationStatus.isUsingLegacyAuth ? '✅' : '❌'}</div>
                <div>fullyMigrated: {migrationStatus.isFullyMigrated ? '✅' : '❌'}</div>
                <div>bridged: {migrationStatus.isBridged ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-500">
                Total: {stats.totalLogs} | Errors: {stats.byLevel['ERROR'] || 0}
              </div>
              <div className="space-x-2">
                <button onClick={clearLogs} className="text-xs text-red-600 hover:text-red-700">
                  Clear
                </button>
                <button onClick={exportLogs} className="text-xs text-blue-600 hover:text-blue-700">
                  Export
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {logs
                .slice()
                .reverse()
                .map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs p-1 rounded ${
                      log.level === LogLevel.ERROR
                        ? 'bg-red-50 text-red-900'
                        : log.level === LogLevel.WARN
                          ? 'bg-yellow-50 text-yellow-900'
                          : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{log.event}</span>
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.error && (
                      <div className="text-red-600 mt-1">
                        Error: {typeof log.error === 'string' ? log.error : log.error.message}
                      </div>
                    )}
                    {log.metadata && (
                      <div className="text-gray-600 mt-1">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Current Permissions
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono space-y-1">
                <div>canCreateUser: {permissions.canCreateUser ? '✅' : '❌'}</div>
                <div>canDeleteUser: {permissions.canDeleteUser ? '✅' : '❌'}</div>
                <div>canManageRoles: {permissions.canManageRoles ? '✅' : '❌'}</div>
                <div>canViewReports: {permissions.canViewReports ? '✅' : '❌'}</div>
                <div>canManageProjects: {permissions.canManageProjects ? '✅' : '❌'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Permission Test
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    const result = permissions.hasPermission('system.admin')
                    alert(`hasPermission('system.admin'): ${result}`)
                  }}
                  className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded"
                >
                  Test: system.admin
                </button>
                <button
                  onClick={() => {
                    const result = permissions.canManageUser('worker')
                    alert(`canManageUser(&apos;worker&apos;): ${result}`)
                  }}
                  className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded"
                >
                  Test: canManageUser(&apos;worker&apos;)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export for easy import
export default AuthDebugPanel
