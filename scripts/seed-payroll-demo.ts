/**
 * Payroll demo seed script (DY1117 plan)
 *
 * Generates a complete chain of data (organizations → sites → workers → work_records → salary snapshots).
 * Usage:
 *   npx tsx scripts/seed-payroll-demo.ts --months=2025-01..2025-11 --workers=10 --sites=5 [--reset]
 */

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type EmploymentType = 'regular_employee' | 'freelancer' | 'daily_worker'

interface SeedOptions {
  months: string[]
  workerCount: number
  siteCount: number
  seed: string
  reset: boolean
}

interface OrganizationRecord {
  id: string
  name: string
  slug: string
}

interface SiteRecord {
  id: string
  organization_id: string
  name: string
}

interface ProfileSeed {
  email: string
  fullName: string
  role: 'worker' | 'site_manager'
  organizationId: string
  siteId?: string | null
  employmentType?: EmploymentType
  dailyRate?: number
  hourlyRate?: number
  phone: string
}

type WorkerSeed = Omit<ProfileSeed, 'role'> & {
  employmentType: EmploymentType
  dailyRate: number
  hourlyRate: number
  siteId: string
}

interface WorkerProfileInfo {
  id: string
  email: string
  fullName: string
  siteId: string
  organizationId: string
  employmentType: EmploymentType
  dailyRate: number
  hourlyRate: number
}

interface SiteManagerInfo {
  id: string
  siteId: string
}

interface WorkerMonthSummary {
  workerId: string
  year: number
  month: number
  totalLaborHours: number
  totalWorkHours: number
  totalOvertimeHours: number
  workDates: Set<string>
  siteIds: Set<string>
}

const SEED_TAG = 'payroll-demo'
const WORKER_EMAIL_DOMAIN = 'seed.inopnc.com'
const DEFAULT_MONTHS = ['2025-01', '2025-02', '2025-03']
const EMPLOYMENT_CONFIG: Record<
  EmploymentType,
  {
    salaryLabel: string
    taxRate: number
    nationalPension: number
    healthInsurance: number
    employmentInsurance: number
  }
> = {
  regular_employee: {
    salaryLabel: '정규직',
    taxRate: 3.63, // 소득세 + 주민세
    nationalPension: 4.5,
    healthInsurance: 3.545,
    employmentInsurance: 0.9,
  },
  freelancer: {
    salaryLabel: '프리랜서',
    taxRate: 3.63,
    nationalPension: 0,
    healthInsurance: 0,
    employmentInsurance: 0,
  },
  daily_worker: {
    salaryLabel: '일용직',
    taxRate: 6.6,
    nationalPension: 0,
    healthInsurance: 0,
    employmentInsurance: 0,
  },
}

const ORG_PRESETS = [
  {
    slug: 'hq',
    name: 'PAYROLL DEMO 본사',
    address: '서울특별시 강남구 테헤란로 203',
    phone: '02-1234-1100',
  },
  {
    slug: 'south',
    name: 'PAYROLL DEMO 경남지사',
    address: '경상남도 창원시 의창구 충혼로 45',
    phone: '055-222-3300',
  },
  {
    slug: 'partner',
    name: 'PAYROLL DEMO 협력사',
    address: '부산광역시 해운대구 센텀서로 31',
    phone: '051-888-9900',
  },
]

function loadEnv() {
  const envFiles = ['.env.local', '.env.development.local', '.env.development', '.env']
  for (const file of envFiles) {
    const full = path.join(process.cwd(), file)
    if (fs.existsSync(full)) dotenv.config({ path: full })
  }
}

function parseArgs(argv: string[]): SeedOptions {
  const args: Record<string, string | boolean> = {}
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue
    const [key, value] = raw.replace(/^--/, '').split('=')
    args[key] = value === undefined ? true : value
  }

  const monthsArg = typeof args.months === 'string' ? String(args.months) : ''
  const months = parseMonths(monthsArg || '')
  const workerCount = Math.max(5, Number(args.workers || args.w || 10))
  const siteCount = Math.max(2, Number(args.sites || args.s || 4))
  const seed = typeof args.seed === 'string' ? args.seed : `${SEED_TAG}:${Date.now()}`
  const reset = Boolean(args.reset || false)

  return { months, workerCount, siteCount, seed, reset }
}

