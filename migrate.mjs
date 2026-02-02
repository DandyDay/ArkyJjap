#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Note: This script requires SUPABASE_SERVICE_ROLE_KEY to execute DDL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to run migrations');
  console.error('');
  console.error('Please add it to your .env.local:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('You can find it at:');
  console.error('https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlPath = join(__dirname, 'supabase/migrations/001_initial_schema.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('🚀 Running database migration...');
console.log('');

try {
  // Split SQL into statements and execute them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Fallback: try using the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          console.error(`❌ Error executing statement:`, statement.substring(0, 50) + '...');
          console.error(error);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
      errorCount++;
    }
  }

  console.log('');
  console.log(`✅ Migration completed: ${successCount} statements executed, ${errorCount} errors`);

  if (errorCount > 0) {
    console.log('');
    console.log('⚠️  Some statements failed. This might be normal if tables already exist.');
    console.log('Please run the migration manually via Supabase Dashboard if needed:');
    console.log('https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new');
  }
} catch (error) {
  console.error('❌ Migration failed:', error);
  console.error('');
  console.error('Please run the migration manually via Supabase Dashboard:');
  console.error('1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new');
  console.error('2. Copy contents of: supabase/migrations/001_initial_schema.sql');
  console.error('3. Paste and click Run');
  process.exit(1);
}
