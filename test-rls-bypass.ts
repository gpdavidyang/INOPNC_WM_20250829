// Test script to bypass RLS and verify data existence
// Run this in Supabase SQL Editor to check if workers are actually being saved

const testQueries = `
-- 1. Check if workers are being saved (bypass RLS)
SELECT 
  drw.*,
  dr.reported_by,
  dr.site_id,
  dr.work_date
FROM daily_report_workers drw
JOIN daily_reports dr ON dr.id = drw.daily_report_id
ORDER BY drw.created_at DESC
LIMIT 10;

-- 2. Check current user
SELECT auth.uid() as current_user;

-- 3. Test RLS policy for viewing workers
SELECT 
  drw.*,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM daily_reports dr
      WHERE dr.id = drw.daily_report_id
      AND (
        dr.reported_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'site_manager')
        )
      )
    ) THEN 'VISIBLE'
    ELSE 'BLOCKED'
  END as rls_status
FROM daily_report_workers drw
LIMIT 10;

-- 4. Check if the column name is correct in RLS
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'daily_report_workers'
ORDER BY ordinal_position;

-- 5. Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daily_report_workers';
`;

export default testQueries;