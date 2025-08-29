import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('Starting migration application...')
    
    // Create site_documents table
    const createTableQuery = `
      -- Create site_documents table for PTW and blueprint documents
      CREATE TABLE IF NOT EXISTS public.site_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ptw', 'blueprint', 'safety', 'permit', 'other')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        document_number VARCHAR(100),
        valid_from DATE,
        valid_until DATE,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'draft')),
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        version INTEGER DEFAULT 1,
        is_current BOOLEAN DEFAULT true
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableQuery })
    
    if (createError) {
      console.error('Create table error:', createError)
      // Try alternative approach with direct query
      const { error: directError } = await supabase
        .from('site_documents')
        .select('id')
        .limit(1)
      
      if (directError && directError.code === '42P01') {
        // Table doesn't exist, we need to create it differently
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot create table via RPC', 
          details: createError 
        })
      }
    }
    
    // Create indexes
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_site_documents_site_id ON public.site_documents(site_id);",
      "CREATE INDEX IF NOT EXISTS idx_site_documents_type ON public.site_documents(document_type);",
      "CREATE INDEX IF NOT EXISTS idx_site_documents_status ON public.site_documents(status);",
      "CREATE INDEX IF NOT EXISTS idx_site_documents_current ON public.site_documents(is_current) WHERE is_current = true;"
    ]
    
    for (const indexQuery of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexQuery })
      if (error) console.log('Index creation (non-fatal):', error)
    }
    
    // Insert sample documents
    const { error: insertError } = await supabase
      .from('site_documents')
      .insert([
        {
          site_id: '55386936-56b0-465e-bcc2-8313db735ca9', // 강남 A현장 ID from logs
          document_type: 'ptw',
          title: 'PTW-2025-0822 작업허가서',
          description: '지하 1층 슬라브 타설 작업 허가서',
          file_url: '/documents/ptw/PTW-2025-0822.pdf',
          file_name: 'PTW-2025-0822.pdf',
          document_number: 'PTW-2025-0822'
        },
        {
          site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
          document_type: 'blueprint',
          title: '강남 A현장 구조도면',
          description: '지하 1층 구조 설계도면 (기둥 C1-C5 구간)',
          file_url: '/documents/blueprints/gangnam-a-b1-structure.pdf',
          file_name: 'gangnam-a-b1-structure.pdf',
          document_number: 'BP-GA-B1-001'
        }
      ])
    
    if (insertError) {
      console.error('Insert error:', insertError)
    }
    
    // Check if documents were created
    const { data: documents, error: selectError } = await supabase
      .from('site_documents')
      .select('*')
      .eq('site_id', '55386936-56b0-465e-bcc2-8313db735ca9')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration applied successfully',
      documentsCreated: documents?.length || 0,
      documents
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}