-- ============================================
-- COMPREHENSIVE DIAGNOSTIC
-- ============================================

-- 1. CHECK: Does the trigger actually exist and fire?
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 1: Trigger Configuration';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    tgname as trigger_name,
    tgenabled::text as enabled_code,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ ORIGIN (Fires for all inserts)'
        WHEN tgenabled = 'A' THEN '✅ ALWAYS (Fires even in replica mode)'
        WHEN tgenabled = 'R' THEN '⚠️ REPLICA (Only fires in replica mode)'
        WHEN tgenabled = 'D' THEN '❌ DISABLED'
        ELSE 'Unknown: ' || tgenabled::text
    END as status,
    tgtype,
    CASE 
        WHEN tgtype & 2 = 2 THEN '✅ BEFORE'
        WHEN tgtype & 4 = 4 THEN '✅ AFTER'
        ELSE '❓ Unknown timing'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN '✅ INSERT'
        ELSE '❓ Not INSERT'
    END as operation
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';

-- 2. CHECK: Session replication role (can disable triggers)
DO $$
DECLARE
    replication_role TEXT;
BEGIN
    SHOW session_replication_role INTO replication_role;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 2: Replication Role';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Current role: %', replication_role;
    IF replication_role = 'replica' THEN
        RAISE WARNING '⚠️ TRIGGERS ARE DISABLED! session_replication_role = replica';
        RAISE NOTICE 'This is why your trigger is not firing!';
    ELSE
        RAISE NOTICE '✅ Triggers should fire normally';
    END IF;
END $$;

-- 3. CHECK: Auth user status (confirmed vs unconfirmed)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 3: Recent Users Email Status';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    u.email,
    u.created_at,
    u.confirmed_at,
    CASE 
        WHEN u.confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
        ELSE '✅ CONFIRMED'
    END as email_status,
    CASE 
        WHEN up.user_id IS NULL THEN '❌ NO PROFILE'
        ELSE '✅ HAS PROFILE'
    END as profile_status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. CHECK: Does email confirmation affect trigger?
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 4: Email Confirmation Settings';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If users need to confirm email, the trigger fires';
    RAISE NOTICE 'when they click the confirmation link, NOT at signup!';
END $$;

-- 5. TEST: Can we manually call the trigger function?
DO $$
DECLARE
    test_user_id UUID := '66d73a82-e138-43d6-9c12-97fe52a11f65'; -- The user without profile
    test_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 5: Manual Function Test';
    RAISE NOTICE '========================================';
    
    -- Simulate the NEW record
    SELECT id, email, created_at INTO test_record
    FROM auth.users 
    WHERE id = test_user_id;
    
    IF test_record.id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user: % (%)', test_record.email, test_record.id;
        
        -- Try to manually execute what the trigger should do
        BEGIN
            PERFORM auto_create_user_profile();
            RAISE NOTICE '❓ Function executed (but needs NEW context from trigger)';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Function failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- 6. CHECK: RPC function exists?
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 6: RPC Fallback Function';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_proc 
WHERE proname = 'create_user_profile_manual';

-- 7. TEST: Can we call the RPC manually?
DO $$
DECLARE
    test_user_id UUID := '66d73a82-e138-43d6-9c12-97fe52a11f65';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 7: Testing RPC Function';
    RAISE NOTICE '========================================';
    
    BEGIN
        PERFORM create_user_profile_manual(test_user_id);
        RAISE NOTICE '✅ RPC function executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ RPC failed: %', SQLERRM;
    END;
END $$;

-- 8. CHECK: Final user status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC 8: Final Status Check';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    u.email,
    up.username,
    CASE 
        WHEN up.username IS NOT NULL THEN '✅ Profile created!'
        ELSE '❌ Still no profile'
    END as result
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = '66d73a82-e138-43d6-9c12-97fe52a11f65';

-- 9. SUMMARY
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Review the output above to identify the issue:';
    RAISE NOTICE '- If replication_role = replica: Triggers are disabled';
    RAISE NOTICE '- If users not confirmed: Trigger fires on confirmation, not signup';
    RAISE NOTICE '- If RPC failed: Check function permissions or dependencies';
END $$;
