-- ============================================
-- FIX: Enable Trigger with Better Logging
-- ============================================
-- This recreates the trigger with enhanced error logging
-- ============================================

-- Drop and recreate with explicit schema and better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.auto_create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  random_username TEXT;
  random_avatar TEXT;
  avatar_options TEXT[] := ARRAY[
    'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 
    'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
    'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
  ];
BEGIN
  -- Log that trigger is firing
  RAISE NOTICE 'Trigger firing for user: %', NEW.id;
  
  -- Generate random username and avatar
  BEGIN
    random_username := public.generate_random_username();
    RAISE NOTICE 'Generated username: %', random_username;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to generate username for user %: %', NEW.id, SQLERRM;
      random_username := 'User' || substr(NEW.id::text, 1, 8);
  END;
  
  random_avatar := avatar_options[floor(random() * array_length(avatar_options, 1) + 1)];
  RAISE NOTICE 'Selected avatar: %', random_avatar;
  
  -- Create user profile
  BEGIN
    INSERT INTO public.user_profiles (user_id, username, avatar_url)
    VALUES (NEW.id, random_username, random_avatar)
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Created user_profile for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user_profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Create user progress record
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
    )
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Created user_progress for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user_progress for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    RAISE WARNING 'CRITICAL ERROR in auto_create_user_profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_profile();

-- Verify it's enabled
SELECT 
    tgname,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';

RAISE NOTICE 'Trigger recreated with enhanced logging. Check Supabase logs after creating a user.';
