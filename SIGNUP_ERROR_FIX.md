# Database Error Troubleshooting

## Error: "Database error saving new user"

This error occurs during signup when the database tables are not properly configured.

### Root Cause
The `user_profiles` table or trigger is missing. This table is created by the leaderboard migration and is required for new user signups.

### Quick Fix

**Option 1: Apply Migration via Supabase CLI** (Recommended)
```bash
cd /Users/snayak/Desktop/projects/communication
supabase db push
```

**Option 2: Run SQL Manually**

1. Go to Supabase Dashboard → SQL Editor
2. Run this diagnostic query first:

```sql
-- Check what's missing
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) AS user_profiles_exists;

SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;
```

3. If `user_profiles_exists` is FALSE, apply the main migration:
   - Copy contents of `supabase/migrations/20260106000000_add_user_profiles.sql`
   - Paste and run in SQL Editor

4. If you want privacy controls, also apply:
   - Copy contents of `supabase/migrations/20260106000100_add_leaderboard_privacy.sql`
   - Paste and run in SQL Editor

### Verify Fix

Run this query to confirm:

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM user_profiles) AS total_profiles,
  (SELECT COUNT(*) FROM user_progress) AS total_progress;
```

All three counts should match (or profiles/progress should be less than or equal to users).

### Test Signup

1. Try creating a new account
2. Check that the user profile was auto-created:

```sql
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;
```

You should see:
- Auto-generated username (e.g., "SwiftSpeaker2043")
- Random avatar_url (e.g., "avatar3.svg")
- show_in_leaderboard = true

### If Still Failing

Check the browser console for detailed error messages:
1. Open DevTools (F12)
2. Go to Console tab
3. Try signup again
4. Look for errors mentioning:
   - `user_profiles`
   - `user_progress`
   - `trigger`
   - RLS policies

Common issues:
- **42P01**: Table doesn't exist → Apply migration
- **23503**: Foreign key violation → user_id not found
- **42P09**: Permission denied → Check RLS policies

### Prevention

Always apply migrations before:
- Deploying to production
- Testing new features
- Allowing new signups

### Related Files
- Migration: `supabase/migrations/20260106000000_add_user_profiles.sql`
- Privacy: `supabase/migrations/20260106000100_add_leaderboard_privacy.sql`
- Diagnostic: `check-migrations.sql`
- Error handling: `src/stores/auth.js` (signUp function)
