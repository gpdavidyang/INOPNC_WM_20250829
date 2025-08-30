import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Environment variables to check
    const envVars = {
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Site Configuration
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      
      // VAPID Keys
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
      VAPID_SUBJECT: process.env.VAPID_SUBJECT,
      
      // Runtime Environment
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    const status = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      variables: {} as Record<string, any>
    }

    // Check each environment variable
    Object.entries(envVars).forEach(([key, value]) => {
      const varStatus = {
        exists: !!value,
        length: value?.length || 0,
        type: typeof value,
        preview: '',
        isValid: false,
        errors: [] as string[]
      }

      if (value) {
        // Show preview (truncated for security)
        if (key.includes('KEY') || key.includes('SECRET')) {
          varStatus.preview = `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
        } else if (key.includes('URL')) {
          varStatus.preview = value
        } else {
          varStatus.preview = value.length > 50 ? `${value.substring(0, 50)}...` : value
        }

        // Validate based on type
        switch (key) {
          case 'NEXT_PUBLIC_SUPABASE_URL':
            try {
              const url = new URL(value)
              varStatus.isValid = url.hostname.includes('supabase.co')
              if (!varStatus.isValid) {
                varStatus.errors.push('URL does not appear to be a Supabase URL')
              }
            } catch {
              varStatus.errors.push('Invalid URL format')
            }
            break
          
          case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
          case 'SUPABASE_SERVICE_ROLE_KEY':
            varStatus.isValid = value.length > 100 && value.includes('.')
            if (!varStatus.isValid) {
              varStatus.errors.push('Key appears to be invalid (too short or wrong format)')
            }
            break
          
          case 'NEXT_PUBLIC_SITE_URL':
            try {
              new URL(value)
              varStatus.isValid = true
            } catch {
              varStatus.errors.push('Invalid URL format')
            }
            break
          
          case 'VAPID_SUBJECT':
            varStatus.isValid = value.startsWith('mailto:') && value.includes('@')
            if (!varStatus.isValid) {
              varStatus.errors.push('Should be in format: mailto:email@domain.com')
            }
            break
          
          default:
            varStatus.isValid = true
        }
      } else {
        varStatus.errors.push('Environment variable is missing or empty')
      }

      status.variables[key] = varStatus
    })

    // Overall health check
    const criticalVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missingCritical = criticalVars.filter(key => !status.variables[key]?.exists)
    const invalidCritical = criticalVars.filter(key => 
      status.variables[key]?.exists && !status.variables[key]?.isValid
    )

    const overallStatus = {
      healthy: missingCritical.length === 0 && invalidCritical.length === 0,
      missingCritical,
      invalidCritical,
      totalVariables: Object.keys(envVars).length,
      validVariables: Object.values(status.variables).filter(v => v.isValid).length
    }

    return NextResponse.json({
      success: true,
      ...status,
      overall: overallStatus
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}