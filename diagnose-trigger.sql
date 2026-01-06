-- ============================================
-- DIAGNOSTIC: Check Trigger Setup
-- ============================================
-- Run this to see why the trigger isn't firing
-- ============================================

-- 1. Check if trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ Enabled'
        WHEN tgenabled = 'D' THEN '❌ Disabled'
        ELSE 'Unknown'
    END as status,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_create_user_profile';

-- 3. Check if generate_random_username exists
SELECT 
    p.proname as function_name,
    'EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'generate_random_username';

-- 4. Check user_profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check existing users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN up.user_id IS NULL THEN '❌ NO PROFILE'
        ELSE '✅ HAS PROFILE'
    END as profile_status,
    up.username
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Test the function manually (this will show any errors)
DO $$
DECLARE
    test_username TEXT;
BEGIN
    test_username := generate_random_username();
    RAISE NOTICE 'Generated username: %', test_username;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in generate_random_username: %', SQLERRM;
END $$;
