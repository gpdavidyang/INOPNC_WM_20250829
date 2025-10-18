#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Lightweight .env loader to support .env.local when running via tsx
function loadLocalEnv() {
  const files = ['.env.local', '.env']
  for (const f of files) {
    const p = resolve(process.cwd(), f)
    if (!existsSync(p)) continue
    const raw = readFileSync(p, 'utf8')
    raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .forEach(line => {
        const eq = line.indexOf('=')
        if (eq > 0) {
          const k = line.slice(0, eq).trim()
          const v = line
            .slice(eq + 1)
            .trim()
            .replace(/^"|"$/g, '')
          if (!process.env[k]) process.env[k] = v
        }
      })
  }
}
loadLocalEnv()

function env(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL')
const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function ensureMasters() {
  await supabase.from('materials').upsert(
    [
      { code: 'NPC-1000', name: 'NPC-1000', unit: 'ea', is_active: true },
      { code: 'NPC-9000', name: 'NPC-9000', unit: 'ea', is_active: true },
    ] as any,
    { onConflict: 'code' }
  )
  const { data: mats, error: matsErr } = await supabase
    .from('materials')
    .select('id, code')
    .in('code', ['NPC-1000', 'NPC-9000'])
  if (matsErr) throw matsErr
  if (!mats || mats.length === 0) throw new Error('No materials available')

  await supabase.from('payment_methods').upsert(
    [
      { name: '즉시청구', is_active: true, sort_order: 1 },
      { name: '월말청구', is_active: true, sort_order: 2 },
      { name: '택배', is_active: true, sort_order: 1 },
      { name: '화물', is_active: true, sort_order: 2 },
      { name: '직접', is_active: true, sort_order: 3 },
      { name: '선불', is_active: true, sort_order: 1 },
      { name: '착불', is_active: true, sort_order: 2 },
    ] as any,
    { onConflict: 'name' }
  )
  const { data: methods, error: methodsErr } = await supabase
    .from('payment_methods')
    .select('id, name')
    .in('name', ['즉시청구', '월말청구', '택배', '화물', '직접', '선불', '착불'])
  if (methodsErr) throw methodsErr

  const idFor = (n: string) => (methods || []).find((m: any) => m.name === n)?.id as string

  return {
    mats: mats.map((m: any) => m.id as string),
    billingNow: idFor('즉시청구'),
    billingMonthly: idFor('월말청구'),
    shipCourier: idFor('택배'),
    shipFreight: idFor('화물'),
    shipDirect: idFor('직접'),
    payPre: idFor('선불'),
    payCollect: idFor('착불'),
  }
}

async function ensureSites(): Promise<string[]> {
  const { data: anySites } = await supabase
    .from('sites')
    .select('id')
    .eq('is_deleted', false)
    .limit(3)
  if (anySites && anySites.length > 0) return anySites.map((s: any) => s.id as string)
  const wanted = ['은평 한옥마을', '성수 오피스 리모델링']
  const created: string[] = []
  for (const name of wanted) {
    const { data } = await supabase
      .from('sites')
      .insert({ name, is_deleted: false } as any)
      .select('id')
      .single()
    if (data?.id) created.push(data.id as string)
  }
  return created
}

async function main() {
  const arg = process.argv[2]
  const count = Math.max(1, Math.min(20, parseInt(arg || '3', 10) || 3))
  const {
    mats,
    billingNow,
    billingMonthly,
    shipCourier,
    shipFreight,
    shipDirect,
    payPre,
    payCollect,
  } = await ensureMasters()
  const siteIds = await ensureSites()
  if (siteIds.length === 0) throw new Error('No sites available')

  const candidates = [
    { billing: billingNow, shipping: shipCourier, freight: payPre },
    { billing: billingMonthly, shipping: shipFreight, freight: payCollect },
    { billing: billingNow, shipping: shipDirect, freight: payPre },
  ]

  const created: string[] = []
  for (let i = 0; i < count; i++) {
    const site_id = siteIds[i % siteIds.length]
    const methods = candidates[i % candidates.length]
    const material_id = mats[i % mats.length]
    const quantity = rnd(10, 120)
    const total_amount = quantity * 10000
    const { data: shipment, error: shipErr } = await supabase
      .from('material_shipments')
      .insert({
        site_id,
        status: i % 2 === 0 ? 'delivered' : 'preparing',
        shipment_date: todayISO(),
        billing_method_id: methods.billing,
        shipping_method_id: methods.shipping,
        freight_charge_method_id: methods.freight,
        total_amount,
      } as any)
      .select('id')
      .single()
    if (shipErr) throw shipErr
    const { error: itemErr } = await supabase.from('shipment_items').insert({
      shipment_id: (shipment as any).id,
      material_id,
      quantity,
      unit_price: null,
      total_price: null,
    } as any)
    if (itemErr) throw itemErr
    created.push((shipment as any).id)
  }
  console.log(JSON.stringify({ success: true, created }))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
