# URGENT: Apply This to Fix Signup

## Step 1: Apply the Migration

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Create the function
CREATE OR REPLACE FUNCTION auto_create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (
    user_id,
    total_sessions,
    total_sentences,
    average_accuracy,
    current_streak,
    longest_streak,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already has progress, skip
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Could not create user_progress for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_progress ON auth.users;

CREATE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_progress();
```

## Step 2: Verify Trigger Exists

Run this check:

```sql
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created_progress';
```

Should return:
```
trigger_name: on_auth_user_created_progress
function_name: auto_create_user_progress
```

## Step 3: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

OR

1. Close all tabs with the app
2. Reopen in new tab

## Step 4: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Step 5: Test Signup

1. Try creating a new test account
2. Check browser console for any errors
3. If it works, verify in database:

```sql
SELECT * FROM user_progress 
WHERE user_id IN (
  SELECT id FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

## If Still Failing

Check the actual error in browser console:
1. Open DevTools → Console tab
2. Try signup
3. Look for the actual error message
4. Share the full error trace

Common issues:
- **"relation does not exist"** → Trigger not applied
- **"permission denied"** → RLS policy issue
- **"duplicate key"** → User already exists
- **Nothing happens** → Check Network tab for 500 errors
