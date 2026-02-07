import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function checkDuplicates() {
  const { data: types, error } = await supabase.from('required_document_types').select('*')
  if (error) {
    console.error(error)
    return
  }

  const nameMap = new Map()
  types.forEach(t => {
    const name = t.name_ko.replace(/\s+/g, '')
    if (!nameMap.has(name)) {
      nameMap.set(name, [])
    }
    nameMap.get(name).push(t)
  })

  console.log('--- Duplicates Found ---')
  nameMap.forEach((list, name) => {
    if (list.length > 1) {
      console.log(`Duplicate: ${name}`)
      list.forEach(t => console.log(`  - ID: ${t.id}, Name: ${t.name_ko}, Code: ${t.code}`))
    }
  })
}
checkDuplicates()
