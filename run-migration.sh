#!/bin/bash

# Supabase Migration Runner
# This script helps you run the database migration

echo "🚀 Arky Clone - Database Migration"
echo "=================================="
echo ""
echo "Option 1: Via Supabase Dashboard (Recommended)"
echo "----------------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new"
echo "2. Copy the contents of: supabase/migrations/001_initial_schema.sql"
echo "3. Paste and click 'Run'"
echo ""
echo "Option 2: Via CLI with Database Password"
echo "----------------------------------------"
echo "If you have the database password, run:"
echo ""
echo "  npx supabase db push --db-url 'postgresql://postgres.wwvnypfoyadmnoglrxmn:[YOUR_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'"
echo ""
echo "Option 3: Via Supabase CLI (if logged in)"
echo "------------------------------------------"
echo "1. Login: npx supabase login"
echo "2. Link project: npx supabase link --project-ref wwvnypfoyadmnoglrxmn"
echo "3. Push migrations: npx supabase db push"
echo ""