function parseMonths(input: string): string[] {
  if (!input) return DEFAULT_MONTHS
  if (input.includes('..')) {
    const [start, end] = input.split('..').map(s => s.trim())
    return expandRange(start, end)
  }
  return input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeMonth)
}

function expandRange(start: string, end: string): string[] {
  const normalizedStart = normalizeMonth(start)
  const normalizedEnd = normalizeMonth(end)
  if (!normalizedStart || !normalizedEnd) return DEFAULT_MONTHS
  const [sYear, sMonth] = normalizedStart.split('-').map(Number)
  const [eYear, eMonth] = normalizedEnd.split('-').map(Number)
  const result: string[] = []
  let year = sYear
  let month = sMonth
  while (year < eYear || (year === eYear && month <= eMonth)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }
  return result
}

function normalizeMonth(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})$/)
  if (!match) return trimmed
  const year = Number(match[1])
  const month = Math.min(Math.max(1, Number(match[2])), 12)
  return `${year}-${String(month).padStart(2, '0')}`
}

function createRng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function randomFloat(rng: () => number, min: number, max: number, step = 0.25) {
  const steps = Math.round((max - min) / step)
  const pick = randomInt(rng, 0, steps)
  return Number((min + pick * step).toFixed(2))
}

function pickRandom<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function getMonthBounds(months: string[]) {
  const [startYear, startMonth] = months[0].split('-').map(Number)
  const [endYear, endMonth] = months[months.length - 1].split('-').map(Number)
  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
  const lastDay = new Date(endYear, endMonth, 0).getDate()
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

async function ensureOrganizations(supabase: SupabaseClient): Promise<OrganizationRecord[]> {
  const results: OrganizationRecord[] = []
  for (const org of ORG_PRESETS) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', org.name)
      .maybeSingle()
    if (existing?.id) {
      results.push({ id: String(existing.id), name: String(existing.name), slug: org.slug })
      continue
    }
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: org.name,
        description: `[${SEED_TAG}] 자동 생성 소속`,
        address: org.address,
        phone: org.phone,
        is_active: true,
      })
      .select('id, name')
      .single()
    if (error) throw error
    results.push({ id: String(data.id), name: String(data.name), slug: org.slug })
  }
  console.log(`• Organizations ready: ${results.length}`)
  return results
}

async function ensureSites(
  supabase: SupabaseClient,
  siteCount: number,
  months: string[],
  orgs: OrganizationRecord[],
  createdBy: string | null,
  rng: () => number
): Promise<SiteRecord[]> {
  const sites: SiteRecord[] = []
  const start = months[0]
  const end = months[months.length - 1]
  const startDate = `${start}-01`
  const endDateLastDay = new Date(Number(end.split('-')[0]), Number(end.split('-')[1]), 0).getDate()
  const endDate = `${end}-${String(endDateLastDay).padStart(2, '0')}`
  for (let i = 0; i < siteCount; i++) {
    const org = orgs[i % orgs.length]
    const name = `PAYROLL DEMO 현장 ${String(i + 1).padStart(2, '0')}`
    const { data: existing } = await supabase
      .from('sites')
      .select('id, name')
      .eq('name', name)
      .maybeSingle()
    if (existing?.id) {
      sites.push({ id: String(existing.id), organization_id: org.id, name })
      continue
    }
    const payload = {
      name,
      organization_id: org.id,
      address: `${pickRandom(rng, ['서울', '부산', '대구', '창원', '용인'])}시 ${randomInt(rng, 1, 30)}로 ${randomInt(rng, 10, 99)}`,
      description: `[${SEED_TAG}] 자동 생성 현장`,
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      construction_manager_phone: `010-${randomInt(rng, 1000, 9999)}-${randomInt(rng, 1000, 9999)}`,
      safety_manager_phone: `010-${randomInt(rng, 1000, 9999)}-${randomInt(rng, 1000, 9999)}`,
      work_process: pickRandom(rng, ['토공', '철근', '마감', '슬라브']),
      component_name: pickRandom(rng, ['슬라브', '거더', '벽체', '기초']),
      is_deleted: false,
      created_by: createdBy,
    }
    const { data, error } = await supabase.from('sites').insert(payload).select('id, name').single()
    if (error) throw error
    sites.push({ id: String(data.id), organization_id: org.id, name })
  }
  console.log(`• Sites ready: ${sites.length}`)
  return sites
}

