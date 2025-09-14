import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'configs': {
        const configsResult = await getBackupConfigs()
        return NextResponse.json(configsResult)
      }
      case 'jobs': {
        const configId = searchParams.get('configId')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        const jobsResult = await getBackupJobs(configId || undefined, limit)
        return NextResponse.json(jobsResult)
      }
      case 'stats': {
        const statsResult = await getBackupStats()
        return NextResponse.json(statsResult)
      }
      case 'service-health': {
        // Check if backup service is running
        try {
          const servicePort = process.env.BACKUP_SERVICE_PORT || 3001
          const response = await fetch(`http://localhost:${servicePort}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (response.ok) {
            const health = await response.json()
            return NextResponse.json({ success: true, data: health })
          } else {
            return NextResponse.json({ 
              success: false, 
              error: 'Backup service is not responding' 
            })
          }
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Backup service is not running' 
          })
        }
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logError(error, 'GET /api/backup')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof AppError ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()

    switch (action) {
      case 'create-config': {
        const createResult = await createBackupConfig(body)
        return NextResponse.json(createResult)
      }
      case 'execute': {
        const configId = body.configId
        if (!configId) {
          return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
        }
        
        const executeResult = await executeManualBackup(configId)
        return NextResponse.json(executeResult)
      }
      case 'start-service': {
        // Start backup service (this would typically be done via process management)
        return NextResponse.json({ 
          success: false, 
          error: 'Service management not implemented via API. Use process manager.' 
        })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logError(error, 'POST /api/backup')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof AppError ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')
    
    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const updateResult = await updateBackupConfig(configId, body)
    
    return NextResponse.json(updateResult)
  } catch (error) {
    logError(error, 'PUT /api/backup')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof AppError ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'config': {
        const deleteResult = await deleteBackupConfig(id)
        return NextResponse.json(deleteResult)
      }
      case 'cancel-job': {
        const cancelResult = await cancelBackupJob(id)
        return NextResponse.json(cancelResult)
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logError(error, 'DELETE /api/backup')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof AppError ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
