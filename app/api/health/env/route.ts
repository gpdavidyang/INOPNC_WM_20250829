import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EnvironmentCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  value?: string
  error?: string
  details?: any
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  environment: string
  checks: EnvironmentCheck[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: EnvironmentCheck[] = []
  
  try {
    // 1. Environment Variables Check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]
      if (!value) {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'fail',
          error: 'Environment variable not set'
        })
      } else if (value.length < 10) {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'fail',
          error: 'Environment variable too short (likely invalid)'
        })
      } else {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'pass',
          value: value.substring(0, 20) + '...' // Show first 20 chars for verification
        })
      }
    }
    
    // 2. Supabase URL Format Check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl)
        if (url.hostname.includes('supabase.co')) {
          checks.push({
            name: 'supabase_url_format',
            status: 'pass',
            value: url.hostname,
            details: { protocol: url.protocol, host: url.host }
          })
        } else {
          checks.push({
            name: 'supabase_url_format',
            status: 'warn',
            value: url.hostname,
            error: 'URL does not appear to be a Supabase URL'
          })
        }
      } catch (urlError) {
        checks.push({
          name: 'supabase_url_format',
          status: 'fail',
          error: `Invalid URL format: ${urlError.message}`
        })
      }
    }
    
    // 3. Supabase Connection Test
    try {
      const supabase = createClient()
      
      // Test basic auth connection
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        checks.push({
          name: 'supabase_auth_connection',
          status: 'fail',
          error: error.message,
          details: { code: error.status, name: error.name }
        })
      } else {
        checks.push({
          name: 'supabase_auth_connection',
          status: 'pass',
          details: { hasSession: !!data?.session }
        })
      }
    } catch (connectionError) {
      checks.push({
        name: 'supabase_auth_connection',
        status: 'fail',
        error: connectionError.message
      })
    }
    
    // 4. Database Connection Test
    try {
      const supabase = createClient()
      
      // Simple query to test database connection
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)
      
      if (error) {
        checks.push({
          name: 'database_connection',
          status: 'fail',
          error: error.message,
          details: { code: error.code, hint: error.hint }
        })
      } else {
        checks.push({
          name: 'database_connection',
          status: 'pass',
          details: { tablesFound: data?.length || 0 }
        })
      }
    } catch (dbError) {
      checks.push({
        name: 'database_connection',
        status: 'fail',
        error: dbError.message
      })
    }
    
    // 5. Critical Tables Existence Check
    const criticalTables = [
      'profiles',
      'sites', 
      'daily_reports',
      'attendance_records',
      'analytics_metrics',
      'push_subscriptions'
    ]
    
    try {
      const supabase = createClient()
      
      for (const tableName of criticalTables) {
        try {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .maybeSingle()
          
          if (error) {
            checks.push({
              name: `table_${tableName}`,
              status: 'fail',
              error: `Table check failed: ${error.message}`
            })
          } else if (!data) {
            checks.push({
              name: `table_${tableName}`,
              status: 'fail',
              error: 'Table does not exist'
            })
          } else {
            checks.push({
              name: `table_${tableName}`,
              status: 'pass'
            })
          }
        } catch (tableError) {
          checks.push({
            name: `table_${tableName}`,
            status: 'fail',
            error: `Exception checking table: ${tableError.message}`
          })
        }
      }
    } catch (tablesError) {
      checks.push({
        name: 'tables_check',
        status: 'fail',
        error: `Tables check failed: ${tablesError.message}`
      })
    }
    
    // 6. Network/DNS Resolution Test
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const url = new URL(supabaseUrl)
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
          method: 'GET',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          timeout: 5000 // 5 second timeout
        })
        
        if (response.ok) {
          checks.push({
            name: 'network_connectivity',
            status: 'pass',
            details: { 
              status: response.status, 
              statusText: response.statusText,
              responseTime: Date.now() - startTime + 'ms'
            }
          })
        } else {
          checks.push({
            name: 'network_connectivity',
            status: 'warn',
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: { status: response.status }
          })
        }
      }
    } catch (networkError) {
      checks.push({
        name: 'network_connectivity',
        status: 'fail',
        error: networkError.message,
        details: { type: 'network_error' }
      })
    }
    
    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warn').length
    }
    
    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (summary.failed === 0) {
      overallStatus = summary.warnings === 0 ? 'healthy' : 'degraded'
    } else if (summary.failed <= summary.passed) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'unhealthy'
    }
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks,
      summary
    }
    
    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(result, { status: httpStatus })
    
  } catch (error) {
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: [{
        name: 'health_check_execution',
        status: 'fail',
        error: error.message
      }],
      summary: { total: 1, passed: 0, failed: 1, warnings: 0 }
    }
    
    return NextResponse.json(errorResult, { status: 503 })
  }
}