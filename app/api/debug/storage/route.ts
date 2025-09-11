import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('🔍 Storage Debug API called')
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      },
      auth: {
        isAuthenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message || null,
      },
      storage: {
        test: null,
        error: null,
      },
      database: {
        test: null,
        error: null,
      }
    }
    
    // Test storage access
    if (user) {
      try {
        // Try to list files in the documents bucket
        const { data: files, error: listError } = await supabase.storage
          .from('documents')
          .list(`documents/${user.id}`, {
            limit: 1,
          })
        
        debugInfo.storage.test = {
          canList: !listError,
          filesFound: files?.length || 0,
          error: listError?.message || null,
        }
        
        // Try a small test upload with a tiny text file
        const testFileName = `test_${Date.now()}.txt`
        const testContent = new TextEncoder().encode('Test upload from debug endpoint')
        const testPath = `documents/${user.id}/${testFileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(testPath, testContent, {
            contentType: 'text/plain',
            upsert: false,
          })
        
        if (uploadData) {
          // Clean up test file
          await supabase.storage
            .from('documents')
            .remove([testPath])
        }
        
        debugInfo.storage.upload = {
          success: !!uploadData,
          error: uploadError?.message || null,
          testPath,
        }
      } catch (storageError) {
        debugInfo.storage.error = storageError instanceof Error ? storageError.message : 'Unknown storage error'
      }
      
      // Test database access
      try {
        const { data: profile, error: dbError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()
        
        debugInfo.database.test = {
          canRead: !dbError,
          profile: profile ? { id: profile.id, role: profile.role } : null,
          error: dbError?.message || null,
        }
      } catch (dbError) {
        debugInfo.database.error = dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
    
  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}