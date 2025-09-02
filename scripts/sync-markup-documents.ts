import { createClient } from '@supabase/supabase-js'

/**
 * 기존 마킹 문서를 unified_document_system에 동기화하는 스크립트
 */
async function syncMarkupDocuments() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🔄 Starting markup documents sync...')

    // 기존 마킹 문서 조회
    const { data: markupDocs, error: fetchError } = await supabase
      .from('markup_documents')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch markup documents: ${fetchError.message}`)
    }

    if (!markupDocs || markupDocs.length === 0) {
      console.log('✅ No markup documents found to sync')
      return
    }

    console.log(`📋 Found ${markupDocs.length} markup documents to sync`)

    let syncedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const doc of markupDocs) {
      try {
        // 이미 동기화된 문서인지 확인
        const { data: existingUnified } = await supabase
          .from('unified_document_system')
          .select('id')
          .eq('metadata->>source_table', 'markup_documents')
          .eq('metadata->>source_id', doc.id)
          .single()

        if (existingUnified) {
          skippedCount++
          continue
        }

        // unified_document_system에 추가
        const { error: insertError } = await supabase
          .from('unified_document_system')
          .insert({
            title: doc.title,
            description: doc.description,
            file_name: `${doc.title}.markup`,
            file_url: `/api/markup-documents/${doc.id}/file`,
            file_size: doc.file_size || 0,
            mime_type: 'application/markup-document',
            category_type: 'markup',
            uploaded_by: doc.created_by,
            site_id: doc.site_id,
            status: 'uploaded',
            is_public: false,
            created_at: doc.created_at,
            updated_at: doc.updated_at || doc.created_at,
            metadata: {
              source_table: 'markup_documents',
              source_id: doc.id,
              markup_count: doc.markup_count || 0,
              original_blueprint_url: doc.original_blueprint_url,
              original_blueprint_filename: doc.original_blueprint_filename
            }
          })

        if (insertError) {
          console.error(`❌ Failed to sync document ${doc.id}: ${insertError.message}`)
          errorCount++
        } else {
          syncedCount++
          console.log(`✅ Synced: ${doc.title}`)
        }
      } catch (docError) {
        console.error(`❌ Error processing document ${doc.id}:`, docError)
        errorCount++
      }
    }

    console.log('🎉 Sync completed!')
    console.log(`📊 Results:`)
    console.log(`  - Synced: ${syncedCount}`)
    console.log(`  - Skipped (already exists): ${skippedCount}`)
    console.log(`  - Errors: ${errorCount}`)

  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  syncMarkupDocuments().then(() => {
    console.log('✨ Script completed')
    process.exit(0)
  }).catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

export { syncMarkupDocuments }