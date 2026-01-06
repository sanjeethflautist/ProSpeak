#!/bin/bash

# Leaderboard Feature Deployment Script
echo "🚀 Deploying Leaderboard Feature..."
echo ""

# Step 1: Check avatars
echo "📸 Step 1: Checking avatar images..."
if [ ! -f "public/avatar1.svg" ]; then
    echo "⚠️  Avatar images not found in public/ directory"
    echo "   They should have been created already, but if missing:"
    echo "   Run: cd public && ls avatar*.svg"
    echo ""
else
    echo "✅ Avatar images found!"
fi

# Step 2: Apply database migration
echo ""
echo "💾 Step 2: Applying database migration..."
echo "   Run: supabase db push"
echo "   Or: Apply the migration file manually in Supabase dashboard"
echo ""

# Step 3: Verify tables
echo "🔍 Step 3: After migration, verify the tables:"
echo "   SELECT * FROM user_profiles LIMIT 5;"
echo ""

# Step 4: Test the app
echo "🧪 Step 4: Test the application:"
echo "   1. Start dev server: npm run dev"
echo "   2. Login to the app"
echo "   3. Navigate to /leaderboard"
echo "   4. Check your profile in Settings"
echo "   5. Try changing username and avatar"
echo ""

# Step 5: Deploy to production
echo "🌐 Step 5: Deploy to production:"
echo "   1. Commit changes: git add ."
echo "   2. Commit: git commit -m 'Add leaderboard and user profiles'"
echo "   3. Push: git push"
echo "   4. Deploy on Vercel (automatic)"
echo ""

echo "✨ Deployment checklist complete!"
echo ""
echo "📚 Documentation:"
echo "   - LEADERBOARD_FEATURE.md - Full feature documentation"
echo "   - AVATAR_SETUP.md - Avatar generation instructions"