async function ensureProfile(supabase: SupabaseClient, seed: ProfileSeed): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', seed.email)
    .maybeSingle()
  if (existing?.id) {
    await supabase
      .from('profiles')
      .update({
        full_name: seed.fullName,
        role: seed.role,
        organization_id: seed.organizationId,
        site_id: seed.siteId || null,
        phone: seed.phone,
        status: 'active',
      })
      .eq('id', existing.id)
    return { id: String(existing.id) }
  }

  const adminResult = await supabase.auth.admin.createUser({
    email: seed.email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: seed.fullName, seed_tag: SEED_TAG },
  })
  let userId = adminResult?.data?.user?.id
  if (!userId) {
    if (adminResult.error?.message?.includes('already been registered')) {
      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      const match = listed?.data?.users?.find(
        u => (u.email || '').toLowerCase() === seed.email.toLowerCase()
      )
      if (match?.id) {
        userId = match.id
      }
    }
    if (!userId) {
      throw new Error(`Failed to create auth user for ${seed.email}: ${adminResult.error?.message}`)
    }
  }
  const profilePayload: Record<string, any> = {
    id: userId,
    email: seed.email,
    full_name: seed.fullName,
    role: seed.role,
    status: 'active',
    organization_id: seed.organizationId,
    site_id: seed.siteId || null,
    phone: seed.phone,
    company: seed.role === 'site_manager' ? 'DEMO HQ' : null,
    trade:
      seed.role === 'worker'
        ? pickRandom(createRng(seed.email), ['토공', '형틀', '철근', '콘크리트'])
        : null,
  }
  if (seed.dailyRate) {
    profilePayload.daily_wage = seed.dailyRate
    profilePayload.overtime_rate = 1.5
    profilePayload.tax_rate = EMPLOYMENT_CONFIG[seed.employmentType || 'regular_employee'].taxRate
    profilePayload.national_pension_rate =
      EMPLOYMENT_CONFIG[seed.employmentType || 'regular_employee'].nationalPension
    profilePayload.health_insurance_rate =
      EMPLOYMENT_CONFIG[seed.employmentType || 'regular_employee'].healthInsurance
    profilePayload.employment_insurance_rate =
      EMPLOYMENT_CONFIG[seed.employmentType || 'regular_employee'].employmentInsurance
  }

  const { error } = await supabase.from('profiles').insert(profilePayload)
  if (error) throw error
  return { id: userId }
}

async function ensureSiteManagers(
  supabase: SupabaseClient,
  sites: SiteRecord[]
): Promise<SiteManagerInfo[]> {
  const managers: SiteManagerInfo[] = []
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]
    const email = `payrolldemo.manager${String(i + 1).padStart(2, '0')}@${WORKER_EMAIL_DOMAIN}`
    const profile = await ensureProfile(supabase, {
      email,
      fullName: `데모 현장관리자 ${i + 1}`,
      role: 'site_manager',
      organizationId: site.organization_id,
      siteId: site.id,
      phone: `010-40${String(i).padStart(2, '0')}-${String(3000 + i)
        .toString()
        .padStart(4, '0')}`,
    })
    managers.push({ id: profile.id, siteId: site.id })
  }
  console.log(`• Site managers ready: ${managers.length}`)
  return managers
}

