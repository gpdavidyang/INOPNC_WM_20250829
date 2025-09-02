'use server'

import { createClient } from '@/lib/supabase/server'

export interface SiteDocument {
  id: string
  site_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  title?: string
}

/**
 * Fetch site documents by site ID and document type
 */
export async function getSiteDocuments(siteId: string, documentType?: 'ptw' | 'blueprint' | 'other') {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('documents')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching site documents:', error)
      return { success: false, error: error.message, data: null }
    }

    // Convert documents table format to SiteDocument format
    const siteDocuments = data?.map((doc: any) => ({
      id: doc.id,
      site_id: doc.site_id,
      document_type: doc.document_type,
      file_name: doc.file_name,
      file_url: doc.file_url,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      is_active: true, // documents table doesn't have is_active, assume true
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      title: doc.title // Additional field from documents table
    })) || []

    return { success: true, data: siteDocuments as SiteDocument[], error: null }
  } catch (error) {
    console.error('Server error fetching site documents:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}

/**
 * Get the active PTW document for a site
 */
export async function getSitePTWDocument(siteId: string) {
  try {
    const result = await getSiteDocuments(siteId, 'ptw')
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error, data: null }
    }

    // Return the most recent active PTW document
    const ptwDocument = result.data[0] || null

    return { success: true, data: ptwDocument, error: null }
  } catch (error) {
    console.error('Server error fetching PTW document:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}

/**
 * Get the active blueprint document for a site
 */
export async function getSiteBlueprintDocument(siteId: string) {
  try {
    const result = await getSiteDocuments(siteId, 'blueprint')
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error, data: null }
    }

    // Return the most recent active blueprint document
    const blueprintDocument = result.data[0] || null

    return { success: true, data: blueprintDocument, error: null }
  } catch (error) {
    console.error('Server error fetching blueprint document:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}

/**
 * Get both PTW and blueprint documents for a site from documents table
 */
export async function getSiteDocumentsPTWAndBlueprint(siteId: string) {
  try {
    const supabase = createClient()
    
    // Fetch PTW and blueprint documents from documents table
    // Look for documents with title containing 'PTW' or '작업허가서' for PTW
    // and '도면' or 'blueprint' for blueprints
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return {
        success: true,
        data: {
          ptw_document: null,
          blueprint_document: null
        },
        error: null
      }
    }

    // Find PTW and blueprint documents
    let ptwDocument = null
    let blueprintDocument = null

    if (documents && documents.length > 0) {
      // Find PTW document (작업허가서 or PTW in title or certificate type with PTW)
      const ptwDoc = documents.find((doc: any) => 
        doc.title?.includes('PTW') || 
        doc.title?.includes('작업허가서') ||
        doc.document_type === 'ptw' ||
        (doc.document_type === 'certificate' && (doc.title?.includes('PTW') || doc.title?.includes('작업허가서')))
      )

      // Find blueprint document (도면 in title or document_type)
      const blueprintDoc = documents.find((doc: any) => 
        doc.title?.includes('도면') || 
        doc.title?.includes('공도면') ||
        doc.title?.includes('blueprint') ||
        doc.document_type === 'blueprint' ||
        doc.document_type === 'drawing'
      )

      if (ptwDoc) {
        ptwDocument = {
          id: ptwDoc.id,
          site_id: ptwDoc.site_id,
          document_type: 'ptw',
          file_name: ptwDoc.file_name,
          file_url: ptwDoc.file_url,
          file_size: ptwDoc.file_size,
          mime_type: ptwDoc.mime_type,
          is_active: true,
          created_at: ptwDoc.created_at,
          updated_at: ptwDoc.updated_at || ptwDoc.created_at,
          title: ptwDoc.title || ptwDoc.file_name
        }
      }

      if (blueprintDoc) {
        blueprintDocument = {
          id: blueprintDoc.id,
          site_id: blueprintDoc.site_id,
          document_type: 'blueprint',
          file_name: blueprintDoc.file_name,
          file_url: blueprintDoc.file_url,
          file_size: blueprintDoc.file_size,
          mime_type: blueprintDoc.mime_type,
          is_active: true,
          created_at: blueprintDoc.created_at,
          updated_at: blueprintDoc.updated_at || blueprintDoc.created_at,
          title: blueprintDoc.title || blueprintDoc.file_name
        }
      }
    }

    console.log('[Site Documents] Fetched documents for site:', siteId, {
      hasPTW: !!ptwDocument,
      hasBlueprint: !!blueprintDocument,
      totalDocs: documents?.length || 0
    })

    return {
      success: true,
      data: {
        ptw_document: ptwDocument,
        blueprint_document: blueprintDocument
      },
      error: null
    }
  } catch (error) {
    console.error('Server error fetching site documents:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}