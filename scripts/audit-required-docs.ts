import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase environment variables for audit script')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function auditRequiredDocuments() {
  console.log('🔍 Required Document Tables Audit\n')

  const [{ data: legacy, error: legacyError }, { data: unified, error: unifiedError }] =
    await Promise.all([
      supabase.from('document_requirements').select('*').order('requirement_name'),
      supabase.from('required_document_types').select('*').order('sort_order'),
    ])

  if (legacyError) {
    console.error('❌ Failed to read document_requirements:', legacyError)
  } else {
    console.log(`document_requirements rows: ${legacy?.length || 0}`)
  }

  if (unifiedError) {
    console.error('❌ Failed to read required_document_types:', unifiedError)
  } else {
    console.log(`required_document_types rows: ${unified?.length || 0}`)
  }

  const legacyCodes = new Set(
    (legacy || [])
      .map((row: any) => String(row.document_type || row.code || row.id))
      .filter(Boolean)
  )
  const unifiedCodes = new Set((unified || []).map((row: any) => String(row.code || row.id)))

  const missingInUnified = Array.from(legacyCodes).filter(code => !unifiedCodes.has(code))
  const missingInLegacy = Array.from(unifiedCodes).filter(code => !legacyCodes.has(code))

  console.log('\n📌 Code coverage')
  console.log(` - Legacy codes without unified match: ${missingInUnified.length}`)
  if (missingInUnified.length) {
    console.log(`   ${missingInUnified.join(', ')}`)
  }
  console.log(` - Unified codes without legacy match: ${missingInLegacy.length}`)
  if (missingInLegacy.length) {
    console.log(`   ${missingInLegacy.join(', ')}`)
  }

  const { data: submissions, error: submissionError } = await supabase
    .from('user_document_submissions')
    .select('id, user_id, requirement_id, submission_status')

  if (submissionError) {
    console.error('\n❌ Failed to read user_document_submissions:', submissionError)
  } else {
    console.log(`\nuser_document_submissions rows: ${submissions?.length || 0}`)
    const unknownRequirementSubs = (submissions || []).filter(
      (row: any) => row.requirement_id && !unifiedCodes.has(String(row.requirement_id))
    )
    console.log(
      ` - Submissions referencing unknown requirement_id: ${unknownRequirementSubs.length}`
    )
    if (unknownRequirementSubs.length) {
      console.log(
        `   Example IDs: ${unknownRequirementSubs
          .slice(0, 5)
          .map(r => `${r.id}:${r.requirement_id}`)
          .join(', ')}`
      )
    }
  }

  console.log('\n✅ Audit complete')
}

auditRequiredDocuments().catch(error => {
  console.error('Audit failed:', error)
  process.exitCode = 1
})
