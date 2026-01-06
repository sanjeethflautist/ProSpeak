-- Quick diagnostic query to check if migrations are applied
-- Run this in Supabase SQL Editor

-- Check if user_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) AS user_profiles_exists;

-- Check if the trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- Check if the function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'auto_create_user_profile'
) AS function_exists;

-- Check if show_in_leaderboard column exists (privacy migration)
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name = 'show_in_leaderboard'
) AS privacy_column_exists;

-- If tables exist, check counts
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM user_profiles) AS total_profiles,
  (SELECT COUNT(*) FROM user_progress) AS total_progress;