function generateWorkerSeeds(
  workerCount: number,
  sites: SiteRecord[],
  rng: () => number
): WorkerSeed[] {
  const seeds: WorkerSeed[] = []
  const employmentOptions: EmploymentType[] = ['regular_employee', 'freelancer', 'daily_worker']
  for (let i = 0; i < workerCount; i++) {
    const site = sites[i % sites.length]
    const employmentType = employmentOptions[i % employmentOptions.length]
    const dailyRateBase =
      employmentType === 'daily_worker' ? 150000 : employmentType === 'freelancer' ? 180000 : 200000
    const dailyRate = dailyRateBase + randomInt(rng, -10000, 20000)
    seeds.push({
      email: `payrolldemo.worker${String(i + 1).padStart(2, '0')}@${WORKER_EMAIL_DOMAIN}`,
      fullName: `데모 작업자 ${i + 1}`,
      organizationId: site.organization_id,
      siteId: site.id,
      employmentType,
      dailyRate,
      hourlyRate: Math.round((dailyRate / 8) * 100) / 100,
      phone: `010-${randomInt(rng, 4000, 9999)}-${randomInt(rng, 1000, 9999)}`,
    })
  }
  return seeds
}

async function ensureWorkers(
  supabase: SupabaseClient,
  workerSeeds: WorkerSeed[]
): Promise<WorkerProfileInfo[]> {
  const results: WorkerProfileInfo[] = []
  for (const [index, seed] of workerSeeds.entries()) {
    const profile = await ensureProfile(supabase, {
      ...seed,
      role: 'worker',
    })
    results.push({
      id: profile.id,
      email: seed.email,
      fullName: seed.fullName,
      siteId: seed.siteId!,
      organizationId: seed.organizationId,
      employmentType: seed.employmentType,
      dailyRate: seed.dailyRate!,
      hourlyRate: seed.hourlyRate || Math.round((seed.dailyRate! / 8) * 100) / 100,
    })
    if ((index + 1) % 5 === 0) {
      process.stdout.write('.')
    }
  }
  if (workerSeeds.length >= 5) process.stdout.write('\n')
  console.log(`• Workers ready: ${results.length}`)
  return results
}

async function ensureTaxRates(supabase: SupabaseClient) {
  const rateDefs: Array<{
    employment_type: EmploymentType
    tax_name: string
    rate: number
    description: string
  }> = [
    {
      employment_type: 'regular_employee',
      tax_name: '소득세',
      rate: 3.3,
      description: '근로소득세',
    },
    {
      employment_type: 'regular_employee',
      tax_name: '주민세',
      rate: 0.33,
      description: '소득세의 10%',
    },
    {
      employment_type: 'regular_employee',
      tax_name: '국민연금',
      rate: 4.5,
      description: '국민연금보험료',
    },
    {
      employment_type: 'regular_employee',
      tax_name: '건강보험',
      rate: 3.545,
      description: '건강보험료',
    },
    {
      employment_type: 'regular_employee',
      tax_name: '고용보험',
      rate: 0.9,
      description: '고용보험료',
    },
    { employment_type: 'freelancer', tax_name: '소득세', rate: 3.3, description: '사업소득세' },
    { employment_type: 'freelancer', tax_name: '주민세', rate: 0.33, description: '소득세의 10%' },
    {
      employment_type: 'daily_worker',
      tax_name: '소득세',
      rate: 6.0,
      description: '일용근로소득세',
    },
    { employment_type: 'daily_worker', tax_name: '주민세', rate: 0.6, description: '소득세의 10%' },
  ]

  for (const rate of rateDefs) {
    const { data: existing } = await supabase
      .from('employment_tax_rates')
      .select('id')
      .eq('employment_type', rate.employment_type)
      .eq('tax_name', rate.tax_name)
      .maybeSingle()
    if (existing?.id) continue
    await supabase.from('employment_tax_rates').insert({
      employment_type: rate.employment_type,
      tax_name: rate.tax_name,
      rate: rate.rate,
      calculation_method: 'percentage',
      description: `[${SEED_TAG}] ${rate.description}`,
      is_active: true,
    })
  }
  console.log('• Employment tax rates ensured')
}

