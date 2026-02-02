#!/bin/bash

echo "🚀 Executing database migration..."
echo ""

# Load environment variables
source .env.local

# Extract project ref from URL
PROJECT_REF="wwvnypfoyadmnoglrxmn"

# Connection details
HOST="aws-0-ap-northeast-2.pooler.supabase.com"
PORT="6543"
USER="postgres.$PROJECT_REF"
DB="postgres"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Installing via Homebrew..."
    brew install postgresql@16
fi

# Prompt for database password
echo "📝 You need the database password."
echo "Find it at: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""
echo ""

# Execute migration
echo "🔄 Running migration..."
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$HOST" \
  -p "$PORT" \
  -U "$USER" \
  -d "$DB" \
  -f "supabase/migrations/001_initial_schema.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Database is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Open: http://localhost:3000"
    echo "3. Sign up and start creating canvases!"
else
    echo ""
    echo "❌ Migration failed."
    echo ""
    echo "Try manual migration:"
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: supabase/migrations/001_initial_schema.sql"
    echo "3. Paste and click Run"
fi
