-- ============================================
-- FIX MISSING PROFILE AND TEST TRIGGER
-- ============================================

-- 1. Create profile for the missing user (sanjee@gmail.com)
DO $$
DECLARE
  missing_user_id UUID := '66d73a82-e138-43d6-9c12-97fe52a11f65';
  random_username TEXT;
  random_avatar TEXT;
  avatar_options TEXT[] := ARRAY[
    'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 
    'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
    'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
  ];
BEGIN
  -- Generate username and avatar
  random_username := generate_random_username();
  random_avatar := avatar_options[floor(random() * array_length(avatar_options, 1) + 1)];
  
  -- Create profile
  INSERT INTO public.user_profiles (user_id, username, avatar_url)
  VALUES (missing_user_id, random_username, random_avatar)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create progress
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
    missing_user_id,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Fixed profile for user: %', missing_user_id;
END $$;

-- 2. Verify the fix
SELECT 
    u.email,
    up.username,
    up.avatar_url,
    pr.total_sessions
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
JOIN user_progress pr ON u.id = pr.user_id
WHERE u.id = '66d73a82-e138-43d6-9c12-97fe52a11f65';

-- 3. Check all users now have profiles
SELECT 
    COUNT(*) as total_users,
    COUNT(up.user_id) as users_with_profiles,
    COUNT(*) - COUNT(up.user_id) as missing_profiles
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- 4. Verify trigger is ready for NEW signups
SELECT 
    '✅ Trigger exists and is enabled' as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created'
AND tgenabled = 'O';
