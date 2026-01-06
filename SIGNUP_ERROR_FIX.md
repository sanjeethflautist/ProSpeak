# Database Error Troubleshooting

## Error: "Database error saving new user"

This error occurs during signup when the database tables are not properly configured or when Row Level Security (RLS) policies block automatic record creation.

### Root Causes
1. **RLS Policy Conflict**: The trigger function tried to insert into `user_progress` table, but RLS policies blocked it because there's no authenticated user context during the trigger execution.
2. **Multiple Triggers Conflict**: Having two separate triggers (`on_auth_user_created` and `on_auth_user_created_progress`) on the same table can cause race conditions or failures.
3. **Missing Tables**: The `user_profiles` or `user_progress` tables might not exist.

### The Fix
The updated migration (`20260106000200_auto_create_user_progress.sql`) now:
- Combines both user profile and user progress creation into a single trigger function
- Uses `SECURITY DEFINER` to bypass RLS policies during automatic record creation
- Uses `ON CONFLICT DO NOTHING` to handle duplicate insertions gracefully
- Includes proper error handling that doesn't block user signup even if something fails

### Quick Fix

**Apply the Updated Migration:**

1. **Via Supabase CLI** (Recommended):
```bash
cd /Users/snayak/Desktop/projects/communication
supabase db push
```

2. **Via Supabase Dashboard** (If CLI doesn't work):
   - Go to Supabase Dashboard → SQL Editor
   - Copy the entire contents of `supabase/migrations/20260106000200_auto_create_user_progress.sql`
   - Paste and run in SQL Editor
   - This will update the trigger function to properly handle both user profiles and progress

### Verify Fix

Run this query in Supabase SQL Editor to confirm the fix:

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM user_profiles) AS total_profiles,
  (SELECT COUNT(*) FROM user_progress) AS total_progress;
```

```sql
-- Verify the trigger function exists and includes both profile and progress creation
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_create_user_profile';

-- Check that only ONE trigger exists on auth.users
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- Verify tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_progress');
```

Expected results:
- `auto_create_user_profile` function should contain INSERT statements for both `user_profiles` AND `user_progress`
- Only ONE trigger named `on_auth_user_created` should exist
- Both `user_profiles` and `user_progress` tables should be listed

### Test Signup

1. Try creating a new account through the app
2. Check that both records were auto-created:

```sql
-- Check the most recent user profiles
SELECT up.username, up.avatar_url, up.created_at, pr.total_sessions
FROM user_profiles up
JOIN user_progress pr ON up.user_id = pr.user_id
ORDER BY up.created_at DESC LIMIT 5;
```

You should see:
- Auto-generated username (e.g., "SwiftSpeaker2043")
- Random avatar_url (e.g., "avatar3.svg")  
- User progress with 0 sessions (for new user)

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

Common PostgreSQL error codes:
- **42P01**: Table doesn't exist → Apply migration
- **23503**: Foreign key violation → Check auth.users
- **42501**: Permission denied → RLS policy blocking (fixed by SECURITY DEFINER)
- **23505**: Unique violation → User already exists (handled gracefully)

### What Changed

**Before**: Two separate triggers attempted to fire on the same event:
```sql
-- Old approach (BROKEN)
CREATE TRIGGER on_auth_user_created ...         -- Creates user_profiles
CREATE TRIGGER on_auth_user_created_progress ... -- Creates user_progress
```

**After**: Single trigger creates both records:
```sql
-- New approach (FIXED)
CREATE TRIGGER on_auth_user_created ...
  EXECUTE FUNCTION auto_create_user_profile();  -- Creates BOTH
```

The function uses `SECURITY DEFINER` to bypass RLS policies and `ON CONFLICT DO NOTHING` to handle race conditions.

### Related Files
- **Fixed Migration**: `supabase/migrations/20260106000200_auto_create_user_progress.sql`
- **Profile Setup**: `supabase/migrations/20260106000000_add_user_profiles.sql`
- **Privacy Controls**: `supabase/migrations/20260106000100_add_leaderboard_privacy.sql`
- **App Signup Logic**: `src/stores/auth.js` (signUp function)
