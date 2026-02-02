#!/bin/bash
set -e

echo "🔍 Checking requirements..."

# Check if we have the service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo ""
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not found"
  echo ""
  echo "To run migrations automatically, you need the service role key."
  echo ""
  echo "📝 Steps to get the service role key:"
  echo "1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/settings/api"
  echo "2. Copy the 'service_role' key (NOT the anon key)"
  echo "3. Add to .env.local:"
  echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  echo ""
  echo "Or run the migration manually:"
  echo "1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new"
  echo "2. Copy contents of: supabase/migrations/001_initial_schema.sql"
  echo "3. Paste and click 'Run'"
  echo ""
  exit 1
fi

echo "✅ Service role key found"
echo "🚀 Running migration..."

# Use psql to execute the migration
PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" psql \
  -h "aws-0-ap-northeast-2.pooler.supabase.com" \
  -p 6543 \
  -U "postgres.wwvnypfoyadmnoglrxmn" \
  -d "postgres" \
  -f "supabase/migrations/001_initial_schema.sql"

echo "✅ Migration completed!"
