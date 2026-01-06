-- ============================================
-- FIX FOR: Database error saving new user
-- ============================================
-- This script fixes the signup issue by combining both user profile 
-- and user progress creation into a single trigger function.
-- Run this in Supabase SQL Editor if you can't use the CLI.
-- ============================================

-- Drop the conflicting trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_progress ON auth.users;
DROP FUNCTION IF EXISTS auto_create_user_progress();

-- Update the auto_create_user_profile function to also create user_progress
DROP FUNCTION IF EXISTS auto_create_user_profile() CASCADE;

CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  random_username TEXT;
  random_avatar TEXT;
  avatar_options TEXT[] := ARRAY[
    'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 
    'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
    'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
  ];
BEGIN
  -- Generate random username and avatar
  random_username := generate_random_username();
  random_avatar := avatar_options[floor(random() * array_length(avatar_options, 1) + 1)];
  
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, username, avatar_url)
  VALUES (NEW.id, random_username, random_avatar)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user progress record (bypasses RLS because of SECURITY DEFINER)
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
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    RAISE WARNING 'Could not create user profile/progress for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_profile();

COMMENT ON FUNCTION auto_create_user_profile IS 'Automatically creates user_profile and user_progress records when a new user signs up';

-- Create user_progress for any existing users that don't have one
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_progress)
  LOOP
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
      user_record.id,
      0,
      0,
      0,
      0,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- Verify the fix
SELECT 'Fix applied successfully! Checking configuration...' as status;

SELECT 
  COUNT(*) FILTER (WHERE tablename = 'user_profiles') as profiles_table,
  COUNT(*) FILTER (WHERE tablename = 'user_progress') as progress_table
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_progress');

SELECT COUNT(*) as trigger_count, tgname as trigger_name
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
GROUP BY tgname;
