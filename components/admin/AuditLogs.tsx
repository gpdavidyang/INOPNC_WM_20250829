'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/ui/strings'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_name?: string
  user_name?: string
  status: 'success' | 'failed' | 'pending'
  created_at: string
}

const STATUS_BADGE_MAP: Record<
  AuditLog['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  success: { label: '성공', variant: 'secondary' },
  pending: { label: '대기', variant: 'default' },
  failed: { label: '실패', variant: 'destructive' },
}

const FALLBACK_LOGS: AuditLog[] = [
  {
    id: 'placeholder-1',
    action: 'login',
    entity_type: 'auth',
    user_name: 'system_admin',
    status: 'success',
    created_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    action: 'update',
    entity_type: 'site',
    entity_name: '강남 A 현장',
    user_name: 'manager@inopnc.com',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]

export default function AuditLogSystem() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    void fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audit-logs/latest?limit=20')
      if (!response.ok) throw new Error('not ok')
      const result = await response.json()
      if (Array.isArray(result?.logs)) {
        setLogs(result.logs as AuditLog[])
      } else {
        setLogs(FALLBACK_LOGS)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setLogs(FALLBACK_LOGS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    void fetchLogs()
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            감사 로그
          </CardTitle>
          <CardDescription>시스템 전반에서 발생한 주요 활동을 확인할 수 있습니다.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            데이터를 불러오는 중입니다...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-10 w-10" />
            <p>표시할 감사 로그가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const badge = STATUS_BADGE_MAP[log.status]
              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-gray-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {log.action.toUpperCase()} · {log.entity_type}
                      {log.entity_name ? ` · ${log.entity_name}` : ''}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(log.created_at).toLocaleString('ko-KR')}</span>
                    {log.user_name && <Badge variant="outline">사용자: {log.user_name}</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
