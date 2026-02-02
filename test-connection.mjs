import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase connection...');

// Try to query auth schema
const { data, error } = await supabase.auth.getSession();

if (error) {
  console.log('❌ Connection test failed:', error.message);
} else {
  console.log('✅ Connected to Supabase');
  console.log('Note: Anon key can only access client-side operations');
  console.log('To run migrations, you need the SERVICE_ROLE_KEY');
  console.log('');
  console.log('Get it from:');
  console.log('https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/settings/api');
}
