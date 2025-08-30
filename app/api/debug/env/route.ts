import { NextRequest, NextResponse } from 'next/server'

interface EnvDebugInfo {
  timestamp: string
  environment: string
  vercelUrl?: string
  deploymentUrl?: string
  envVars: {
    [key: string]: {
      exists: boolean
      length?: number
      preview?: string
      isValid?: boolean
    }
  }
  nodeEnv: string
  vercelEnv?: string
}

export async function GET(request: NextRequest) {
  try {
    const envKeys = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'VAPID_SUBJECT',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY'
    ]
    
    const envVars: EnvDebugInfo['envVars'] = {}
    
    for (const key of envKeys) {
      const value = process.env[key]
      const exists = !!value
      const length = value?.length || 0
      const preview = value ? `${value.substring(0, 10)}...` : undefined
      
      // Basic validation
      let isValid = exists
      if (key.includes('SUPABASE_URL')) {
        isValid = exists && value!.includes('supabase.co')
      } else if (key.includes('KEY')) {
        isValid = exists && length > 20
      }
      
      envVars[key] = {
        exists,
        length: exists ? length : undefined,
        preview,
        isValid
      }
    }
    
    const debugInfo: EnvDebugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL,
      deploymentUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      envVars,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV
    }
    
    // Additional Vercel-specific debugging
    if (process.env.VERCEL) {
      debugInfo.deploymentUrl = process.env.VERCEL_URL
    }
    
    return NextResponse.json({
      status: 'debug-info',
      data: debugInfo
    })
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}