'use server'


export async function uploadPhotoToStorage(formData: FormData) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const file = formData.get('file') as File
    const entity_type = formData.get('entity_type') as string
    const entity_id = formData.get('entity_id') as string
    const file_type = formData.get('file_type') as string || 'photo'

    if (!file || !entity_type || !entity_id) {
      return { success: false, error: 'Missing required fields' }
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${entity_type}/${entity_id}/${file_type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: 'Failed to upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')  
      .getPublicUrl(fileName)

    // For now, we'll just return the URL without saving to database
    // In a full implementation, you'd save this to a documents or attachments table
    console.log(`File uploaded successfully: ${publicUrl}`)

    return { 
      success: true, 
      data: {
        file_path: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      }
    }
  } catch (error) {
    console.error('Error in uploadPhotoToStorage:', error)
    return { success: false, error: 'Failed to upload file' }
  }
}