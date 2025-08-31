'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface WorkerDebugPanelProps {
  reportId: string
  onClose?: () => void
}

export default function WorkerDebugPanel({ reportId, onClose }: WorkerDebugPanelProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runServerSideTest = async () => {
    setTesting(true)
    setError(null)
    setTestResult(null)

    try {
      // Test server-side insert
      const response = await fetch('/api/debug/test-worker-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reportId,
          workerName: `테스트 작업자 ${new Date().toISOString()}`,
          workHours: 8
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Server error: ${data.error}\n${JSON.stringify(data.errorDetails || data, null, 2)}`)
      } else {
        setTestResult(data)
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTesting(false)
    }
  }

  const fetchWorkers = async () => {
    setTesting(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch(`/api/debug/test-worker-insert?reportId=${reportId}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Fetch error: ${data.error}`)
      } else {
        setTestResult(data)
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Worker Debug Panel</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600">
          Report ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{reportId}</code>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runServerSideTest}
            disabled={testing}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Server Insert'}
          </button>
          <button
            onClick={fetchWorkers}
            disabled={testing}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Fetching...' : 'Fetch Workers'}
          </button>
        </div>

        {testing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <pre className="text-xs text-red-800 whitespace-pre-wrap break-all">
                {error}
              </pre>
            </div>
          </div>
        )}

        {testResult && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-green-800 mb-1">Success!</p>
                <pre className="text-xs text-green-700 whitespace-pre-wrap break-all">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            This panel tests worker operations from the server side to isolate client-side issues.
          </p>
        </div>
      </div>
    </div>
  )
}