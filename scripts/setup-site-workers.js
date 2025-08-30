const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
-- Create site_workers table for managing worker assignments to sites
CREATE TABLE IF NOT EXISTS site_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unassigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  trade VARCHAR(100),
  position VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure a worker can only have one active assignment per site
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_site_worker 
  ON site_workers(site_id, user_id) 
  WHERE is_active = true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_site_workers_site_id ON site_workers(site_id);
CREATE INDEX IF NOT EXISTS idx_site_workers_user_id ON site_workers(user_id);
CREATE INDEX IF NOT EXISTS idx_site_workers_is_active ON site_workers(is_active);
CREATE INDEX IF NOT EXISTS idx_site_workers_assigned_at ON site_workers(assigned_at);

-- Add RLS policies
ALTER TABLE site_workers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all site workers" ON site_workers;
DROP POLICY IF EXISTS "Supervisors can view their site workers" ON site_workers;
DROP POLICY IF EXISTS "Workers can view their own assignments" ON site_workers;

-- Policy for admins to manage all site workers
CREATE POLICY "Admins can manage all site workers" ON site_workers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Policy for supervisors to view workers in their sites
CREATE POLICY "Supervisors can view their site workers" ON site_workers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supervisor'
      AND EXISTS (
        SELECT 1 FROM site_workers sw
        WHERE sw.site_id = site_workers.site_id
        AND sw.user_id = auth.uid()
        AND sw.is_active = true
      )
    )
  );

-- Policy for workers to view their own assignments
CREATE POLICY "Workers can view their own assignments" ON site_workers
  FOR SELECT
  USING (user_id = auth.uid());

-- Update profiles table to add work-related fields if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS trade VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

-- Policy for admins to view all activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_site_workers_updated_at ON site_workers;

-- Create trigger for site_workers updated_at
CREATE TRIGGER update_site_workers_updated_at
  BEFORE UPDATE ON site_workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`

async function setupDatabase() {
  try {
    console.log('Setting up site_workers table...')
    
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // If RPC doesn't exist, we'll need to execute manually
      console.error('Note: Direct SQL execution not available via RPC')
      console.log('\nPlease execute the following SQL in Supabase SQL Editor:')
      console.log('=' .repeat(60))
      console.log(sql)
      console.log('=' .repeat(60))
    } else {
      console.log('✅ Database setup completed successfully!')
    }
    
    // Check if table was created
    const { data: tables, error: tablesError } = await supabase
      .from('site_workers')
      .select('id')
      .limit(1)
    
    if (!tablesError) {
      console.log('✅ site_workers table exists and is accessible')
    } else {
      console.log('⚠️ site_workers table may need to be created manually')
    }
    
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

setupDatabase()