async function ensureSalarySettings(
  supabase: SupabaseClient,
  workers: WorkerProfileInfo[],
  effectiveDate: string,
  creatorId: string | null
) {
  for (const worker of workers) {
    await supabase.from('worker_salary_settings').delete().eq('worker_id', worker.id)
    const bankAccount = {
      bank_name: pickRandom(createRng(worker.id), ['국민은행', '신한은행', '우리은행', '하나은행']),
      account_holder: worker.fullName,
      account_number: `${randomInt(createRng(worker.id), 100, 999)}-${randomInt(
        createRng(worker.email),
        1000,
        9999
      )}-${randomInt(createRng(worker.fullName), 100000, 999999)}`,
    }
    const { error } = await supabase.from('worker_salary_settings').insert({
      worker_id: worker.id,
      employment_type: worker.employmentType,
      daily_rate: worker.dailyRate,
      hourly_rate: worker.hourlyRate,
      effective_date: effectiveDate,
      is_active: true,
      bank_account_info: bankAccount,
      notes: `[${SEED_TAG}] 자동 생성`,
      created_by: creatorId,
    })
    if (error) throw error
  }
  console.log('• Worker salary settings refreshed')
}

async function cleanupSnapshots(supabase: SupabaseClient, workerIds: string[], months: string[]) {
  const storage = supabase.storage.from('documents')
  const targets: string[] = []
  for (const workerId of workerIds) {
    for (const month of months) {
      const ym = month
      targets.push(`salary-snapshots/${workerId}/${ym}.json`)
    }
  }
  if (targets.length === 0) return
  await storage.remove(targets)
}

async function cleanupWorkRecords(
  supabase: SupabaseClient,
  workerIds: string[],
  startDate: string,
  endDate: string
) {
  if (workerIds.length === 0) return
  await supabase
    .from('work_records')
    .delete()
    .in('profile_id', workerIds)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
}

