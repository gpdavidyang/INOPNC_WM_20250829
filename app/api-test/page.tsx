'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])

    // Test 1: Simple GET to test-post
    try {
      const res = await fetch('/api/test-post')
      const data = await res.json()
      addResult('GET /api/test-post', { status: res.status, data })
    } catch (error) {
      addResult('GET /api/test-post', { error: error instanceof Error ? error.message : 'Failed' })
    }

    // Test 2: Simple POST to test-post
    try {
      const res = await fetch('/api/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      })
      const data = await res.json()
      addResult('POST /api/test-post (JSON)', { status: res.status, data })
    } catch (error) {
      addResult('POST /api/test-post (JSON)', { error: error instanceof Error ? error.message : 'Failed' })
    }

    // Test 3: FormData POST to test-post
    try {
      const formData = new FormData()
      formData.append('test', 'value')
      const res = await fetch('/api/test-post', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      addResult('POST /api/test-post (FormData)', { status: res.status, data })
    } catch (error) {
      addResult('POST /api/test-post (FormData)', { error: error instanceof Error ? error.message : 'Failed' })
    }

    // Test 4: GET to photo-grids
    try {
      const res = await fetch('/api/photo-grids')
      const data = await res.json()
      addResult('GET /api/photo-grids', { status: res.status, data: data.error || 'Success' })
    } catch (error) {
      addResult('GET /api/photo-grids', { error: error instanceof Error ? error.message : 'Failed' })
    }

    // Test 5: POST to photo-grids with minimal data
    try {
      const formData = new FormData()
      formData.append('site_id', 'test')
      formData.append('component_name', 'test')
      formData.append('work_process', 'test')
      formData.append('work_section', 'test')
      formData.append('work_date', '2024-01-01')
      
      const res = await fetch('/api/photo-grids', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      addResult('POST /api/photo-grids', { status: res.status, data: data.error || 'Success' })
    } catch (error) {
      addResult('POST /api/photo-grids', { error: error instanceof Error ? error.message : 'Failed' })
    }

    // Test 6: OPTIONS to photo-grids
    try {
      const res = await fetch('/api/photo-grids', {
        method: 'OPTIONS'
      })
      addResult('OPTIONS /api/photo-grids', { 
        status: res.status, 
        headers: {
          'Access-Control-Allow-Origin': res.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': res.headers.get('Access-Control-Allow-Methods')
        }
      })
    } catch (error) {
      addResult('OPTIONS /api/photo-grids', { error: error instanceof Error ? error.message : 'Failed' })
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border p-4 rounded">
                <h3 className="font-bold mb-2">{result.test}</h3>
                <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {results.length === 0 && !loading && (
            <p className="text-gray-500">Click "Run All Tests" to begin testing API endpoints</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}