const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Image directories
const beforeDir = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/사진대지용_사진데이터/photos_before_work'
const afterDir = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/사진대지용_사진데이터/photos_after_work'

async function uploadImages() {
  try {
    // Upload all before images
    const beforeFiles = fs.readdirSync(beforeDir).filter(f => f.endsWith('.png'))
    for (const file of beforeFiles) {
      const filePath = path.join(beforeDir, file)
      const fileContent = fs.readFileSync(filePath)
      
      console.log(`Uploading ${file}...`)
      const { data, error } = await supabase.storage
        .from('photo-grids')
        .upload(file, fileContent, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (error) {
        console.error(`Error uploading ${file}:`, error.message)
      } else {
        console.log(`Successfully uploaded ${file}`)
      }
    }

    // Upload all after images
    const afterFiles = fs.readdirSync(afterDir).filter(f => f.endsWith('.png'))
    for (const file of afterFiles) {
      const filePath = path.join(afterDir, file)
      const fileContent = fs.readFileSync(filePath)
      
      console.log(`Uploading ${file}...`)
      const { data, error } = await supabase.storage
        .from('photo-grids')
        .upload(file, fileContent, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (error) {
        console.error(`Error uploading ${file}:`, error.message)
      } else {
        console.log(`Successfully uploaded ${file}`)
      }
    }

    // Create placeholder images
    console.log('Creating placeholder images...')
    
    // Create a simple placeholder image (1x1 transparent PNG)
    const placeholderData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    
    await supabase.storage
      .from('photo-grids')
      .upload('placeholder-before.jpg', placeholderData, {
        contentType: 'image/png',
        upsert: true
      })
    
    await supabase.storage
      .from('photo-grids')
      .upload('placeholder-after.jpg', placeholderData, {
        contentType: 'image/png',
        upsert: true
      })

    console.log('Upload complete!')

    // Now update the photo_grids table with correct URLs
    console.log('Updating photo_grids table with correct URLs...')
    
    const { data: photoGrids } = await supabase
      .from('photo_grids')
      .select('id, before_photo_url, after_photo_url')
    
    for (const grid of photoGrids || []) {
      let updates = {}
      
      // Fix before_photo_url
      if (grid.before_photo_url && !grid.before_photo_url.startsWith('http')) {
        const filename = grid.before_photo_url.replace(/^\//, '')
        updates.before_photo_url = `${supabaseUrl}/storage/v1/object/public/photo-grids/${filename}`
      }
      
      // Fix after_photo_url
      if (grid.after_photo_url && !grid.after_photo_url.startsWith('http')) {
        const filename = grid.after_photo_url.replace(/^\//, '')
        updates.after_photo_url = `${supabaseUrl}/storage/v1/object/public/photo-grids/${filename}`
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('photo_grids')
          .update(updates)
          .eq('id', grid.id)
        
        if (error) {
          console.error(`Error updating grid ${grid.id}:`, error)
        } else {
          console.log(`Updated URLs for grid ${grid.id}`)
        }
      }
    }

    console.log('All done!')
  } catch (error) {
    console.error('Error:', error)
  }
}

uploadImages()