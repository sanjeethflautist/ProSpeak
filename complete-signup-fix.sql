-- ============================================
-- COMPLETE SIGNUP FIX - ALL REQUIRED COMPONENTS
-- ============================================
-- Run this complete script in Supabase SQL Editor
-- It includes EVERYTHING needed for automatic username generation
-- ============================================

-- ============================================
-- PART 1: CREATE USER_PROFILES TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT NOT NULL DEFAULT 'avatar1.svg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create policies
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 2: FUNCTION TO GENERATE RANDOM USERNAME
-- ============================================

DROP FUNCTION IF EXISTS generate_random_username() CASCADE;

CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Swift', 'Eloquent', 'Fluent', 'Bold', 'Clever', 'Bright', 'Quick', 
    'Sharp', 'Smart', 'Witty', 'Mighty', 'Noble', 'Wise', 'Brave', 'Calm',
    'Epic', 'Grand', 'Royal', 'Golden', 'Silver', 'Stellar', 'Cosmic',
    'Radiant', 'Dynamic', 'Vibrant', 'Stellar', 'Prime', 'Elite', 'Supreme'
  ];
  nouns TEXT[] := ARRAY[
    'Speaker', 'Orator', 'Voice', 'Talker', 'Communicator', 'Wordsmith', 
    'Linguist', 'Narrator', 'Storyteller', 'Presenter', 'Debater', 'Sage',
    'Scholar', 'Master', 'Expert', 'Pro', 'Champion', 'Leader', 'Wizard',
    'Guru', 'Maestro', 'Artist', 'Genius', 'Legend', 'Star', 'Hero'
  ];
  random_username TEXT;
  random_number INTEGER;
  username_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate random username
    random_number := floor(random() * 9999 + 1)::INTEGER;
    random_username := adjectives[floor(random() * array_length(adjectives, 1) + 1)] || 
                      nouns[floor(random() * array_length(nouns, 1) + 1)] || 
                      random_number::TEXT;
    
    -- Check if username already exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE username = random_username) INTO username_exists;
    
    -- Exit if username is unique or we've tried too many times
    IF NOT username_exists OR attempt_count >= max_attempts THEN
      EXIT;
    END IF;
    
    attempt_count := attempt_count + 1;
  END LOOP;
  
  RETURN random_username;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: DROP OLD TRIGGERS AND FUNCTIONS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_progress ON auth.users;
DROP FUNCTION IF EXISTS auto_create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS auto_create_user_progress() CASCADE;

-- ============================================
-- PART 4: CREATE COMBINED TRIGGER FUNCTION
-- ============================================

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

COMMENT ON FUNCTION auto_create_user_profile IS 'Automatically creates user_profile and user_progress records when a new user signs up';

-- ============================================
-- PART 5: CREATE THE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_profile();

-- ============================================
-- PART 6: CREATE PROFILES FOR EXISTING USERS
-- ============================================

DO $$
DECLARE
  user_record RECORD;
  random_username TEXT;
  random_avatar TEXT;
  avatar_options TEXT[] := ARRAY[
    'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 
    'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
    'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
  ];
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_profiles)
  LOOP
    random_username := generate_random_username();
    random_avatar := avatar_options[floor(random() * array_length(avatar_options, 1) + 1)];
    
    INSERT INTO user_profiles (user_id, username, avatar_url)
    VALUES (user_record.id, random_username, random_avatar)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- PART 7: CREATE PROGRESS FOR EXISTING USERS
-- ============================================

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

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Setup complete! Verifying...' as status;

-- Check tables exist
SELECT 
  COUNT(*) FILTER (WHERE tablename = 'user_profiles') as profiles_table,
  COUNT(*) FILTER (WHERE tablename = 'user_progress') as progress_table
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_progress');

-- Check function exists
SELECT COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('generate_random_username', 'auto_create_user_profile');

-- Check trigger exists
SELECT COUNT(*) as trigger_count
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';

-- Show sample profiles
SELECT username, avatar_url, created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;
