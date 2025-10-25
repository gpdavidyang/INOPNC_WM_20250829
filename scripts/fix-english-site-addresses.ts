/*
  Fix site addresses that are in English by replacing them with plausible Korean addresses.

  Detection rule:
    - Address is non-empty
    - Address does NOT contain any Korean Hangul characters (/[가-힣]/)

  Generation:
    - Randomly pick from predefined Korean city/district/neighborhood lists
    - Compose as: "{도시} {구} {동} {번지}" (e.g., "서울특별시 강남구 역삼동 123-45")

  Usage:
    tsx scripts/fix-english-site-addresses.ts [--dry-run]

  Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY must be set.
*/
/* eslint-disable no-console */
import 'dotenv/config'
import process from 'node:process'
import { createServiceClient } from '@/lib/supabase/service'

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    args[k] = v === undefined ? true : v
  }
  const dryRun = Boolean(args['dry-run'] || args.dry || false)
  return { dryRun }
}

function containsHangul(s: string): boolean {
  return /[가-힣]/.test(s)
}

const CITIES = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]

const DISTRICTS = [
  '강남구',
  '서초구',
  '송파구',
  '마포구',
  '성동구',
  '용산구',
  '중구',
  '동구',
  '서구',
  '남구',
  '북구',
  '수성구',
  '달서구',
  '연수구',
  '남동구',
  '해운대구',
]

const NEIGHBORHOODS = [
  '역삼동',
  '삼성동',
  '논현동',
  '대치동',
  '압구정동',
  '청담동',
  '중동',
  '연수동',
  '용호동',
  '수성동',
  '선화동',
  '대흥동',
  '봉선동',
  '만덕동',
  '구월동',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateKoreanAddress(): string {
  const city = pick(CITIES)
  const district = pick(DISTRICTS)
  const neighborhood = pick(NEIGHBORHOODS)
  const main = Math.floor(Math.random() * 200) + 1
  const sub = Math.random() < 0.6 ? `-${Math.floor(Math.random() * 90) + 1}` : ''
  return `${city} ${district} ${neighborhood} ${main}${sub}`
}

async function main() {
  const { dryRun } = parseArgs(process.argv)

  const supabase = createServiceClient()

  const { data: sites, error } = await supabase.from('sites').select('id, name, address')

  if (error) {
    console.error('Failed to fetch sites:', error)
    process.exit(1)
  }

  const targets = (sites || []).filter(
    (s: any) => !!s.address && !containsHangul(String(s.address))
  )

  console.log(`Found ${targets.length} sites with English addresses.`)

  const preview = targets.slice(0, 10).map((s: any) => ({
    id: s.id,
    name: s.name,
    old: s.address,
    new: generateKoreanAddress(),
  }))
  console.table(preview)

  if (dryRun) {
    console.log('Dry-run mode: No updates were performed.')
    process.exit(0)
  }

  let updated = 0
  for (const site of targets) {
    const newAddress = generateKoreanAddress()
    const { error: upErr } = await supabase
      .from('sites')
      .update({ address: newAddress })
      .eq('id', site.id)

    if (upErr) {
      console.error(`Failed to update site ${site.id}:`, upErr)
      continue
    }
    updated += 1
    if (updated % 50 === 0) console.log(`Updated ${updated} sites...`)
  }

  console.log(`Done. Updated ${updated} site addresses.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
