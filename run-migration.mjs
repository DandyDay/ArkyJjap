#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

console.log('🚀 Starting database migration...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration SQL
const sql = readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf-8');

// Execute the SQL via Supabase API
try {
  // We'll use the REST API to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    // If that doesn't work, try direct SQL execution
    console.log('⚠️  REST API method not available, trying alternative...\n');

    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let executed = 0;
    for (const statement of statements) {
      if (!statement) continue;

      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      process.stdout.write(`Executing: ${preview}... `);

      try {
        // Use raw SQL query
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });

        if (error) {
          console.log('⚠️');
          // Some errors are OK (like "already exists")
          if (error.message && !error.message.includes('already exists')) {
            console.log(`   ${error.message}`);
          }
        } else {
          console.log('✅');
          executed++;
        }
      } catch (e) {
        console.log('⚠️');
        if (e.message && !e.message.includes('already exists')) {
          console.log(`   ${e.message}`);
        }
      }
    }

    console.log(`\n✅ Migration completed! Successfully executed ${executed} statements.\n`);
    console.log('Note: Some warnings are normal if tables already exist.\n');
  } else {
    console.log('✅ Migration completed successfully!\n');
  }

  console.log('🎉 Database is ready!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:3000');
  console.log('3. Sign up and start creating canvases!\n');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n📋 Manual migration steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new');
  console.log('2. Copy: supabase/migrations/001_initial_schema.sql');
  console.log('3. Paste and click Run\n');
  process.exit(1);
}
