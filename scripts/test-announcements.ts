import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testAnnouncements() {
  console.log('🔍 Testing announcements table...\n')

  try {
    // 1. Check all announcements
    const { data: allData, error: allError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching all announcements:', allError)
    } else {
      console.log(`✅ Total announcements: ${allData?.length || 0}`)
    }

    // 2. Check active announcements
    const { data: activeData, error: activeError } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activeError) {
      console.error('❌ Error fetching active announcements:', activeError)
    } else {
      console.log(`✅ Active announcements: ${activeData?.length || 0}`)

      if (activeData && activeData.length > 0) {
        console.log('\n📋 Sample announcements:')
        activeData.slice(0, 3).forEach((item, idx) => {
          console.log(
            `  ${idx + 1}. [${item.priority || '일반'}] ${item.title}: ${item.content.substring(0, 50)}...`
          )
        })
      }
    }

    // 3. Test the exact query used in NoticeSection
    console.log('\n🧪 Testing NoticeSection query...')
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ NoticeSection query error:', error)
      console.error('   Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log(`✅ NoticeSection query successful: ${data?.length || 0} results`)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAnnouncements().catch(console.error)
