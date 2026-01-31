import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('Running manual migration for system_configurations...')

  // We use query because RPC might not exist
  const { error: tableError } = await supabase
    .from('system_configurations')
    .select('*')
    .limit(0)
    .catch(() => ({ error: { code: '42P01' } }))

  const sql = `
    CREATE TABLE IF NOT EXISTS system_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value JSONB,
        data_type TEXT DEFAULT 'text',
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'system_configurations' 
            AND policyname = 'Allow all access for authenticated users'
        ) THEN
            CREATE POLICY "Allow all access for authenticated users" ON system_configurations
                FOR ALL TO authenticated USING (true) WITH CHECK (true);
        END IF;
    END
    $$;
  `

  // Note: Standard Supabase JS doesn't support raw SQL.
  // If the user has a custom RPC for SQL, we could use it.
  // Otherwise, we just inform the user.
  console.log('SQL to run in Supabase SQL Editor:')
  console.log(sql)
}

runMigration()
