'use client'

import { useState } from 'react'

export default function TestWorkersPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runGetTest = async () => {
    setLoading(true)
    console.log('Running GET test...')
    
    try {
      const response = await fetch('/api/test/workers', {
        cache: 'no-store'
      })
      const data = await response.json()
      console.log('GET test result:', data)
      setTestResults(prev => ({
        ...prev,
        get: data
      }))
    } catch (error) {
      console.error('GET test error:', error)
      setTestResults(prev => ({
        ...prev,
        get: { error: error instanceof Error ? error.message : 'Failed' }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runPostTest = async () => {
    setLoading(true)
    console.log('Running POST test...')
    
    try {
      const response = await fetch('/api/test/workers', {
        method: 'POST',
        cache: 'no-store'
      })
      const data = await response.json()
      console.log('POST test result:', data)
      setTestResults(prev => ({
        ...prev,
        post: data
      }))
    } catch (error) {
      console.error('POST test error:', error)
      setTestResults(prev => ({
        ...prev,
        post: { error: error instanceof Error ? error.message : 'Failed' }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runDebugTest = async () => {
    setLoading(true)
    console.log('Running debug test...')
    
    try {
      const response = await fetch('/api/debug/workers', {
        cache: 'no-store'
      })
      const data = await response.json()
      console.log('Debug test result:', data)
      setTestResults(prev => ({
        ...prev,
        debug: data
      }))
    } catch (error) {
      console.error('Debug test error:', error)
      setTestResults(prev => ({
        ...prev,
        debug: { error: error instanceof Error ? error.message : 'Failed' }
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Worker Management Test Page</h1>
      
      <div className="mb-8 space-x-4">
        <button
          onClick={runGetTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test GET Workers
        </button>
        
        <button
          onClick={runPostTest}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test POST Worker
        </button>
        
        <button
          onClick={runDebugTest}
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Run Debug Check
        </button>
        
        <button
          onClick={() => setTestResults(null)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Console Output</h2>
        <p className="text-sm text-gray-600 mb-4">
          Open browser console (F12) to see detailed logs
        </p>
      </div>

      {testResults && (
        <div className="mt-8 space-y-6">
          {testResults.get && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">GET Test Results</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(testResults.get, null, 2)}
              </pre>
            </div>
          )}
          
          {testResults.post && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-600">POST Test Results</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(testResults.post, null, 2)}
              </pre>
            </div>
          )}
          
          {testResults.debug && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-yellow-600">Debug Check Results</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(testResults.debug, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}