#!/bin/bash

# ============================================
# Apply Signup Fix to Supabase Database
# ============================================
# This script applies the database migrations that fix:
# 1. "Database error saving new user"
# 2. Automatic username/avatar generation
# 3. Automatic user_progress creation
# ============================================

echo "🔧 Applying signup fix to Supabase database..."
echo ""

echo "Choose your deployment method:"
echo "1. Supabase CLI (Recommended)"
echo "2. Manual SQL (via Supabase Dashboard)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📤 Pushing migrations to Supabase..."
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI not found!"
        echo "Install it with: brew install supabase/tap/supabase"
        echo "Or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    
    # Check if logged in
    echo "Checking Supabase login status..."
    if ! supabase projects list &> /dev/null; then
        echo "🔑 Please login to Supabase:"
        supabase login
    fi
    
    # Push migrations
    echo ""
    echo "Pushing migrations to your Supabase project..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations applied successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Test creating a new user account"
        echo "2. Check the user gets an auto-generated username"
        echo "3. Verify in Supabase Dashboard: SQL Editor → Run:"
        echo "   SELECT username, avatar_url FROM user_profiles ORDER BY created_at DESC LIMIT 5;"
    else
        echo ""
        echo "❌ Failed to push migrations"
        echo "Try manual method (option 2) or check your Supabase project connection"
    fi
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📋 Manual SQL Method:"
    echo ""
    echo "1. Open your Supabase Dashboard"
    echo "2. Go to SQL Editor"
    echo "3. Copy the contents of: fix-signup-trigger.sql"
    echo "4. Paste and run in SQL Editor"
    echo ""
    echo "The file path is:"
    echo "   $(pwd)/fix-signup-trigger.sql"
    echo ""
    
    if [ -f "fix-signup-trigger.sql" ]; then
        echo "✅ File exists and is ready to copy!"
        echo ""
        read -p "Press Enter to open the file in your default editor..."
        open fix-signup-trigger.sql 2>/dev/null || cat fix-signup-trigger.sql
    else
        echo "❌ fix-signup-trigger.sql not found!"
        echo "Make sure you're in the project directory"
    fi
else
    echo "Invalid choice. Please run the script again and select 1 or 2."
    exit 1
fi
