'use server'

import { createClient } from '@/lib/supabase/server'

export interface SiteDocument {
  id: string
  site_id: string
  document_type: 'ptw' | 'blueprint' | 'other'
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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
 * Get both PTW and blueprint documents for a site
 */
export async function getSiteDocumentsPTWAndBlueprint(siteId: string) {
  try {
    const [ptwResult, blueprintResult] = await Promise.all([
      getSitePTWDocument(siteId),
      getSiteBlueprintDocument(siteId)
    ])

    return {
      success: true,
      data: {
        ptw_document: ptwResult.data,
        blueprint_document: blueprintResult.data
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