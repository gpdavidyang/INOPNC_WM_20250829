import { createServiceClient } from './lib/supabase/service'

async function debugPhotoSheets() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('photo_sheets').select('*').limit(1)

  if (error) {
    console.error('Error fetching photo_sheets:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in photo_sheets:', Object.keys(data[0]))
    console.log('Sample row:', data[0])
  } else {
    console.log('No data found in photo_sheets')
  }
}

debugPhotoSheets()
