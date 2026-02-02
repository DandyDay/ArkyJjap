#!/bin/bash

# Load environment
source .env.local

echo "🚀 Attempting to execute migration via Supabase API..."
echo ""

# Read SQL file
SQL_CONTENT=$(cat supabase/migrations/001_initial_schema.sql)

# Try using Supabase Management API
curl -X POST \
  "https://${NEXT_PUBLIC_SUPABASE_URL#https://}/rest/v1/rpc/query" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}" \
  2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ API method not available."
  echo ""
  echo "📋 Please use the manual method:"
  echo "1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new"
  echo "2. Copy: supabase/migrations/001_initial_schema.sql"
  echo "3. Paste and Run"
fi