async function seedWorkRecords(
  supabase: SupabaseClient,
  workers: WorkerProfileInfo[],
  managers: SiteManagerInfo[],
  months: string[],
  rng: () => number
): Promise<{ inserted: number; summaries: Map<string, WorkerMonthSummary> }> {
  const managerBySite = new Map<string, string>()
  managers.forEach(m => managerBySite.set(m.siteId, m.id))
  const summaries = new Map<string, WorkerMonthSummary>()
  let inserted = 0
  const batchSize = 200
  let buffer: Record<string, any>[] = []

  for (const month of months) {
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const isoDate = `${month}-${String(day).padStart(2, '0')}`
      const activeSites = new Map<string, WorkerProfileInfo[]>()
      for (const worker of workers) {
        if (!activeSites.has(worker.siteId)) activeSites.set(worker.siteId, [])
        activeSites.get(worker.siteId)!.push(worker)
      }
      for (const [siteId, siteWorkers] of activeSites.entries()) {
        if (rng() > 0.6) continue
        const participantsCount = Math.min(siteWorkers.length, randomInt(rng, 1, 3))
        const shuffled = [...siteWorkers].sort(() => rng() - 0.5)
        const participants = shuffled.slice(0, participantsCount)
        for (const worker of participants) {
          const laborHours = randomFloat(rng, 0.75, 1.5, 0.25)
          const workHours = Math.round(laborHours * 8 * 100) / 100
          const overtimeHours = Math.max(0, workHours - 8)
          const checkInHour = randomInt(rng, 7, 9)
          const checkOutHour = checkInHour + Math.round(workHours)
          const checkIn = `${String(checkInHour).padStart(2, '0')}:${pickRandom(rng, ['00', '10', '20', '30'])}`
          const checkOut = `${String(Math.min(21, checkOutHour)).padStart(2, '0')}:${pickRandom(rng, ['00', '10', '20', '30'])}`
          buffer.push({
            id: crypto.randomUUID(),
            profile_id: worker.id,
            user_id: worker.id,
            site_id: siteId,
            work_date: isoDate,
            labor_hours: laborHours,
            work_hours: workHours,
            overtime_hours: overtimeHours,
            role_type: 'worker',
            trade_type: pickRandom(rng, ['토공', '형틀', '철근', '용접']),
            skill_level: pickRandom(rng, ['숙련공', '중급', '초급']),
            hourly_rate: worker.hourlyRate,
            status: 'present',
            is_present: true,
            assigned_at: new Date(`${isoDate}T06:00:00Z`).toISOString(),
            assigned_by: managerBySite.get(siteId),
            check_in_time: checkIn,
            check_out_time: checkOut,
            notes: `[${SEED_TAG}] ${worker.fullName} ${isoDate} 근무`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          inserted++

          const summaryKey = `${worker.id}:${month}`
          if (!summaries.has(summaryKey)) {
            summaries.set(summaryKey, {
              workerId: worker.id,
              year,
              month: monthNum,
              totalLaborHours: 0,
              totalWorkHours: 0,
              totalOvertimeHours: 0,
              workDates: new Set<string>(),
              siteIds: new Set<string>(),
            })
          }
          const summary = summaries.get(summaryKey)!
          summary.totalLaborHours += laborHours
          summary.totalWorkHours += workHours
          summary.totalOvertimeHours += overtimeHours
          summary.workDates.add(isoDate)
          summary.siteIds.add(siteId)
        }
      }
      if (buffer.length >= batchSize) {
        await supabase.from('work_records').insert(buffer)
        buffer = []
      }
    }
  }
  if (buffer.length) {
    await supabase.from('work_records').insert(buffer)
  }
  console.log(`• Work records inserted: ${inserted}`)
  return { inserted, summaries }
}

function buildSnapshotPayload(
  worker: WorkerProfileInfo,
  summary: WorkerMonthSummary,
  issuerId: string | null
) {
  const monthLabel = `${summary.year}-${String(summary.month).padStart(2, '0')}`
  const config = EMPLOYMENT_CONFIG[worker.employmentType]
  const basePay = Math.round(worker.dailyRate * summary.totalLaborHours)
  const totalGrossPay = basePay
  const tax = Math.round((totalGrossPay * config.taxRate) / 100)
  const national = Math.round((totalGrossPay * config.nationalPension) / 100)
  const health = Math.round((totalGrossPay * config.healthInsurance) / 100)
  const employment = Math.round((totalGrossPay * config.employmentInsurance) / 100)
  const totalDeductions = tax + national + health + employment
  const netPay = totalGrossPay - totalDeductions
  const lastDay = new Date(summary.year, summary.month, 0).getDate()

  return {
    worker_id: worker.id,
    year: summary.year,
    month: summary.month,
    month_label: monthLabel,
    snapshot_version: 'payroll-demo-v1',
    html_template_version: 'v2024.11',
    issued_at: new Date().toISOString(),
    issuer_id: issuerId,
    employment_type: worker.employmentType,
    daily_rate: worker.dailyRate,
    status: 'issued',
    siteCount: summary.siteIds.size,
    workDays: summary.workDates.size,
    totalManDays: summary.totalLaborHours,
    totalLaborHours: summary.totalLaborHours,
    salary: {
      work_days: summary.workDates.size,
      total_labor_hours: summary.totalLaborHours,
      total_work_hours: summary.totalWorkHours,
      total_overtime_hours: summary.totalOvertimeHours,
      base_pay: basePay,
      total_gross_pay: totalGrossPay,
      tax_deduction: tax,
      national_pension: national,
      health_insurance: health,
      employment_insurance: employment,
      total_deductions: totalDeductions,
      net_pay: netPay,
      period_start: `${summary.year}-${String(summary.month).padStart(2, '0')}-01`,
      period_end: `${summary.year}-${String(summary.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    },
  }
}

async function saveSnapshot(
  supabase: SupabaseClient,
  payload: ReturnType<typeof buildSnapshotPayload>
) {
  const path = `salary-snapshots/${payload.worker_id}/${payload.month_label}.json`
  const buffer = Buffer.from(JSON.stringify(payload, null, 2))
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, buffer, { upsert: true, contentType: 'application/json' })
  if (error) throw error
}

async function createSnapshots(
  supabase: SupabaseClient,
  workers: WorkerProfileInfo[],
  summaries: Map<string, WorkerMonthSummary>,
  issuerId: string | null
) {
  let count = 0
  for (const summary of summaries.values()) {
    const worker = workers.find(w => w.id === summary.workerId)
    if (!worker) continue
    const payload = buildSnapshotPayload(worker, summary, issuerId)
    await saveSnapshot(supabase, payload)
    count++
  }
  console.log(`• Salary snapshots saved: ${count}`)
}

async function fetchAdminProfileId(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'system_admin'])
    .limit(1)
  if (data && data[0]) return String(data[0].id)
  const { data: fallback } = await supabase.from('profiles').select('id').limit(1)
  return fallback && fallback[0] ? String(fallback[0].id) : null
}

async function fullReset(supabase: SupabaseClient) {
  console.log('• Resetting previous payroll demo data...')
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', 'payrolldemo.%')
  const ids = (profiles || []).map(row => String(row.id))
  if (ids.length) {
    await supabase.from('work_records').delete().in('profile_id', ids)
    await supabase.from('worker_salary_settings').delete().in('worker_id', ids)
    const storage = supabase.storage.from('documents')
    const { data: objects } = await storage.list('salary-snapshots', { limit: 1000 })
    if (objects) {
      const toRemove = objects
        .filter(obj => ids.some(id => obj.name.startsWith(`${id}/`)))
        .map(obj => `salary-snapshots/${obj.name}`)
      if (toRemove.length) await storage.remove(toRemove)
    }
    for (const id of ids) {
      try {
        await supabase.auth.admin.deleteUser(id)
      } catch {
        // ignore missing users
      }
    }
  }
  await supabase.from('sites').delete().ilike('name', 'PAYROLL DEMO%')
  await supabase.from('organizations').delete().ilike('name', 'PAYROLL DEMO%')
}

async function main() {
  loadEnv()
  const options = parseArgs(process.argv)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env'
    )
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  if (options.reset) {
    await fullReset(supabase)
  }

  const rng = createRng(options.seed)
  const adminId = await fetchAdminProfileId(supabase)

  const orgs = await ensureOrganizations(supabase)
  const sites = await ensureSites(supabase, options.siteCount, options.months, orgs, adminId, rng)
  const managers = await ensureSiteManagers(supabase, sites)
  const workerSeeds = generateWorkerSeeds(options.workerCount, sites, rng) as Array<
    Omit<ProfileSeed, 'role'> & { employmentType: EmploymentType }
  >
  const workers = await ensureWorkers(supabase, workerSeeds)

  const { startDate, endDate } = getMonthBounds(options.months)
  await cleanupWorkRecords(
    supabase,
    workers.map(w => w.id),
    startDate,
    endDate
  )
  await cleanupSnapshots(
    supabase,
    workers.map(w => w.id),
    options.months
  )
  await ensureTaxRates(supabase)
  await ensureSalarySettings(supabase, workers, `${options.months[0]}-01`, adminId)

  const { summaries } = await seedWorkRecords(supabase, workers, managers, options.months, rng)
  await createSnapshots(supabase, workers, summaries, adminId)

  console.log('✅ Payroll demo seeding complete.')
  console.log(`   Months: ${options.months.join(', ')}`)
  console.log(`   Workers: ${workers.length}, Sites: ${sites.length}`)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
