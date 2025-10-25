import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const svc = createServiceClient()

  const check = async (table: string) => {
    try {
      const { count, error } = await svc.from(table).select('id', { count: 'exact', head: true })
      if (error) {
        // If table not exists, PostgREST returns error with Postgres code 42P01
        const m = (error as any)?.message || String(error)
        const code = (error as any)?.code || ''
        if (code === '42P01' || /does not exist/i.test(m)) {
          return { exists: false, error: m }
        }
        return { exists: false, error: m || 'unknown error' }
      }
      return { exists: true, rows: count || 0 }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      if (/does not exist/i.test(m)) return { exists: false, error: m }
      return { exists: false, error: m }
    }
  }

  const sheets = await check('photo_sheets')
  const items = await check('photo_sheet_items')

  return NextResponse.json({
    success: true,
    photo_sheets: sheets,
    photo_sheet_items: items,
    hint:
      !sheets.exists || !items.exists
        ? 'Apply migrations/2025-10-25_create_photo_sheets.sql to create missing tables.'
        : undefined,
  })
}
