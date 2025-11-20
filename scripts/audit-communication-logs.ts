import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase environment variables for communication audit')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function auditCommunicationLogs() {
  console.log('🔍 Communication Dispatch & Log Audit\n')

  const [{ data: dispatches, error: dispatchError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from('announcement_dispatches')
        .select('id, announcement_id, dispatch_batch_id, dispatched_count, failed_count, status'),
      supabase
        .from('notification_logs')
        .select('id, dispatch_id, dispatch_batch_id, announcement_id, status'),
    ])

  if (dispatchError) {
    console.error('❌ Failed to read announcement_dispatches:', dispatchError)
    return
  }

  if (logsError) {
    console.error('❌ Failed to read notification_logs:', logsError)
    return
  }

  console.log(`dispatch rows: ${dispatches?.length || 0}`)
  console.log(`notification_logs rows: ${logs?.length || 0}`)

  const dispatchMap = new Map<string, any>()
  for (const row of dispatches || []) {
    dispatchMap.set(row.id, row)
  }

  const orphanLogs = (logs || []).filter(
    log => log.dispatch_id && !dispatchMap.has(log.dispatch_id)
  )
  console.log(`\n📌 Logs referencing unknown dispatch: ${orphanLogs.length}`)
  if (orphanLogs.length) {
    console.log(
      `   Sample: ${orphanLogs
        .slice(0, 5)
        .map(log => `${log.id}:${log.dispatch_id}`)
        .join(', ')}`
    )
  }

  const idleDispatches = (dispatches || []).filter(
    dispatch => dispatch.dispatched_count === 0 && dispatch.failed_count === 0
  )
  console.log(`\n📌 Dispatches without any deliveries recorded: ${idleDispatches.length}`)
  if (idleDispatches.length) {
    console.log(
      `   Sample: ${idleDispatches
        .slice(0, 5)
        .map(row => `${row.id}:${row.status}`)
        .join(', ')}`
    )
  }

  const batchGrouped = new Map<string, number>()
  for (const log of logs || []) {
    if (!log.dispatch_batch_id) continue
    batchGrouped.set(log.dispatch_batch_id, (batchGrouped.get(log.dispatch_batch_id) || 0) + 1)
  }

  const emptyBatches = Array.from(dispatches || []).filter(
    dispatch => dispatch.dispatch_batch_id && !(batchGrouped.get(dispatch.dispatch_batch_id) || 0)
  )

  console.log(`\n📌 Dispatch batches without logs: ${emptyBatches.length}`)

  console.log('\n✅ Communication audit complete')
}

auditCommunicationLogs().catch(error => {
  console.error('Audit failed:', error)
  process.exitCode = 1
})
