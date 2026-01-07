#!/bin/bash

echo "=========================================="
echo "LEADERBOARD FIX DEPLOYMENT"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create a .env file with your Supabase credentials"
  exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing Supabase credentials in .env"
  echo "Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "✅ Found Supabase credentials"
echo ""

# Extract the project reference from the URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "📦 Project: $PROJECT_REF"
echo ""

# Apply the migration
echo "🚀 Applying leaderboard fix migration..."
echo ""

# Use psql if available, otherwise provide manual instructions
if command -v psql &> /dev/null; then
  # Construct the database URL
  DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
  
  psql "$DB_URL" -f supabase/migrations/20260107000000_fix_leaderboard_rls.sql
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
  else
    echo ""
    echo "⚠️  Migration failed. Please apply manually."
  fi
else
  echo "⚠️  psql not found. Please apply the migration manually:"
  echo ""
  echo "1. Go to your Supabase Dashboard"
  echo "2. Navigate to SQL Editor"
  echo "3. Run the SQL from: supabase/migrations/20260107000000_fix_leaderboard_rls.sql"
fi

echo ""
echo "=========================================="
echo "TESTING LEADERBOARD"
echo "=========================================="
echo ""

# Run diagnostic
echo "Running diagnostic..."
node diagnose-leaderboard.mjs

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify the leaderboard in your app"
echo "2. Check that all users with activity show correct stats"
echo "3. Test with new practice sessions to ensure data updates"
echo ""
